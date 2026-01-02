import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useNarrativeStore } from "@/store/narrativeStore";
import { cn } from "@/lib/utils";
import type { NarrativeSchema, Tension, BusinessContext, KeyClaim } from "@/lib/types";

interface QualityMetric {
  name: string;
  score: number;
  weight: number;
}

// Generic title patterns that indicate low specificity
const GENERIC_TITLE_PATTERNS = [
  /^(the|a|an)\s/i,
  /^(key|main|important)\s/i,
  /overview$/i,
  /summary$/i,
  /conclusion$/i,
  /introduction$/i,
];

// Check if a title is specific (contains numbers, proper nouns, or domain terms)
const isSpecificTitle = (title: string): boolean => {
  if (!title) return false;
  const hasNumbers = /\d/.test(title);
  const hasPercentage = /%/.test(title);
  const isShort = title.split(' ').length <= 2;
  const isGeneric = GENERIC_TITLE_PATTERNS.some(p => p.test(title));
  return (hasNumbers || hasPercentage || !isGeneric) && !isShort;
};

export const calculateNarrativeQuality = (
  narrative: NarrativeSchema | null,
  rawText: string,
  tensions: Tension[],
  businessContext: BusinessContext | null,
  keyClaims?: KeyClaim[]
): { overall: number; metrics: QualityMetric[] } => {
  if (!narrative) return { overall: 0, metrics: [] };

  const metrics: QualityMetric[] = [];

  // 1. Structure coherence (20%) - More granular scoring
  const completeSections = narrative.sections.filter(s => s.title && s.content && s.content.length > 30);
  const structureBase = (completeSections.length / narrative.sections.length) * 70;
  const sectionCountBonus = narrative.sections.length >= 5 ? 15 : narrative.sections.length >= 3 ? 10 : 0;
  const hasItemsBonus = narrative.sections.some(s => s.items && s.items.length > 0) ? 10 : 0;
  const structureScore = Math.min(100, structureBase + sectionCountBonus + hasItemsBonus);
  metrics.push({ name: "Structure", score: Math.round(structureScore), weight: 0.20 });

  // 2. Content Efficiency (20%) - Input to output ratio
  const totalOutputLength = narrative.sections.reduce((acc, s) => {
    return acc + (s.title?.length || 0) + (s.content?.length || 0) + (s.items?.join('').length || 0);
  }, 0);
  const inputOutputRatio = rawText.length > 0 ? totalOutputLength / rawText.length : 0;
  // Sweet spot is 0.3-0.6 ratio (summarization without losing too much)
  let efficiencyScore: number;
  if (inputOutputRatio < 0.1) efficiencyScore = 40; // Too much compression
  else if (inputOutputRatio < 0.25) efficiencyScore = 60;
  else if (inputOutputRatio < 0.5) efficiencyScore = 85;
  else if (inputOutputRatio < 0.8) efficiencyScore = 75;
  else efficiencyScore = 55; // Not enough summarization
  metrics.push({ name: "Efficiency", score: efficiencyScore, weight: 0.20 });

  // 3. Specificity (15%) - Are titles/content specific or generic?
  const specificTitles = narrative.sections.filter(s => isSpecificTitle(s.title || ''));
  const specificityRatio = specificTitles.length / narrative.sections.length;
  const specificityScore = Math.round(40 + specificityRatio * 60);
  metrics.push({ name: "Specificity", score: specificityScore, weight: 0.15 });

  // 4. Tension Balance (15%) - Wider variance
  let tensionScore: number;
  if (tensions.length === 0) tensionScore = 50; // No analysis = lower score
  else if (tensions.length === 1) tensionScore = 65;
  else if (tensions.length === 2) tensionScore = 80;
  else if (tensions.length === 3) tensionScore = 90;
  else if (tensions.length === 4) tensionScore = 85;
  else tensionScore = 70; // Too many = analysis paralysis
  metrics.push({ name: "Risk Analysis", score: tensionScore, weight: 0.15 });

  // 5. Personalization (15%) - More granular
  let personalizationScore = 30; // Base score
  if (businessContext) {
    if (businessContext.companyName) personalizationScore += 20;
    if (businessContext.industry) personalizationScore += 15;
    if (businessContext.valuePropositions && businessContext.valuePropositions.length > 0) personalizationScore += 20;
    if (businessContext.brandVoice) personalizationScore += 10;
    if (businessContext.logoUrl || businessContext.userUploadedLogoUrl) personalizationScore += 5;
  }
  metrics.push({ name: "Personalization", score: Math.min(100, personalizationScore), weight: 0.15 });

  // 6. Claim Quality (15%) - If claims were reviewed
  if (keyClaims && keyClaims.length > 0) {
    const reviewedClaims = keyClaims.filter(c => c.approved !== null);
    const approvedClaims = keyClaims.filter(c => c.approved === true);
    const editedClaims = keyClaims.filter(c => c.edited);
    
    let claimScore = 50; // Base
    if (reviewedClaims.length > 0) {
      const reviewRatio = reviewedClaims.length / keyClaims.length;
      const approvalRatio = approvedClaims.length / Math.max(1, reviewedClaims.length);
      claimScore = Math.round(30 + reviewRatio * 30 + approvalRatio * 30 + (editedClaims.length > 0 ? 10 : 0));
    }
    metrics.push({ name: "Claim Review", score: claimScore, weight: 0.15 });
    
    // Rebalance weights when claim review is included
    metrics.forEach(m => {
      if (m.name !== "Claim Review") m.weight = m.weight * 0.85 / 0.85;
    });
  }

  // Calculate weighted overall
  const totalWeight = metrics.reduce((acc, m) => acc + m.weight, 0);
  const overall = Math.round(
    metrics.reduce((acc, m) => acc + m.score * m.weight, 0) / totalWeight
  );

  return { overall, metrics };
};

interface NarrativeQualityScoreProps {
  compact?: boolean;
}

export const NarrativeQualityScore = ({ compact = false }: NarrativeQualityScoreProps) => {
  const { narrative, rawText, tensions, businessContext, keyClaims } = useNarrativeStore();
  const [displayScore, setDisplayScore] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  const { overall, metrics } = useMemo(
    () => calculateNarrativeQuality(narrative, rawText, tensions, businessContext, keyClaims),
    [narrative, rawText, tensions, businessContext, keyClaims]
  );

  // Animate score counting up
  useEffect(() => {
    if (overall === 0) return;
    
    let current = 0;
    const increment = overall / 40;
    const timer = setInterval(() => {
      current += increment;
      if (current >= overall) {
        setDisplayScore(overall);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.round(current));
      }
    }, 25);

    return () => clearInterval(timer);
  }, [overall]);

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-400";
    if (score >= 70) return "text-shimmer-start";
    if (score >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 75) return "Strong";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Work";
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="relative w-10 h-10">
          <svg className="w-10 h-10 -rotate-90">
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="3"
            />
            <motion.circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="hsl(var(--shimmer-start))"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={100}
              initial={{ strokeDashoffset: 100 }}
              animate={{ strokeDashoffset: 100 - overall }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </svg>
          <span className={cn("absolute inset-0 flex items-center justify-center text-xs font-bold", getScoreColor(overall))}>
            {displayScore}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">NQS</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main gauge */}
      <div 
        className="flex flex-col items-center cursor-pointer"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="8"
            />
            <motion.circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="hsl(var(--shimmer-start))"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={352}
              initial={{ strokeDashoffset: 352 }}
              animate={{ strokeDashoffset: 352 - (overall / 100) * 352 }}
              transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span 
              className={cn("text-3xl font-bold", getScoreColor(overall))}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              {displayScore}
            </motion.span>
            <span className="text-xs text-muted-foreground">{getScoreLabel(overall)}</span>
          </div>
        </div>
        <span className="text-xs text-muted-foreground mt-2">Narrative Quality Score</span>
      </div>

      {/* Detailed breakdown */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-2 pt-2 border-t border-border/50"
        >
          {metrics.map((metric, i) => (
            <motion.div
              key={metric.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-muted-foreground">{metric.name}</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 rounded-full bg-border overflow-hidden">
                  <motion.div
                    className="h-full bg-shimmer-start"
                    initial={{ width: 0 }}
                    animate={{ width: `${metric.score}%` }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                  />
                </div>
                <span className={cn("w-6 text-right", getScoreColor(metric.score))}>
                  {Math.round(metric.score)}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNarrativeStore } from "@/store/narrativeStore";
import { cn } from "@/lib/utils";
import type { NarrativeSchema, Tension, BusinessContext } from "@/lib/types";

interface QualityMetric {
  name: string;
  score: number;
  weight: number;
}

export const calculateNarrativeQuality = (
  narrative: NarrativeSchema | null,
  rawText: string,
  tensions: Tension[],
  businessContext: BusinessContext | null
): { overall: number; metrics: QualityMetric[] } => {
  if (!narrative) return { overall: 0, metrics: [] };

  const metrics: QualityMetric[] = [];

  // Structure coherence (sections have titles, content, logical flow)
  const structureScore = Math.min(100, 
    (narrative.sections.filter(s => s.title && s.content).length / narrative.sections.length) * 100 +
    (narrative.sections.length >= 4 ? 20 : 0)
  );
  metrics.push({ name: "Structure", score: structureScore, weight: 0.25 });

  // Data density (how much of the input is utilized)
  const avgContentLength = narrative.sections.reduce((acc, s) => acc + (s.content?.length || 0), 0) / narrative.sections.length;
  const densityScore = Math.min(100, (avgContentLength / 150) * 100);
  metrics.push({ name: "Data Density", score: densityScore, weight: 0.2 });

  // Call to action clarity (last section typically has CTA)
  const lastSection = narrative.sections[narrative.sections.length - 1];
  const ctaScore = lastSection?.items && lastSection.items.length > 0 ? 85 : 
                   lastSection?.content?.length > 50 ? 70 : 50;
  metrics.push({ name: "Call to Action", score: ctaScore, weight: 0.15 });

  // Tension balance (not too safe, not too risky)
  const tensionScore = tensions.length === 0 ? 60 : 
                       tensions.length <= 2 ? 80 :
                       tensions.length <= 4 ? 95 : 85;
  metrics.push({ name: "Tension Balance", score: tensionScore, weight: 0.2 });

  // Personalization depth (if business context used)
  const personalizationScore = businessContext ? 
    (businessContext.companyName ? 30 : 0) +
    (businessContext.industry ? 25 : 0) +
    (businessContext.valuePropositions?.length > 0 ? 25 : 0) +
    (businessContext.brandVoice ? 20 : 0) : 40;
  metrics.push({ name: "Personalization", score: personalizationScore, weight: 0.2 });

  // Calculate weighted overall
  const overall = Math.round(
    metrics.reduce((acc, m) => acc + m.score * m.weight, 0)
  );

  return { overall, metrics };
};

interface NarrativeQualityScoreProps {
  compact?: boolean;
}

export const NarrativeQualityScore = ({ compact = false }: NarrativeQualityScoreProps) => {
  const { narrative, rawText, tensions, businessContext } = useNarrativeStore();
  const [displayScore, setDisplayScore] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  const { overall, metrics } = calculateNarrativeQuality(narrative, rawText, tensions, businessContext);

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

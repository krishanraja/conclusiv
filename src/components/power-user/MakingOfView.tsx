import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Film, X, ChevronRight, Lightbulb, Target, AlertTriangle, Layers, TrendingUp, FileText, Sparkles, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNarrativeStore } from "@/store/narrativeStore";
import { cn } from "@/lib/utils";
import { calculateNarrativeQuality } from "@/components/intelligence/NarrativeQualityScore";

interface MakingOfViewProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MakingOfView = ({ isOpen, onClose }: MakingOfViewProps) => {
  const { 
    narrative, 
    selectedArchetype, 
    audienceMode, 
    tensions,
    businessContext,
    rawText,
    duration,
    keyClaims,
  } = useNarrativeStore();

  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);

  // Calculate quality metrics (safe for null narrative)
  const { overall, metrics } = useMemo(() => {
    if (!narrative) {
      return { overall: 0, metrics: [] };
    }
    return calculateNarrativeQuality(narrative, rawText, tensions, businessContext, keyClaims);
  }, [narrative, rawText, tensions, businessContext, keyClaims]);

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-400";
    if (score >= 70) return "text-shimmer-start";
    if (score >= 50) return "text-amber-400";
    return "text-red-400";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 75) return "Strong";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Work";
  };

  const insights = [
    {
      id: "archetype",
      icon: <Layers className="w-4 h-4" />,
      title: "Narrative Structure",
      summary: selectedArchetype 
        ? `Used "${selectedArchetype.replace(/_/g, " ")}" archetype` 
        : "Auto-detected structure",
      details: selectedArchetype
        ? `The ${selectedArchetype.replace(/_/g, " ")} archetype was selected to best convey your content. This structure emphasizes ${
            selectedArchetype.includes("pitch") ? "growth potential and market opportunity" :
            selectedArchetype.includes("brief") ? "strategic clarity and actionable insights" :
            selectedArchetype.includes("problem") ? "problem definition and solution framing" :
            "clear narrative flow and audience engagement"
          }.`
        : "No archetype was explicitly selected, so the AI determined the optimal structure based on your content patterns.",
    },
    {
      id: "audience",
      icon: <Target className="w-4 h-4" />,
      title: "Audience Targeting",
      summary: audienceMode 
        ? `Optimized for ${audienceMode}` 
        : "General audience",
      details: audienceMode
        ? `Content was tailored for a ${audienceMode} audience, adjusting language complexity, emphasis on metrics vs. strategy, and the level of detail in recommendations.`
        : "No specific audience was targeted. Consider selecting an audience mode for more focused messaging.",
    },
    {
      id: "tensions",
      icon: <AlertTriangle className="w-4 h-4" />,
      title: "Detected Tensions",
      summary: `${tensions.length} tension${tensions.length !== 1 ? "s" : ""} identified`,
      details: tensions.length > 0
        ? `The AI identified ${tensions.length} areas of tension or potential blind spots in your content: ${tensions.map(t => t.title).join(", ")}. These were flagged to help you address potential challenges.`
        : "No significant tensions or contradictions were detected in your input. Your content appears to be internally consistent.",
    },
    {
      id: "personalization",
      icon: <Lightbulb className="w-4 h-4" />,
      title: "Personalization",
      summary: businessContext 
        ? `Tailored for ${businessContext.companyName}` 
        : "Generic styling",
      details: businessContext
        ? `The narrative was personalized for ${businessContext.companyName} in the ${businessContext.industry} industry. Brand voice elements (${businessContext.brandVoice || "professional"}) were incorporated throughout.`
        : "No business context was provided. Adding company information can significantly improve narrative relevance.",
    },
  ];

  // Generate improvement suggestions based on metrics
  const suggestions = useMemo(() => {
    const items: { metric: string; action: string; priority: 'high' | 'medium' | 'low' }[] = [];
    
    const structure = metrics.find(m => m.name === "Structure");
    const dataDensity = metrics.find(m => m.name === "Data Density");
    const cta = metrics.find(m => m.name === "Call to Action");
    const personalization = metrics.find(m => m.name === "Personalization");
    
    if (structure && structure.score < 80) {
      items.push({
        metric: "Structure",
        action: "Add more sections with clear titles and content",
        priority: structure.score < 60 ? "high" : "medium",
      });
    }
    
    if (dataDensity && dataDensity.score < 75) {
      items.push({
        metric: "Data Density",
        action: "Include specific metrics and percentages",
        priority: dataDensity.score < 50 ? "high" : "medium",
      });
    }
    
    if (cta && cta.score < 80) {
      items.push({
        metric: "Call to Action",
        action: "Add clear recommendations in your input",
        priority: cta.score < 50 ? "high" : "medium",
      });
    }
    
    if (personalization && personalization.score < 70) {
      items.push({
        metric: "Personalization",
        action: "Add company context for tailored messaging",
        priority: "medium",
      });
    }
    
    if (tensions.length > 0 && tensions.some(t => t.severity === "high")) {
      items.push({
        metric: "Tension Balance",
        action: "Address high-severity tensions in the Tensions panel",
        priority: "high",
      });
    }
    
    return items;
  }, [metrics, tensions]);

  // Early return AFTER all hooks are defined (React Rules of Hooks)
  if (!narrative) return null;

  const processingStats = {
    inputChars: rawText.length,
    inputWords: rawText.split(/\s+/).filter(Boolean).length,
    outputSections: narrative.sections.length,
    compressionRatio: ((rawText.length / (narrative.sections.reduce((acc, s) => acc + (s.content?.length || 0), 0) || 1))).toFixed(1),
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-border bg-card/95 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-shimmer-start" />
                <h2 className="font-semibold">Making Of</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-4 space-y-6">
              {/* NARRATIVE QUALITY SCORE - Merged from NarrativeQualityScore */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-shimmer-start/10 via-transparent to-shimmer-end/10 border border-shimmer-start/20">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-shimmer-start" />
                  <h3 className="text-sm font-medium">Narrative Score</h3>
                </div>
                
                <div className="flex items-center gap-6">
                  {/* Main score gauge */}
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        fill="none"
                        stroke="hsl(var(--border))"
                        strokeWidth="6"
                      />
                      <motion.circle
                        cx="48"
                        cy="48"
                        r="40"
                        fill="none"
                        stroke="hsl(var(--shimmer-start))"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={251}
                        initial={{ strokeDashoffset: 251 }}
                        animate={{ strokeDashoffset: 251 - (overall / 100) * 251 }}
                        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <motion.span 
                        className={cn("text-2xl font-bold", getScoreColor(overall))}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        {overall}
                      </motion.span>
                      <span className="text-[10px] text-muted-foreground">{getScoreLabel(overall)}</span>
                    </div>
                  </div>

                  {/* Metrics breakdown */}
                  <div className="flex-1 space-y-2">
                    {metrics.slice(0, 4).map((metric) => (
                      <div key={metric.name} className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs mb-0.5">
                            <span className="text-muted-foreground">{metric.name}</span>
                            <span className={getScoreColor(metric.score)}>{Math.round(metric.score)}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                            <motion.div
                              className="h-full bg-shimmer-start"
                              initial={{ width: 0 }}
                              animate={{ width: `${metric.score}%` }}
                              transition={{ duration: 0.8, delay: 0.2 }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* IMPROVE SUGGESTIONS - Merged from ImproveMyScore */}
              {suggestions.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-shimmer-start" />
                      Improve Your Score
                    </h3>
                    {suggestions.length > 3 && (
                      <button
                        onClick={() => setShowAllSuggestions(!showAllSuggestions)}
                        className="text-xs text-primary hover:underline"
                      >
                        {showAllSuggestions ? "Show less" : `+${suggestions.length - 3} more`}
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    {(showAllSuggestions ? suggestions : suggestions.slice(0, 3)).map((suggestion, idx) => (
                      <motion.div
                        key={suggestion.metric}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={cn(
                          "p-3 rounded-lg border text-sm",
                          suggestion.priority === "high" 
                            ? "bg-red-500/5 border-red-500/20" 
                            : "bg-muted/30 border-border/50"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <TrendingUp className={cn(
                            "w-4 h-4 mt-0.5 flex-shrink-0",
                            suggestion.priority === "high" ? "text-red-400" : "text-shimmer-start"
                          )} />
                          <div>
                            <span className="font-medium">{suggestion.metric}:</span>{" "}
                            <span className="text-muted-foreground">{suggestion.action}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Processing stats */}
              <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Processing Stats
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-2xl font-bold">{processingStats.inputWords.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Words processed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{processingStats.outputSections}</div>
                    <div className="text-xs text-muted-foreground">Sections created</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{processingStats.compressionRatio}x</div>
                    <div className="text-xs text-muted-foreground">Compression ratio</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{duration}</div>
                    <div className="text-xs text-muted-foreground">Target duration</div>
                  </div>
                </div>
              </div>

              {/* AI Decisions */}
              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  AI Reasoning
                </h3>
                <div className="space-y-2">
                  {insights.map((insight) => (
                    <div
                      key={insight.id}
                      className="rounded-lg border border-border/50 overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedSection(
                          expandedSection === insight.id ? null : insight.id
                        )}
                        className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-md bg-muted">
                            {insight.icon}
                          </div>
                          <div className="text-left">
                            <div className="text-sm font-medium">{insight.title}</div>
                            <div className="text-xs text-muted-foreground">{insight.summary}</div>
                          </div>
                        </div>
                        <ChevronRight 
                          className={cn(
                            "w-4 h-4 text-muted-foreground transition-transform",
                            expandedSection === insight.id && "rotate-90"
                          )} 
                        />
                      </button>
                      <AnimatePresence>
                        {expandedSection === insight.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-border/50"
                          >
                            <p className="p-3 text-sm text-muted-foreground leading-relaxed">
                              {insight.details}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section breakdown */}
              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Section Breakdown
                </h3>
                <div className="space-y-2">
                  {narrative.sections.map((section, i) => (
                    <div
                      key={section.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/20"
                    >
                      <div className="w-6 h-6 rounded-full bg-shimmer-start/20 flex items-center justify-center text-xs font-medium text-shimmer-start">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{section.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {section.content?.length || 0} chars · {section.items?.length || 0} items
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Trigger button component
export const MakingOfTrigger = ({ onClick }: { onClick: () => void }) => (
  <Button
    variant="ghost"
    size="sm"
    onClick={onClick}
    className="text-muted-foreground"
  >
    <Film className="w-4 h-4 mr-1" />
    Making Of
  </Button>
);

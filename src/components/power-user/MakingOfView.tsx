import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Film, X, ChevronRight, Lightbulb, Target, AlertTriangle, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNarrativeStore } from "@/store/narrativeStore";
import { cn } from "@/lib/utils";

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
    duration
  } = useNarrativeStore();

  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  if (!narrative) return null;

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

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ArrowRightLeft, Eye } from "lucide-react";
import { useNarrativeStore } from "@/store/narrativeStore";
import { alternativeGoalDescriptions, NarrativeAlternative } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { AlternativePreviewModal } from "./AlternativePreviewModal";

interface AlternativesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AlternativesPanel = ({ isOpen, onClose }: AlternativesPanelProps) => {
  const { alternatives, swapWithAlternative, isGeneratingAlternatives } = useNarrativeStore();
  const [previewAlt, setPreviewAlt] = useState<NarrativeAlternative | null>(null);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-shimmer-start" />
                <h2 className="font-semibold">Re-Narrate</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md hover:bg-background transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {isGeneratingAlternatives ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <div className="w-12 h-12 rounded-full border-2 border-shimmer-start border-t-transparent animate-spin" />
                  <p className="text-sm text-muted-foreground">Generating alternatives...</p>
                </div>
              ) : alternatives.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-shimmer-start/10 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-shimmer-start" />
                  </div>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Click "Re-Narrate" to see different framings of your story
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alternatives.map((alt) => {
                    const goalConfig = alternativeGoalDescriptions[alt.goal];

                    return (
                      <motion.div
                        key={alt.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl border border-border bg-background space-y-3"
                      >
                        <div>
                          <h3 className="font-medium text-sm">{alt.goalLabel}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {goalConfig?.description || alt.rationale}
                          </p>
                        </div>

                        <p className="text-xs text-foreground/80 leading-relaxed">
                          {alt.rationale}
                        </p>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{alt.narrative.sections.length} sections</span>
                          <span>•</span>
                          <span>{alt.narrative.template}</span>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 text-xs h-8"
                            onClick={() => setPreviewAlt(alt)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Preview
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs h-8"
                            onClick={() => {
                              swapWithAlternative(alt.id);
                              onClose();
                            }}
                          >
                            <ArrowRightLeft className="w-3 h-3 mr-1" />
                            Use This
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>

          {/* Preview Modal */}
          <AlternativePreviewModal
            alternative={previewAlt}
            isOpen={!!previewAlt}
            onClose={() => setPreviewAlt(null)}
            onUse={() => {
              if (previewAlt) {
                swapWithAlternative(previewAlt.id);
                setPreviewAlt(null);
                onClose();
              }
            }}
          />
        </>
      )}
    </AnimatePresence>
  );
};

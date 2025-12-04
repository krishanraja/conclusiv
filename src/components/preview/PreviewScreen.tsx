import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Play, BookOpen, Share2 } from "lucide-react";
import { useNarrativeStore } from "@/store/narrativeStore";
import { useToast } from "@/hooks/use-toast";
import { buildNarrative } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { NarrativePreview } from "./NarrativePreview";
import { QuickAdjustments } from "./QuickAdjustments";
import { ErrorRecovery, parseAPIError } from "@/components/ui/error-recovery";
import type { ErrorCode } from "@/components/ui/error-recovery";
import { cn } from "@/lib/utils";
import { AnimatePresence } from "framer-motion";

export const PreviewScreen = () => {
  const { toast } = useToast();
  const {
    rawText,
    setCurrentStep,
    setCurrentSectionIndex,
    viewMode,
    setViewMode,
    businessContext,
    setThemes,
    setSelectedTemplate,
    setNarrative,
    narrative,
    setIsLoading,
    setLoadingMessage,
    setLoadingStage,
    setLoadingProgress,
    highlights,
    keyClaims,
    voiceFeedback,
  } = useNarrativeStore();

  const [error, setError] = useState<{ code: ErrorCode; message: string; retryable: boolean } | null>(null);
  const [hasBuilt, setHasBuilt] = useState(false);

  // Build narrative on mount if not already built
  useEffect(() => {
    if (!narrative && !hasBuilt) {
      handleBuild();
    }
  }, []);

  const handleBuild = async () => {
    setHasBuilt(true);
    setIsLoading(true);
    setError(null);
    setLoadingStage(0);
    setLoadingProgress(0);
    
    try {
      const charCount = rawText.length;
      if (charCount > 15000) {
        setLoadingMessage("Processing large document...");
      } else if (businessContext) {
        setLoadingMessage(`Tailoring for ${businessContext.companyName}...`);
      } else {
        setLoadingMessage("Building your story...");
      }

      const handleProgress = (stage: number, progress: number) => {
        setLoadingStage(stage);
        setLoadingProgress(progress);
      };

      // Include refinement data in the build
      const refinementContext = {
        highlights: highlights.map(h => h.text),
        approvedClaims: keyClaims.filter(c => c.approved === true).map(c => c.text),
        rejectedClaims: keyClaims.filter(c => c.approved === false).map(c => c.text),
        flaggedMisleading: keyClaims.filter(c => c.flaggedMisleading).map(c => c.text),
        voiceFeedback,
      };

      const result = await buildNarrative(rawText, businessContext, handleProgress);

      if (result.error) {
        const apiError = parseAPIError({ 
          message: result.error, 
          code: result.errorCode 
        });
        setError(apiError);
        return;
      }

      if (result.themes) {
        setThemes(result.themes);
      }
      if (result.recommendedTemplate) {
        setSelectedTemplate(result.recommendedTemplate);
      }
      if (result.narrative) {
        setNarrative(result.narrative);
      }
    } catch (err) {
      const apiError = parseAPIError(err);
      setError(apiError);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
      setLoadingStage(0);
      setLoadingProgress(0);
    }
  };

  const handleBack = () => {
    setCurrentStep("refine");
  };

  const handlePresent = () => {
    setCurrentSectionIndex(0);
    setCurrentStep("present");
  };

  return (
    <>
      {/* Error Recovery Modal */}
      <AnimatePresence>
        {error && (
          <ErrorRecovery
            error={error}
            onRetry={handleBuild}
            onDismiss={() => setError(null)}
            inputLength={rawText.length}
          />
        )}
      </AnimatePresence>

      <div className="min-h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {businessContext && (
            <div className="text-xs text-muted-foreground">
              For <span className="text-shimmer-start">{businessContext.companyName}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
            >
              <Share2 className="w-4 h-4 mr-1" />
              Share
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Preview Area */}
          <div className="flex-1 flex flex-col">
            {/* Mode Toggle */}
            <div className="flex justify-center py-4">
              <div className="flex items-center gap-1 p-1 rounded-lg bg-card border border-border/50">
                <button
                  onClick={() => setViewMode("present")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors",
                    viewMode === "present"
                      ? "bg-shimmer-start/20 text-shimmer-start"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Play className="w-3 h-3" />
                  Present
                </button>
                <button
                  onClick={() => setViewMode("reader")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors",
                    viewMode === "reader"
                      ? "bg-shimmer-start/20 text-shimmer-start"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <BookOpen className="w-3 h-3" />
                  Read
                </button>
              </div>
            </div>

            {/* Preview Window */}
            <div className="flex-1 mx-4 mb-4 rounded-xl border border-border/50 bg-card/30 overflow-hidden">
              <NarrativePreview />
            </div>
          </div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-72 border-l border-border/50 p-4 hidden lg:block"
          >
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
              Adjustments
            </h3>
            <QuickAdjustments />
          </motion.div>
        </div>

        {/* Footer CTA */}
        <div className="flex justify-center p-4 border-t border-border/50">
          <Button variant="shimmer" size="lg" onClick={handlePresent} disabled={!narrative}>
            <Play className="w-4 h-4 mr-2" />
            Present
          </Button>
        </div>
      </div>
    </>
  );
};
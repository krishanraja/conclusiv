import { motion } from "framer-motion";
import { ArrowLeft, Play, BookOpen, Share2 } from "lucide-react";
import { useNarrativeStore } from "@/store/narrativeStore";
import { Button } from "@/components/ui/button";
import { NarrativePreview } from "./NarrativePreview";
import { QuickAdjustments } from "./QuickAdjustments";
import { cn } from "@/lib/utils";

export const PreviewScreen = () => {
  const {
    setCurrentStep,
    setCurrentSectionIndex,
    viewMode,
    setViewMode,
    businessContext,
  } = useNarrativeStore();

  const handleBack = () => {
    setCurrentStep("input");
  };

  const handlePresent = () => {
    setCurrentSectionIndex(0);
    setCurrentStep("present");
  };

  return (
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
        <Button variant="shimmer" size="lg" onClick={handlePresent}>
          <Play className="w-4 h-4 mr-2" />
          Present
        </Button>
      </div>
    </div>
  );
};

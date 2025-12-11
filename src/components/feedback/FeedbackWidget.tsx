import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Bug, Lightbulb, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedbackDialog } from "./FeedbackDialog";
import { QuickRating } from "./QuickRating";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileBottomBar } from "@/components/layout/MobileBottomBar";

type FeedbackMode = "quick" | "bug" | "feature" | "detailed" | null;

interface FeedbackWidgetProps {
  currentStep?: string;
}

export const FeedbackWidget = ({ currentStep }: FeedbackWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<FeedbackMode>(null);
  const isMobile = useIsMobile();

  const handleModeSelect = (selectedMode: FeedbackMode) => {
    setMode(selectedMode);
  };

  const handleClose = () => {
    setMode(null);
    setIsOpen(false);
  };

  const handleQuickRatingComplete = () => {
    setMode(null);
  };

  // Mobile: Show bottom bar instead of floating button
  if (isMobile) {
    return (
      <>
        <MobileBottomBar onFeedbackClick={() => setIsOpen(true)} />

        {/* Mobile feedback menu - bottom sheet style */}
        <AnimatePresence>
          {isOpen && !mode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50"
            >
              <div 
                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                onClick={handleClose}
              />
              
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="absolute bottom-0 left-0 right-0 bg-card border-t border-border rounded-t-2xl p-4"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Feedback</h3>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClose}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <button onClick={() => handleModeSelect("quick")} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors text-left">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <div>
                      <p className="font-medium text-sm">Quick rating</p>
                      <p className="text-xs text-muted-foreground">Rate your experience</p>
                    </div>
                  </button>
                  <button onClick={() => handleModeSelect("bug")} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors text-left">
                    <Bug className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="font-medium text-sm">Report an issue</p>
                      <p className="text-xs text-muted-foreground">Something not working?</p>
                    </div>
                  </button>
                  <button onClick={() => handleModeSelect("feature")} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors text-left">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">Suggest a feature</p>
                      <p className="text-xs text-muted-foreground">We'd love to hear your ideas</p>
                    </div>
                  </button>
                  <button onClick={() => handleModeSelect("detailed")} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors text-left">
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">General feedback</p>
                      <p className="text-xs text-muted-foreground">Share your thoughts</p>
                    </div>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick rating bottom sheet */}
        <AnimatePresence>
          {isOpen && mode === "quick" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50">
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={handleClose} />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="absolute bottom-0 left-0 right-0 bg-card border-t border-border rounded-t-2xl p-4"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground">Rate your experience</h3>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClose}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <QuickRating context={{ step: currentStep }} onComplete={handleQuickRatingComplete} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <FeedbackDialog
          isOpen={mode === "bug" || mode === "feature" || mode === "detailed"}
          onClose={handleClose}
          type={mode === "bug" ? "bug_report" : mode === "feature" ? "feature_request" : "detailed"}
          currentStep={currentStep}
        />
      </>
    );
  }

  // Desktop: Floating button on LEFT side
  return (
    <>
      <motion.div
        className="fixed bottom-6 left-6 z-50 hidden md:block"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 2, type: "spring" }}
      >
        <AnimatePresence>
          {!isOpen && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              <Button
                onClick={() => setIsOpen(true)}
                size="lg"
                className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-shadow"
                aria-label="Give feedback"
              >
                <MessageSquare className="h-6 w-6" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expanded widget */}
        <AnimatePresence>
          {isOpen && !mode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute bottom-0 left-0 bg-card border border-border rounded-xl shadow-2xl p-4 w-72"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Feedback</h3>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <button onClick={() => handleModeSelect("quick")} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors text-left">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-medium text-sm">Quick rating</p>
                    <p className="text-xs text-muted-foreground">Rate your experience</p>
                  </div>
                </button>
                <button onClick={() => handleModeSelect("bug")} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors text-left">
                  <Bug className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-medium text-sm">Report an issue</p>
                    <p className="text-xs text-muted-foreground">Something not working?</p>
                  </div>
                </button>
                <button onClick={() => handleModeSelect("feature")} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors text-left">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">Suggest a feature</p>
                    <p className="text-xs text-muted-foreground">We'd love to hear your ideas</p>
                  </div>
                </button>
                <button onClick={() => handleModeSelect("detailed")} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors text-left">
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">General feedback</p>
                    <p className="text-xs text-muted-foreground">Share your thoughts</p>
                  </div>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick rating inline */}
        <AnimatePresence>
          {isOpen && mode === "quick" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute bottom-0 left-0 bg-card border border-border rounded-xl shadow-2xl p-4 w-72"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Rate your experience</h3>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <QuickRating context={{ step: currentStep }} onComplete={handleQuickRatingComplete} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <FeedbackDialog
        isOpen={mode === "bug" || mode === "feature" || mode === "detailed"}
        onClose={handleClose}
        type={mode === "bug" ? "bug_report" : mode === "feature" ? "feature_request" : "detailed"}
        currentStep={currentStep}
      />
    </>
  );
};
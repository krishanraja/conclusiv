import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFeedback } from "@/hooks/useFeedback";

interface ContextualPromptProps {
  isVisible: boolean;
  onDismiss: () => void;
  promptType: "narrative_quality" | "export_success" | "general";
  context?: { [key: string]: unknown };
}

const promptConfig = {
  narrative_quality: {
    question: "How was the quality of your narrative?",
    positiveLabel: "Great!",
    negativeLabel: "Needs work",
  },
  export_success: {
    question: "Did the export meet your expectations?",
    positiveLabel: "Yes",
    negativeLabel: "Not quite",
  },
  general: {
    question: "How's your experience so far?",
    positiveLabel: "Good",
    negativeLabel: "Could be better",
  },
};

export const ContextualPrompt = ({
  isVisible,
  onDismiss,
  promptType,
  context,
}: ContextualPromptProps) => {
  const [responded, setResponded] = useState(false);
  const { submitQuickRating } = useFeedback();
  const config = promptConfig[promptType];

  // Auto-dismiss after 10 seconds if no response
  useEffect(() => {
    if (isVisible && !responded) {
      const timer = setTimeout(onDismiss, 10000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, responded, onDismiss]);

  const handleResponse = async (isPositive: boolean) => {
    setResponded(true);
    await submitQuickRating(isPositive ? 5 : 2, {
      ...context,
      promptType,
    });
    setTimeout(onDismiss, 1500);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: 20, x: "-50%" }}
          className="fixed bottom-24 left-1/2 z-40 bg-card border border-border rounded-xl shadow-lg p-4 max-w-sm"
        >
          {!responded ? (
            <div className="flex items-center gap-4">
              <p className="text-sm font-medium text-foreground flex-1">
                {config.question}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleResponse(false)}
                  className="gap-1"
                >
                  <ThumbsDown className="h-3 w-3" />
                  {config.negativeLabel}
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleResponse(true)}
                  className="gap-1"
                >
                  <ThumbsUp className="h-3 w-3" />
                  {config.positiveLabel}
                </Button>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 ml-2"
                onClick={onDismiss}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-1"
            >
              <p className="text-sm text-muted-foreground">Thanks for the feedback! 🙏</p>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

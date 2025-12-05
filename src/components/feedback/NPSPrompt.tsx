import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useFeedback } from "@/hooks/useFeedback";

interface NPSPromptProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NPSPrompt = ({ isOpen, onClose }: NPSPromptProps) => {
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [step, setStep] = useState<"score" | "feedback" | "thanks">("score");
  const { submitNPS, isSubmitting } = useFeedback();

  const handleScoreSelect = (selectedScore: number) => {
    setScore(selectedScore);
    setStep("feedback");
  };

  const handleSubmit = async () => {
    if (score === null) return;
    
    const success = await submitNPS(score, feedback || undefined);
    if (success) {
      setStep("thanks");
      setTimeout(onClose, 2000);
    }
  };

  const handleSkip = async () => {
    if (score === null) return;
    
    const success = await submitNPS(score);
    if (success) {
      setStep("thanks");
      setTimeout(onClose, 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {step === "thanks" ? "Thank you!" : "Quick question"}
                </h2>
                {step !== "thanks" && (
                  <p className="text-sm text-muted-foreground mt-1">
                    We'd love your feedback
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {step === "score" && (
              <div className="space-y-4">
                <p className="text-sm text-foreground">
                  How likely are you to recommend Conclusiv to a colleague?
                </p>
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleScoreSelect(num)}
                      className={`flex-1 py-2 text-xs font-medium rounded transition-all ${
                        num <= 6
                          ? "hover:bg-red-500/20 hover:text-red-400"
                          : num <= 8
                          ? "hover:bg-yellow-500/20 hover:text-yellow-400"
                          : "hover:bg-green-500/20 hover:text-green-400"
                      } ${
                        score === num
                          ? num <= 6
                            ? "bg-red-500/20 text-red-400"
                            : num <= 8
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-green-500/20 text-green-400"
                          : "bg-accent/30"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Not likely</span>
                  <span>Very likely</span>
                </div>
              </div>
            )}

            {step === "feedback" && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <span className="text-sm text-muted-foreground">Your score:</span>
                  <span className={`font-bold ${
                    score! <= 6 ? "text-red-400" : score! <= 8 ? "text-yellow-400" : "text-green-400"
                  }`}>
                    {score}
                  </span>
                </div>
                <p className="text-sm text-foreground">
                  {score! <= 6
                    ? "We're sorry to hear that. What could we do better?"
                    : score! <= 8
                    ? "Thanks! What would make it a 10?"
                    : "Awesome! What do you like most about Conclusiv?"}
                </p>
                <Textarea
                  placeholder="Your feedback (optional)"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleSkip}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    Skip
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    Submit
                  </Button>
                </div>
              </div>
            )}

            {step === "thanks" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-4"
              >
                <div className="text-4xl mb-3">🙏</div>
                <p className="text-sm text-muted-foreground">
                  Your feedback helps us build a better product
                </p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

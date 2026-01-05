import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, ArrowRight, Sparkles, Loader2, Target, Users, Zap, Edit3, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { useToast } from "@/hooks/use-toast";
import { useNarrativeStore } from "@/store/narrativeStore";
import { extractNarrativeIntent } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useHaptics } from "@/hooks/useHaptics";

interface NarrativeGoalCaptureProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export const NarrativeGoalCapture = ({ onComplete, onSkip }: NarrativeGoalCaptureProps) => {
  const { toast } = useToast();
  const haptics = useHaptics();
  const {
    narrativeGoal,
    setNarrativeGoal,
    extractedNarrativeIntent,
    setExtractedNarrativeIntent,
    setNarrativeGoalConfirmed,
  } = useNarrativeStore();

  const [inputMode, setInputMode] = useState<'initial' | 'voice' | 'text'>('initial');
  const [isExtracting, setIsExtracting] = useState(false);
  const [showExtracted, setShowExtracted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedGoal, setEditedGoal] = useState("");

  const handleTranscript = useCallback((text: string) => {
    setNarrativeGoal(narrativeGoal ? `${narrativeGoal} ${text}` : text);
  }, [narrativeGoal, setNarrativeGoal]);

  const handleVoiceError = useCallback((error: string) => {
    toast({
      title: "Voice error",
      description: error,
      variant: "destructive",
    });
  }, [toast]);

  const { isRecording, isSupported, toggleRecording, stopRecording } = useVoiceRecorder({
    onTranscript: handleTranscript,
    onError: handleVoiceError,
  });

  // Extract intent from the narrative goal
  const extractIntent = async () => {
    if (!narrativeGoal.trim()) {
      toast({
        title: "Please enter your goal",
        description: "Tell us what you want your audience to take away.",
        variant: "destructive",
      });
      return;
    }

    setIsExtracting(true);
    haptics.medium();

    try {
      const result = await extractNarrativeIntent(narrativeGoal, 'goal');
      
      if (result.intent) {
        setExtractedNarrativeIntent({
          coreMessage: result.intent.coreMessage,
          targetAudience: result.intent.targetAudience,
          desiredOutcome: result.intent.desiredOutcome,
        });
        setShowExtracted(true);
      } else if (result.error) {
        // Use the raw input as the core message
        setExtractedNarrativeIntent({
          coreMessage: narrativeGoal,
        });
        setShowExtracted(true);
      }
    } catch (err) {
      console.error("Failed to extract intent:", err);
      // Fallback: use raw input
      setExtractedNarrativeIntent({
        coreMessage: narrativeGoal,
      });
      setShowExtracted(true);
    } finally {
      setIsExtracting(false);
    }
  };

  // Confirm and proceed
  const handleConfirm = () => {
    haptics.success();
    setNarrativeGoalConfirmed(true);
    onComplete();
  };

  // Edit the extracted core message
  const startEditing = () => {
    setEditedGoal(extractedNarrativeIntent?.coreMessage || narrativeGoal);
    setIsEditing(true);
  };

  const saveEdit = () => {
    if (editedGoal.trim()) {
      setExtractedNarrativeIntent({
        ...extractedNarrativeIntent,
        coreMessage: editedGoal.trim(),
      });
      setNarrativeGoal(editedGoal.trim());
    }
    setIsEditing(false);
  };

  // Handle voice button click
  const handleVoiceClick = () => {
    if (inputMode === 'initial') {
      setInputMode('voice');
    }
    toggleRecording();
    haptics.medium();
  };

  // Handle text mode
  const handleTextMode = () => {
    setInputMode('text');
    haptics.light();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <AnimatePresence mode="wait">
        {/* Initial / Voice Recording State */}
        {!showExtracted ? (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-xl space-y-8 text-center"
          >
            {/* Headline */}
            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
              >
                <Target className="w-4 h-4" />
                Define Your Narrative
              </motion.div>
              
              <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
                In one sentence, what should your audience walk away believing?
              </h1>
              
              <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
                This becomes the north star that guides everything we emphasize or de-emphasize.
              </p>
            </div>

            {/* Voice Input */}
            {(inputMode === 'initial' || inputMode === 'voice') && isSupported && (
              <div className="space-y-4">
                <motion.button
                  onClick={handleVoiceClick}
                  className={cn(
                    "relative mx-auto w-28 h-28 rounded-full flex items-center justify-center transition-all",
                    isRecording
                      ? "bg-red-500/20 shadow-lg shadow-red-500/20"
                      : "bg-primary/10 hover:bg-primary/20 hover:shadow-lg hover:shadow-primary/10"
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Pulse rings when recording */}
                  <AnimatePresence>
                    {isRecording && (
                      <>
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-red-400/50"
                          initial={{ scale: 1, opacity: 0.5 }}
                          animate={{ scale: 1.5, opacity: 0 }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-red-400/30"
                          initial={{ scale: 1, opacity: 0.3 }}
                          animate={{ scale: 2, opacity: 0 }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                        />
                      </>
                    )}
                  </AnimatePresence>

                  {isRecording ? (
                    <MicOff className="w-10 h-10 text-red-400" />
                  ) : (
                    <Mic className="w-10 h-10 text-primary" />
                  )}
                </motion.button>

                <p className="text-sm text-muted-foreground">
                  {isRecording ? (
                    <span className="text-red-400 flex items-center justify-center gap-2">
                      <motion.span
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-2 h-2 rounded-full bg-red-400"
                      />
                      Listening... tap to stop
                    </span>
                  ) : (
                    "Tap to speak your core message"
                  )}
                </p>

                {/* Show transcript if we have one */}
                {narrativeGoal && !isRecording && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-card border border-border/50 text-left"
                  >
                    <p className="text-sm text-foreground">{narrativeGoal}</p>
                    <button
                      onClick={() => setNarrativeGoal("")}
                      className="text-xs text-muted-foreground hover:text-foreground mt-2"
                    >
                      Clear & try again
                    </button>
                  </motion.div>
                )}

                {/* Or type option */}
                {inputMode === 'initial' && (
                  <div className="pt-4">
                    <button
                      onClick={handleTextMode}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      or type instead
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Text Input */}
            {(inputMode === 'text' || !isSupported) && (
              <div className="space-y-4">
                <Textarea
                  value={narrativeGoal}
                  onChange={(e) => setNarrativeGoal(e.target.value)}
                  placeholder="Example: Our platform reduces presentation creation time by 80% while improving audience engagement..."
                  className="min-h-[120px] bg-card border-border/50 resize-none text-base"
                  autoFocus
                />
                
                {isSupported && (
                  <button
                    onClick={() => setInputMode('voice')}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 mx-auto"
                  >
                    <Mic className="w-4 h-4" />
                    or use voice
                  </button>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-3 pt-4">
              {onSkip && (
                <Button variant="ghost" onClick={onSkip}>
                  Skip for now
                </Button>
              )}
              
              <Button
                variant="shimmer"
                onClick={extractIntent}
                disabled={!narrativeGoal.trim() || isExtracting || isRecording}
                className="min-w-[160px]"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Extract Intent
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        ) : (
          /* Extracted Intent Confirmation */
          <motion.div
            key="extracted"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-xl space-y-6"
          >
            <div className="text-center space-y-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto"
              >
                <Check className="w-6 h-6 text-green-500" />
              </motion.div>
              <h2 className="text-xl font-bold text-foreground">
                Here's what we understood
              </h2>
              <p className="text-sm text-muted-foreground">
                Confirm or edit before we proceed
              </p>
            </div>

            {/* Extracted Fields */}
            <div className="space-y-4">
              {/* Core Message */}
              <div className="p-4 rounded-xl bg-card border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-primary text-sm font-medium">
                    <Target className="w-4 h-4" />
                    Core Message
                  </div>
                  {!isEditing && (
                    <button
                      onClick={startEditing}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      Edit
                    </button>
                  )}
                </div>
                
                {isEditing ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editedGoal}
                      onChange={(e) => setEditedGoal(e.target.value)}
                      className="min-h-[80px] bg-background resize-none"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={saveEdit}>
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-foreground font-medium">
                    {extractedNarrativeIntent?.coreMessage}
                  </p>
                )}
              </div>

              {/* Target Audience */}
              {extractedNarrativeIntent?.targetAudience && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-3 rounded-lg bg-muted/30 border border-border/50"
                >
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Users className="w-4 h-4" />
                    <span className="font-medium">Audience:</span>
                    <span className="text-foreground">{extractedNarrativeIntent.targetAudience}</span>
                  </div>
                </motion.div>
              )}

              {/* Desired Outcome */}
              {extractedNarrativeIntent?.desiredOutcome && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-3 rounded-lg bg-muted/30 border border-border/50"
                >
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Zap className="w-4 h-4" />
                    <span className="font-medium">Desired outcome:</span>
                    <span className="text-foreground">{extractedNarrativeIntent.desiredOutcome}</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowExtracted(false);
                  setNarrativeGoal("");
                  setExtractedNarrativeIntent(null);
                }}
              >
                Start Over
              </Button>
              
              <Button variant="shimmer" onClick={handleConfirm}>
                Confirm & Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

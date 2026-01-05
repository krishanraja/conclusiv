import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Check, RotateCcw, ArrowRight, MessageCircle, Shield, Award, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { useToast } from "@/hooks/use-toast";
import { useNarrativeStore } from "@/store/narrativeStore";
import { extractNarrativeIntent } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useHaptics } from "@/hooks/useHaptics";

interface GuidedPrompt {
  id: 'coreMessage' | 'objectionsAndRebuttals' | 'priorityProofPoints';
  icon: typeof MessageCircle;
  title: string;
  question: string;
  placeholder: string;
  extractType: 'goal' | 'objections' | 'proof_points';
}

const GUIDED_PROMPTS: GuidedPrompt[] = [
  {
    id: 'coreMessage',
    icon: MessageCircle,
    title: 'Core Message',
    question: "What's the ONE thing your audience must remember?",
    placeholder: "Example: Our platform delivers 3x ROI within 90 days of implementation...",
    extractType: 'goal',
  },
  {
    id: 'objectionsAndRebuttals',
    icon: Shield,
    title: 'Objections & Rebuttals',
    question: "What concerns might they have, and how do you address them?",
    placeholder: "Example: They might worry about implementation complexity, but our onboarding takes just 2 hours...",
    extractType: 'objections',
  },
  {
    id: 'priorityProofPoints',
    icon: Award,
    title: 'Priority Proof Points',
    question: "What proof points matter most to you?",
    placeholder: "Example: The Fortune 500 case study, our 98% retention rate, the Gartner recognition...",
    extractType: 'proof_points',
  },
];

interface GuidedVoiceFlowProps {
  onComplete?: () => void;
}

export const GuidedVoiceFlow = ({ onComplete }: GuidedVoiceFlowProps) => {
  const { toast } = useToast();
  const haptics = useHaptics();
  const {
    guidedVoiceResponses,
    updateGuidedVoiceResponse,
    extractedNarrativeIntent,
    setExtractedNarrativeIntent,
  } = useNarrativeStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [currentTranscript, setCurrentTranscript] = useState("");

  const currentPrompt = GUIDED_PROMPTS[currentStep];
  const isLastStep = currentStep === GUIDED_PROMPTS.length - 1;

  // Get the current response for this step
  const getCurrentResponse = () => {
    return guidedVoiceResponses[currentPrompt.id] || "";
  };

  const handleTranscript = useCallback((text: string) => {
    setCurrentTranscript(prev => prev ? `${prev} ${text}` : text);
  }, []);

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

  // Save the current response and extract insights
  const saveAndProcess = async () => {
    const response = currentTranscript || getCurrentResponse();
    
    if (!response.trim()) {
      toast({
        title: "Please provide a response",
        description: "Record or type your answer before continuing.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    haptics.medium();

    // Save the response
    updateGuidedVoiceResponse(currentPrompt.id, response);

    // Extract structured data if it's a meaningful response
    if (response.length > 20) {
      try {
        const result = await extractNarrativeIntent(response, currentPrompt.extractType);
        
        if (result.intent) {
          // Merge with existing intent
          setExtractedNarrativeIntent({
            ...extractedNarrativeIntent,
            ...(currentPrompt.extractType === 'goal' && { coreMessage: result.intent.coreMessage }),
            ...(currentPrompt.extractType === 'objections' && { keyObjections: result.intent.keyObjections }),
            ...(currentPrompt.extractType === 'proof_points' && { priorityProofPoints: result.intent.priorityProofPoints }),
          });
        }
      } catch (err) {
        console.error("Failed to extract from response:", err);
        // Continue anyway - we have the raw response
      }
    }

    setIsProcessing(false);

    // Move to next step or complete
    if (isLastStep) {
      haptics.success();
      onComplete?.();
    } else {
      setCurrentStep(prev => prev + 1);
      setCurrentTranscript("");
    }
  };

  // Re-record the current step
  const reRecord = () => {
    stopRecording();
    setCurrentTranscript("");
    updateGuidedVoiceResponse(currentPrompt.id, "");
    haptics.light();
  };

  // Skip this prompt
  const skipPrompt = () => {
    if (isLastStep) {
      onComplete?.();
    } else {
      setCurrentStep(prev => prev + 1);
      setCurrentTranscript("");
    }
    haptics.light();
  };

  const Icon = currentPrompt.icon;

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {GUIDED_PROMPTS.map((prompt, index) => (
          <div
            key={prompt.id}
            className={cn(
              "w-3 h-3 rounded-full transition-all duration-300",
              index < currentStep
                ? "bg-green-500"
                : index === currentStep
                ? "bg-primary w-6"
                : "bg-muted"
            )}
          />
        ))}
        <span className="ml-3 text-xs text-muted-foreground">
          {currentStep + 1} of {GUIDED_PROMPTS.length}
        </span>
      </div>

      {/* Current Prompt */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-6"
        >
          {/* Prompt Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Icon className="w-4 h-4" />
              {currentPrompt.title}
            </div>
            
            <h2 className="text-xl md:text-2xl font-bold text-foreground">
              {currentPrompt.question}
            </h2>
          </div>

          {/* Input Area */}
          <div className="space-y-4">
            {/* Voice Mode */}
            {inputMode === 'voice' && isSupported ? (
              <div className="flex flex-col items-center space-y-4">
                <motion.button
                  onClick={() => {
                    toggleRecording();
                    haptics.medium();
                  }}
                  className={cn(
                    "relative w-24 h-24 rounded-full flex items-center justify-center transition-all",
                    isRecording
                      ? "bg-red-500/20 shadow-lg shadow-red-500/20"
                      : "bg-primary/10 hover:bg-primary/20"
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
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

                  {isRecording ? (
                    <MicOff className="w-8 h-8 text-red-400" />
                  ) : (
                    <Mic className="w-8 h-8 text-primary" />
                  )}
                </motion.button>

                <p className="text-sm text-muted-foreground">
                  {isRecording ? (
                    <span className="text-red-400 flex items-center gap-2">
                      <motion.span
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-2 h-2 rounded-full bg-red-400"
                      />
                      Listening... tap to stop
                    </span>
                  ) : (
                    "Tap to record your response"
                  )}
                </p>

                {/* Transcript Display */}
                {currentTranscript && !isRecording && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full p-4 rounded-xl bg-card border border-border/50"
                  >
                    <p className="text-sm text-foreground">{currentTranscript}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        onClick={reRecord}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Re-record
                      </button>
                      <button
                        onClick={() => setInputMode('text')}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Edit as text
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Switch to text */}
                {!currentTranscript && !isRecording && (
                  <button
                    onClick={() => setInputMode('text')}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    or type instead
                  </button>
                )}
              </div>
            ) : (
              /* Text Mode */
              <div className="space-y-3">
                <Textarea
                  value={currentTranscript || getCurrentResponse()}
                  onChange={(e) => setCurrentTranscript(e.target.value)}
                  placeholder={currentPrompt.placeholder}
                  className="min-h-[120px] bg-card border-border/50 resize-none"
                  autoFocus
                />
                
                {isSupported && (
                  <button
                    onClick={() => setInputMode('voice')}
                    className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2"
                  >
                    <Mic className="w-4 h-4" />
                    Switch to voice
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={skipPrompt}
              disabled={isProcessing}
            >
              Skip
            </Button>
            
            <Button
              variant="shimmer"
              onClick={saveAndProcess}
              disabled={isProcessing || isRecording || (!currentTranscript && !getCurrentResponse())}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : isLastStep ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Complete
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Completed Prompts Summary */}
      {currentStep > 0 && (
        <div className="pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-2">Recorded responses:</p>
          <div className="space-y-2">
            {GUIDED_PROMPTS.slice(0, currentStep).map((prompt, index) => {
              const response = guidedVoiceResponses[prompt.id];
              if (!response) return null;
              
              const PromptIcon = prompt.icon;
              return (
                <div
                  key={prompt.id}
                  className="flex items-start gap-2 text-xs"
                >
                  <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-green-500" />
                  </div>
                  <div>
                    <span className="font-medium text-foreground">{prompt.title}:</span>
                    <span className="text-muted-foreground ml-1">
                      {response.length > 80 ? response.slice(0, 80) + "..." : response}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

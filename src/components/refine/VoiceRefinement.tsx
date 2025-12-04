import { useCallback } from "react";
import { motion } from "framer-motion";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { useToast } from "@/hooks/use-toast";
import { VoiceRecorder } from "@/components/input/VoiceRecorder";
import { Textarea } from "@/components/ui/textarea";

interface VoiceRefinementProps {
  feedback: string;
  onFeedbackChange: (feedback: string) => void;
}

export const VoiceRefinement = ({
  feedback,
  onFeedbackChange,
}: VoiceRefinementProps) => {
  const { toast } = useToast();

  const handleTranscript = useCallback(
    (text: string) => {
      onFeedbackChange(feedback ? `${feedback} ${text}` : text);
    },
    [feedback, onFeedbackChange]
  );

  const handleVoiceError = useCallback(
    (errorMsg: string) => {
      toast({
        title: "Voice error",
        description: errorMsg,
        variant: "destructive",
      });
    },
    [toast]
  );

  const { isRecording, isSupported, toggleRecording } = useVoiceRecorder({
    onTranscript: handleTranscript,
    onError: handleVoiceError,
  });

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Tell us what you like, don't like, want to emphasize, or anything misleading
        </p>
      </div>

      {/* Voice Input */}
      <div className="flex justify-center">
        <VoiceRecorder
          isRecording={isRecording}
          isSupported={isSupported}
          onToggle={toggleRecording}
        />
      </div>

      {/* Or type feedback */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-border/50" />
        <span className="text-xs text-muted-foreground">or type</span>
        <div className="flex-1 h-px bg-border/50" />
      </div>

      <Textarea
        value={feedback}
        onChange={(e) => onFeedbackChange(e.target.value)}
        placeholder="I want to emphasize... / This part seems misleading because... / Remove the section about..."
        className="min-h-[150px] bg-card border-border/50 resize-none text-sm"
      />

      {feedback && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-muted-foreground"
        >
          {feedback.length} characters of feedback
        </motion.p>
      )}
    </div>
  );
};
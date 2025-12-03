import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceRecorderProps {
  isRecording: boolean;
  isSupported: boolean;
  onToggle: () => void;
}

export const VoiceRecorder = ({ isRecording, isSupported, onToggle }: VoiceRecorderProps) => {
  if (!isSupported) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.button
        onClick={onToggle}
        className={cn(
          "relative w-24 h-24 rounded-full flex items-center justify-center transition-colors",
          isRecording 
            ? "bg-red-500/20 text-red-400" 
            : "bg-card hover:bg-card/80 text-muted-foreground hover:text-foreground shimmer-border"
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
          <MicOff className="w-8 h-8" />
        ) : (
          <Mic className="w-8 h-8" />
        )}
      </motion.button>

      <p className="text-sm text-muted-foreground">
        {isRecording ? "Tap to stop" : "Tap to speak"}
      </p>
    </div>
  );
};

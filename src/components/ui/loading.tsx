import { motion } from "framer-motion";
import { LoadingStages } from "./loading-stages";

interface LoadingOverlayProps {
  message?: string;
  stage?: number;
  progress?: number;
  inputLength?: number;
}

export const LoadingOverlay = ({ 
  message = "Processing...", 
  stage = 0, 
  progress = 0,
  inputLength = 0 
}: LoadingOverlayProps) => {
  // Use staged loading for narrative building, simple spinner otherwise
  const useStages = stage > 0 || progress > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
    >
      {useStages ? (
        <LoadingStages stage={stage} progress={progress} inputLength={inputLength} />
      ) : (
        <div className="flex flex-col items-center gap-6">
          <motion.div
            className="relative"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <div className="w-12 h-12 rounded-full border-2 border-shimmer-start/20" />
            <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-t-shimmer-start" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-sm text-muted-foreground"
          >
            {message}
          </motion.p>
        </div>
      )}
    </motion.div>
  );
};

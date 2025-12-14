import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LoadingStages } from "./loading-stages";
import { criticalImages, isImageReady, onImageReady } from "@/lib/imagePreloader";

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
  const [logoReady, setLogoReady] = useState(() => isImageReady("conclusivIcon"));
  
  // Use staged loading for narrative building (when we have explicit stages)
  const useStages = stage > 0;

  useEffect(() => {
    if (logoReady) return;
    return onImageReady("conclusivIcon", () => setLogoReady(true));
  }, [logoReady]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm overflow-hidden"
    >
      {useStages ? (
        <LoadingStages stage={stage} progress={progress} inputLength={inputLength} />
      ) : (
        <div className="flex flex-col items-center gap-6">
          {/* Simple branded loader with C logo - matches staged loading style exactly */}
          <div className="relative flex items-center justify-center">
            {/* Glow effect - same as staged loading */}
            <motion.div
              className="absolute w-28 h-28 rounded-full bg-shimmer-start/10 blur-xl"
              initial={{ opacity: 0.3, scale: 0.95 }}
              animate={{ opacity: [0.3, 0.4, 0.3], scale: [0.95, 1, 0.95] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            
            {/* Progress ring - indeterminate spinner matching staged loading dimensions */}
            <svg className="w-24 h-24" viewBox="0 0 96 96" style={{ transform: 'rotate(-90deg)' }}>
              {/* Background circle */}
              <circle
                cx="48"
                cy="48"
                r="42"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                className="text-muted/20"
              />
              {/* Spinning arc */}
              <motion.circle
                cx="48"
                cy="48"
                r="42"
                stroke="url(#simple-gradient)"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="66 264"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                style={{ transformOrigin: "center" }}
              />
              <defs>
                <linearGradient id="simple-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--shimmer-start))" />
                  <stop offset="100%" stopColor="hsl(var(--shimmer-end))" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Rotating C logo - same size and style as staged loading */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="relative"
              >
                {/* Subtle glow behind logo */}
                <motion.div
                  className="absolute inset-0 w-10 h-10 bg-shimmer-start/20 rounded-full blur-lg"
                  style={{ transform: 'translate(-5px, -5px)' }}
                  animate={{ opacity: [0.4, 0.6, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                {/* C logo */}
                <motion.img
                  src={criticalImages.conclusivIcon}
                  alt=""
                  className="w-10 h-10 object-contain relative z-10"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: logoReady ? 1 : 0, scale: logoReady ? 1 : 0.8 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </motion.div>
            </div>
          </div>
          
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-sm text-muted-foreground"
          >
            {message}
          </motion.p>
        </div>
      )}
    </motion.div>
  );
};

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
  
  // Use staged loading for narrative building, simple spinner otherwise
  const useStages = stage > 0 || progress > 0;

  useEffect(() => {
    if (logoReady) return;
    return onImageReady("conclusivIcon", () => setLogoReady(true));
  }, [logoReady]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm overflow-hidden"
    >
      {useStages ? (
        <LoadingStages stage={stage} progress={progress} inputLength={inputLength} />
      ) : (
        <div className="flex flex-col items-center gap-6">
          {/* Simple branded loader with C logo */}
          <div className="relative flex items-center justify-center">
            {/* Glow effect */}
            <motion.div
              className="absolute w-20 h-20 rounded-full bg-shimmer-start/10 blur-xl"
              animate={{ opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            
            {/* Progress ring */}
            <svg className="w-16 h-16" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                className="text-muted/20"
              />
              <motion.circle
                cx="32"
                cy="32"
                r="28"
                stroke="url(#simple-gradient)"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="44 176"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                style={{ transformOrigin: "center" }}
              />
              <defs>
                <linearGradient id="simple-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--shimmer-start))" />
                  <stop offset="100%" stopColor="hsl(var(--shimmer-end))" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Rotating C logo */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <motion.img
                src={criticalImages.conclusivIcon}
                alt=""
                className="w-8 h-8 object-contain"
                initial={{ opacity: 0 }}
                animate={{ opacity: logoReady ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          </div>
          
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

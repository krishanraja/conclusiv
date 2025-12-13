import React, { useCallback, useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { criticalImages, isImageReady, onImageReady } from "@/lib/imagePreloader";

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [imageReady, setImageReady] = useState(() => isImageReady("conclusivIcon"));
  const [animationComplete, setAnimationComplete] = useState(false);
  const hasCompleted = useRef(false);

  // Handle image load if it wasn't already cached
  useEffect(() => {
    if (imageReady) return;
    return onImageReady("conclusivIcon", () => setImageReady(true));
  }, [imageReady]);

  // Trigger completion when both conditions are met
  useEffect(() => {
    if (imageReady && animationComplete && !hasCompleted.current) {
      hasCompleted.current = true;
      setTimeout(onComplete, 200);
    }
  }, [imageReady, animationComplete, onComplete]);

  const handleAnimationComplete = useCallback(() => {
    setAnimationComplete(true);
  }, []);

  // Don't start the splash animation until the image is ready
  if (!imageReady) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
      style={{ willChange: "opacity" }}
    >
      {/* Subtle radial gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background" />
      
      {/* Logo container with loading ring */}
      <div className="relative flex items-center justify-center">
        {/* Outer glow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="absolute w-32 h-32 rounded-full bg-primary/10 blur-xl"
        />
        
        {/* Loading ring */}
        <svg className="absolute w-28 h-28" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="2"
            opacity="0.3"
          />
          
          {/* Animated progress circle */}
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="url(#splash-gradient)"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ 
              duration: 1.6, 
              ease: [0.4, 0, 0.2, 1],
            }}
            onAnimationComplete={handleAnimationComplete}
            style={{ 
              rotate: -90,
              transformOrigin: "center",
              filter: "drop-shadow(0 0 6px hsl(var(--primary) / 0.4))"
            }}
          />
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id="splash-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--shimmer-start))" />
              <stop offset="50%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--shimmer-end))" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Logo - appears immediately since we waited for image to load */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            duration: 0.4, 
            ease: [0.34, 1.3, 0.64, 1],
          }}
          className="relative z-10"
        >
          <img 
            src={criticalImages.conclusivIcon} 
            alt="Conclusiv" 
            className="w-14 h-14 object-contain"
          />
        </motion.div>
      </div>
      
      {/* Tagline */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="absolute bottom-1/3"
      >
        <span className="text-xs text-muted-foreground tracking-widest uppercase">
          Crafting your narrative
        </span>
      </motion.div>
    </motion.div>
  );
};

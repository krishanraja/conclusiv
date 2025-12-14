import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { criticalImages, isImageReady, onImageReady } from "@/lib/imagePreloader";

interface LoadingStagesProps {
  stage: number;
  progress: number;
  inputLength?: number;
}

const stages = [
  { label: "Analyzing research", description: "Reading through your content" },
  { label: "Extracting themes", description: "Identifying key insights" },
  { label: "Building structure", description: "Creating narrative flow" },
  { label: "Generating content", description: "Writing section content" },
  { label: "Finalizing", description: "Almost done — this may take a moment" },
];

export const LoadingStages = ({ stage, progress, inputLength = 0 }: LoadingStagesProps) => {
  const [logoReady, setLogoReady] = useState(() => isImageReady("conclusivIcon"));
  const [displayedProgress, setDisplayedProgress] = useState(progress);
  const lastProgress = useRef(progress);
  const estimatedSeconds = Math.max(10, Math.ceil(inputLength / 2000) * 5);
  const currentStage = stages[Math.min(stage, stages.length - 1)];

  useEffect(() => {
    if (logoReady) return;
    return onImageReady("conclusivIcon", () => setLogoReady(true));
  }, [logoReady]);

  // Smooth progress animation - never go backwards, only forward
  useEffect(() => {
    // Only update if progress is going forward (no glitches/resets)
    if (progress >= lastProgress.current) {
      lastProgress.current = progress;
      setDisplayedProgress(progress);
    }
  }, [progress]);

  // Calculate stroke dasharray for smooth animation
  const circumference = 2 * Math.PI * 56; // r=56
  const strokeDasharray = `${Math.max(10, (displayedProgress / 100) * circumference)} ${circumference}`;

  return (
    <div className="flex flex-col items-center gap-6 md:gap-8 w-full max-w-md px-6 overflow-hidden">
      {/* Main progress ring with C logo - Single unified design */}
      <div className="relative flex items-center justify-center">
        {/* Outer glow effect - subtle and consistent */}
        <motion.div
          className="absolute w-36 h-36 rounded-full bg-shimmer-start/10 blur-2xl"
          initial={{ opacity: 0.3, scale: 0.95 }}
          animate={{ opacity: [0.3, 0.4, 0.3], scale: [0.95, 1, 0.95] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Progress ring SVG - stable, no format changes */}
        <svg className="w-32 h-32" viewBox="0 0 128 128" style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle - always visible */}
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-muted/20"
          />
          {/* Progress arc - smooth transitions only */}
          <motion.circle
            cx="64"
            cy="64"
            r="56"
            stroke="url(#loading-gradient-stages)"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            style={{ strokeDasharray, strokeDashoffset: 0 }}
            initial={false}
            animate={{ strokeDasharray }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="loading-gradient-stages" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--shimmer-start))" />
              <stop offset="100%" stopColor="hsl(var(--shimmer-end))" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Rotating C logo in center - consistent animation */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="relative"
          >
            {/* Subtle glow behind logo */}
            <motion.div
              className="absolute inset-0 w-14 h-14 bg-shimmer-start/20 rounded-full blur-lg"
              style={{ transform: 'translate(-7px, -7px)' }}
              animate={{ opacity: [0.4, 0.6, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* C logo - fade in once ready, then stay visible */}
            <motion.img
              src={criticalImages.conclusivIcon}
              alt=""
              className="w-14 h-14 object-contain relative z-10"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: logoReady ? 1 : 0, scale: logoReady ? 1 : 0.8 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </motion.div>
        </div>
      </div>

      {/* Stage info - smooth text transitions with AnimatePresence */}
      <AnimatePresence mode="wait">
        <motion.div
          key={stage}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="text-center space-y-2"
        >
          <p className="text-lg font-medium text-foreground">{currentStage.label}</p>
          <p className="text-sm text-muted-foreground">{currentStage.description}</p>
          {/* Show "Still working..." after stage stays same for a while */}
          {stage === 4 && displayedProgress > 80 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3 }}
              className="text-xs text-muted-foreground/70"
            >
              Still working...
            </motion.p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Progress dots - smooth fill animation */}
      <div className="flex items-center gap-2">
        {stages.map((_, i) => (
          <motion.div
            key={i}
            className={cn(
              "rounded-full transition-all duration-500",
              i < stage ? "w-2 h-2 bg-shimmer-start" :
              i === stage ? "w-4 h-2 bg-shimmer-end" :
              "w-2 h-2 bg-muted/30"
            )}
            animate={i === stage ? { opacity: [0.7, 1, 0.7] } : { opacity: 1 }}
            transition={i === stage ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : {}}
          />
        ))}
      </div>

      {/* Estimated time - only show for longer documents */}
      {inputLength > 5000 && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-xs text-muted-foreground"
        >
          Estimated time: ~{estimatedSeconds}s for {(inputLength / 1000).toFixed(0)}k characters
        </motion.p>
      )}

      {/* Helpful tips - appears after initial focus on loading */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3, duration: 0.8 }}
        className="text-xs text-muted-foreground/70 text-center max-w-xs"
      >
        <TipCarousel />
      </motion.div>
    </div>
  );
};

const tips = [
  "Add your company website for personalized narratives",
  "Voice input works best with continuous speech",
  "Longer documents are chunked automatically",
  "Use preview to tweak themes and templates",
  "Press Escape to exit presentation mode",
];

const TipCarousel = () => {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.p
      key={tipIndex}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.5 }}
    >
      {tips[tipIndex]}
    </motion.p>
  );
};

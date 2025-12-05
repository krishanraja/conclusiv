import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Sparkles, Layout, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStagesProps {
  stage: number;
  progress: number;
  inputLength?: number;
}

const stages = [
  { icon: Search, label: "Analyzing research", description: "Reading through your content" },
  { icon: Sparkles, label: "Extracting themes", description: "Identifying key insights" },
  { icon: Layout, label: "Building structure", description: "Creating narrative flow" },
  { icon: FileText, label: "Generating content", description: "Writing section content" },
  { icon: Loader2, label: "Finalizing", description: "Almost done — this may take a moment" },
];

export const LoadingStages = ({ stage, progress, inputLength = 0 }: LoadingStagesProps) => {
  const estimatedSeconds = Math.max(10, Math.ceil(inputLength / 2000) * 5);
  const currentStage = stages[Math.min(stage, stages.length - 1)];
  const StageIcon = currentStage.icon;
  const isFinalizing = stage >= stages.length - 1;

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-md">
      {/* Main progress ring */}
      <div className="relative">
        <motion.svg 
          className="w-32 h-32"
          animate={isFinalizing ? { rotate: 360 } : { rotate: -90 }}
          transition={isFinalizing ? { duration: 3, repeat: Infinity, ease: "linear" } : { duration: 0 }}
          style={{ transform: isFinalizing ? undefined : 'rotate(-90deg)' }}
        >
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted/20"
          />
          <motion.circle
            cx="64"
            cy="64"
            r="56"
            stroke="url(#gradient)"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            initial={{ strokeDasharray: "0 352" }}
            animate={{ 
              strokeDasharray: isFinalizing 
                ? "88 352" // Quarter circle for spinning effect
                : `${(progress / 100) * 352} 352` 
            }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--shimmer-start))" />
              <stop offset="100%" stopColor="hsl(var(--shimmer-end))" />
            </linearGradient>
          </defs>
        </motion.svg>
        
        {/* Center icon with gentle breathing glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            key={stage}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative"
          >
            {/* Breathing glow behind icon */}
            <motion.div
              className="absolute inset-0 w-10 h-10 bg-shimmer-start/30 rounded-full blur-xl"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <StageIcon 
              className={cn(
                "w-10 h-10 text-shimmer-start relative z-10",
                isFinalizing && "animate-spin"
              )} 
            />
          </motion.div>
        </div>
      </div>

      {/* Stage info */}
      <motion.div
        key={stage}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-center space-y-2"
      >
        <p className="text-lg font-medium text-foreground">{currentStage.label}</p>
        <p className="text-sm text-muted-foreground">{currentStage.description}</p>
        {isFinalizing && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-muted-foreground/70"
          >
            Still working...
          </motion.p>
        )}
      </motion.div>

      {/* Stage indicators - gentle opacity pulse instead of jarring scale */}
      <div className="flex items-center gap-2">
        {stages.map((s, i) => (
          <motion.div
            key={i}
            className={cn(
              "w-2 h-2 rounded-full transition-colors duration-500",
              i < stage ? "bg-shimmer-start" :
              i === stage ? "bg-shimmer-end" :
              "bg-muted/30"
            )}
            animate={i === stage ? { opacity: [0.6, 1, 0.6] } : { opacity: 1 }}
            transition={i === stage ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {}}
          />
        ))}
      </div>

      {/* Estimated time */}
      {inputLength > 5000 && (
        <p className="text-xs text-muted-foreground">
          Estimated time: ~{estimatedSeconds}s for {(inputLength / 1000).toFixed(0)}k characters
        </p>
      )}

      {/* Tips carousel */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.8 }}
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

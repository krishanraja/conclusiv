import { motion } from "framer-motion";
import { Search, Sparkles, Layout, FileText, Check } from "lucide-react";
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
  { icon: Check, label: "Finalizing", description: "Polishing the presentation" },
];

export const LoadingStages = ({ stage, progress, inputLength = 0 }: LoadingStagesProps) => {
  // Estimate time based on input length
  const estimatedSeconds = Math.max(10, Math.ceil(inputLength / 2000) * 5);
  const currentStage = stages[Math.min(stage, stages.length - 1)];
  const StageIcon = currentStage.icon;

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-md">
      {/* Main progress ring */}
      <div className="relative">
        <svg className="w-32 h-32 transform -rotate-90">
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
            animate={{ strokeDasharray: `${(progress / 100) * 352} 352` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--shimmer-start))" />
              <stop offset="100%" stopColor="hsl(var(--shimmer-end))" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            key={stage}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <StageIcon className="w-10 h-10 text-shimmer-start" />
          </motion.div>
        </div>
      </div>

      {/* Stage info */}
      <motion.div
        key={stage}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <p className="text-lg font-medium text-foreground">{currentStage.label}</p>
        <p className="text-sm text-muted-foreground">{currentStage.description}</p>
      </motion.div>

      {/* Stage indicators */}
      <div className="flex items-center gap-2">
        {stages.map((s, i) => (
          <motion.div
            key={i}
            className={cn(
              "w-2 h-2 rounded-full transition-colors duration-300",
              i < stage ? "bg-shimmer-start" :
              i === stage ? "bg-shimmer-end" :
              "bg-muted/30"
            )}
            animate={i === stage ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
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
        transition={{ delay: 2 }}
        className="text-xs text-muted-foreground/70 text-center max-w-xs"
      >
        <TipCarousel />
      </motion.div>
    </div>
  );
};

const tips = [
  "Tip: Add your company website for personalized output",
  "Tip: Voice input works best with continuous speech",
  "Tip: Longer documents get chunked automatically",
  "Tip: Use the preview to tweak themes and templates",
  "Tip: Press Escape to exit presentation mode",
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
    >
      {tips[tipIndex]}
    </motion.p>
  );
};

import { useState, useEffect } from "react";

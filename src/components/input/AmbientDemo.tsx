import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, TrendingUp, Target, Shield } from "lucide-react";
import { useNarrativeStore } from "@/store/narrativeStore";

const demoSections = [
  { title: "Market Opportunity", icon: TrendingUp, color: "text-emerald-400" },
  { title: "Strategic Insight", icon: Lightbulb, color: "text-amber-400" },
  { title: "Competitive Edge", icon: Shield, color: "text-blue-400" },
  { title: "Growth Path", icon: Target, color: "text-purple-400" },
];

export const AmbientDemo = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { rawText } = useNarrativeStore();
  const hasContent = rawText.length > 0;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % demoSections.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const currentSection = demoSections[currentIndex];
  const Icon = currentSection.icon;

  // Hide when user has content
  if (hasContent) return null;

  return (
    <motion.div 
      className="fixed bottom-8 right-8 hidden md:block z-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1 }}
    >
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150" />
        
        {/* Demo card */}
        <div className="relative glass rounded-xl p-4 w-48 border border-border/30">
          {/* Mini header */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-shimmer-start animate-pulse" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Live Preview
            </span>
          </div>

          {/* Animated section */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="space-y-2"
            >
              <div className={`w-8 h-8 rounded-lg bg-card flex items-center justify-center ${currentSection.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-medium text-foreground">
                {currentSection.title}
              </h4>
              <div className="space-y-1">
                <div className="h-1.5 bg-foreground/10 rounded-full w-full" />
                <div className="h-1.5 bg-foreground/10 rounded-full w-3/4" />
                <div className="h-1.5 bg-foreground/10 rounded-full w-1/2" />
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Progress dots */}
          <div className="flex justify-center gap-1 mt-4">
            {demoSections.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === currentIndex ? "bg-shimmer-start" : "bg-foreground/20"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
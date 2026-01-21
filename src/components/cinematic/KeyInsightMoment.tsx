import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useAnimationBounds } from "@/hooks/useWindowSize";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface KeyInsightMomentProps {
  insight: string;
  isVisible: boolean;
  onDismiss: () => void;
}

export const KeyInsightMoment = ({ insight, isVisible, onDismiss }: KeyInsightMomentProps) => {
  // Get safe animation boundaries (with 15% padding for safety)
  const bounds = useAnimationBounds(0.15);
  const reducedMotion = useReducedMotion();
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-background/95 backdrop-blur-sm cursor-pointer"
          onClick={onDismiss}
        >
          {/* Vignette effect */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at center, transparent 40%, hsl(var(--background)) 100%)"
            }}
          />

          {/* Particle burst */}
          {!reducedMotion && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(20)].map((_, i) => {
                // Calculate safe particle trajectory within viewport bounds
                const angle = (i / 20) * Math.PI * 2; // Evenly distribute particles in a circle
                const distance = 80 + Math.random() * 120; // Vary distance between 80-200px
                const boundedX = Math.max(bounds.minX, Math.min(bounds.maxX, Math.cos(angle) * distance));
                const boundedY = Math.max(bounds.minY, Math.min(bounds.maxY, Math.sin(angle) * distance));

                return (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-shimmer-start will-change-transform"
                    style={{
                      left: "50%",
                      top: "50%",
                    }}
                    initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                    animate={{
                      scale: [0, 1, 0.5],
                      x: boundedX,
                      y: boundedY,
                      opacity: [1, 1, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      delay: i * 0.03,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* Main insight card */}
          <motion.div
            initial={reducedMotion ? { opacity: 0 } : { scale: 0.8, y: 20 }}
            animate={reducedMotion ? { opacity: 1 } : { scale: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { scale: 0.9, y: -20 }}
            transition={reducedMotion ? { duration: 0.2 } : { duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative max-w-2xl mx-8 p-12 rounded-2xl bg-card/80 border border-shimmer-start/30 shadow-2xl"
            style={{
              boxShadow: "0 0 60px hsl(var(--shimmer-start) / 0.2), 0 25px 50px -12px hsl(0 0% 0% / 0.5)"
            }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-2 mb-6"
            >
              <Sparkles className="w-4 h-4 text-shimmer-start" />
              <span className="text-xs uppercase tracking-[0.2em] text-shimmer-start font-medium">
                Key Insight
              </span>
              <Sparkles className="w-4 h-4 text-shimmer-start" />
            </motion.div>

            {/* The insight text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-2xl md:text-3xl font-medium text-center leading-relaxed"
            >
              {insight}
            </motion.p>

            {/* Tap to continue */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-8 text-center text-xs text-muted-foreground"
            >
              Tap anywhere to continue
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

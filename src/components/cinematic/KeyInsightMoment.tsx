import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

interface KeyInsightMomentProps {
  insight: string;
  isVisible: boolean;
  onDismiss: () => void;
}

export const KeyInsightMoment = ({ insight, isVisible, onDismiss }: KeyInsightMomentProps) => {
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
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-shimmer-start"
                style={{
                  left: "50%",
                  top: "50%",
                }}
                initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                animate={{
                  scale: [0, 1, 0.5],
                  x: (Math.random() - 0.5) * 400,
                  y: (Math.random() - 0.5) * 400,
                  opacity: [1, 1, 0],
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.03,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            ))}
          </div>

          {/* Main insight card */}
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: -20 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
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

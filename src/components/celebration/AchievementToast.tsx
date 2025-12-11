import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Zap, Flame } from "lucide-react";

interface AchievementToastProps {
  isVisible: boolean;
  message: string;
  icon?: string;
}

const iconMap: Record<string, React.ReactNode> = {
  trophy: <Trophy className="w-5 h-5" />,
  star: <Star className="w-5 h-5" />,
  zap: <Zap className="w-5 h-5" />,
  flame: <Flame className="w-5 h-5" />,
};

export const AchievementToast = ({ isVisible, message, icon = "trophy" }: AchievementToastProps) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[150] pointer-events-none"
        >
          <div className="flex items-center gap-3 px-5 py-3 rounded-full bg-gradient-to-r from-shimmer-start/20 to-accent/20 border border-shimmer-start/30 shadow-lg backdrop-blur-sm">
            {/* Icon with glow */}
            <motion.div
              initial={{ rotate: -20, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
              className="p-2 rounded-full bg-shimmer-start/30 text-shimmer-start"
            >
              {iconMap[icon] || iconMap.trophy}
            </motion.div>

            {/* Message */}
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-sm font-medium pr-2"
            >
              {message}
            </motion.span>

            {/* Sparkle effects */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-shimmer-start"
                style={{
                  left: `${20 + i * 30}%`,
                  top: "-10px",
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 1,
                  delay: 0.5 + i * 0.2,
                  repeat: 2,
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

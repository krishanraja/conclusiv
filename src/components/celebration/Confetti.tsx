import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWindowSize, useAnimationBounds } from "@/hooks/useWindowSize";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
  rotation: number;
  size: number;
}

interface ConfettiProps {
  isActive: boolean;
  duration?: number;
  particleCount?: number;
}

const COLORS = [
  "hsl(78, 100%, 83%)",   // shimmer-start
  "hsl(157, 35%, 48%)",   // accent lighter
  "hsl(48, 100%, 70%)",   // gold
  "hsl(280, 80%, 70%)",   // purple
  "hsl(200, 80%, 70%)",   // blue
];

export const Confetti = ({ isActive, duration = 3000, particleCount = 50 }: ConfettiProps) => {
  const { height } = useWindowSize(); // Reactive window height
  const reducedMotion = useReducedMotion();
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isActive) {
      setShow(true);
      const newPieces: ConfettiPiece[] = [];
      for (let i = 0; i < particleCount; i++) {
        newPieces.push({
          id: i,
          x: Math.random() * 100,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          delay: Math.random() * 0.3,
          duration: 2 + Math.random() * 2,
          rotation: Math.random() * 720 - 360,
          size: 6 + Math.random() * 8,
        });
      }
      setPieces(newPieces);

      const timer = setTimeout(() => {
        setShow(false);
        setPieces([]);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isActive, duration, particleCount]);

  // Skip confetti entirely for reduced motion preference
  if (reducedMotion) return null;

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
          {pieces.map((piece) => (
            <motion.div
              key={piece.id}
              className="absolute will-change-transform"
              style={{
                left: `${piece.x}%`,
                top: -20,
                width: piece.size,
                height: piece.size * 0.6,
                backgroundColor: piece.color,
                borderRadius: 2,
              }}
              initial={{ y: -20, rotate: 0, opacity: 1 }}
              animate={{
                y: height + 100, // Use reactive height instead of window.innerHeight
                rotate: piece.rotation,
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: piece.duration,
                delay: piece.delay,
                ease: [0.1, 0.25, 0.3, 1],
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
};

// Mini celebration for smaller achievements
export const MiniCelebration = ({ isActive }: { isActive: boolean }) => {
  const [show, setShow] = useState(false);
  const { width } = useWindowSize();
  const reducedMotion = useReducedMotion();

  // Scale burst radius based on screen size (60px on desktop, scales down on mobile)
  const burstRadius = Math.min(60, width * 0.15);

  useEffect(() => {
    if (isActive) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={reducedMotion ? { duration: 0.2 } : { type: "spring", stiffness: 400, damping: 15 }}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[200] pointer-events-none"
        >
          {!reducedMotion && [...Array(8)].map((_, i) => {
            const angle = (i * Math.PI * 2) / 8;
            return (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full bg-shimmer-start will-change-transform"
                style={{
                  left: "50%",
                  top: "50%",
                }}
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  x: Math.cos(angle) * burstRadius,
                  y: Math.sin(angle) * burstRadius,
                }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.03,
                }}
              />
            );
          })}
          <motion.div
            initial={reducedMotion ? {} : { scale: 0 }}
            animate={reducedMotion ? {} : { scale: [0, 1.2, 1] }}
            className="text-4xl"
          >
            ✨
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

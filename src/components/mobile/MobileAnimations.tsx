/**
 * MobileAnimations - Stunning, performant animations optimized for mobile
 * Features haptic feedback and smooth 60fps performance
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';

// ============================================================================
// 1. PULSE RING ANIMATION - Expands with haptic on interaction
// ============================================================================

interface PulseRingProps {
  isActive?: boolean;
  color?: string;
  size?: number;
  onPulse?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export const PulseRing = ({ 
  isActive = false, 
  color = 'primary',
  size = 80,
  onPulse,
  children,
  className,
}: PulseRingProps) => {
  const haptics = useHaptics();
  const [isPulsing, setIsPulsing] = useState(false);

  const handleTap = useCallback(() => {
    setIsPulsing(true);
    haptics.medium();
    onPulse?.();
    
    setTimeout(() => {
      setIsPulsing(false);
    }, 600);
  }, [haptics, onPulse]);

  return (
    <motion.div
      className={cn("relative flex items-center justify-center cursor-pointer", className)}
      style={{ width: size, height: size }}
      whileTap={{ scale: 0.95 }}
      onTap={handleTap}
    >
      {/* Outer pulsing rings */}
      <AnimatePresence>
        {(isPulsing || isActive) && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={`absolute inset-0 rounded-full border-2 border-${color}`}
                initial={{ scale: 0.5, opacity: 0.8 }}
                animate={{ 
                  scale: [0.5, 1.5 + i * 0.3],
                  opacity: [0.8, 0],
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 0.8,
                  delay: i * 0.15,
                  ease: [0.4, 0, 0.2, 1],
                }}
                style={{ borderColor: `hsl(var(--${color}))` }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Center content */}
      <motion.div
        className={cn(
          "relative z-10 rounded-full flex items-center justify-center",
          `bg-${color}/20`
        )}
        style={{ 
          width: size * 0.6, 
          height: size * 0.6,
          backgroundColor: `hsl(var(--${color}) / 0.2)`,
        }}
        animate={{
          scale: isActive ? [1, 1.05, 1] : 1,
        }}
        transition={{
          duration: 2,
          repeat: isActive ? Infinity : 0,
          ease: "easeInOut",
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

// ============================================================================
// 2. CARD STACK SWIPE - Interactive card swiping with haptic feedback
// ============================================================================

interface CardStackItem {
  id: string;
  content: React.ReactNode;
}

interface CardStackSwipeProps {
  items: CardStackItem[];
  onSwipe?: (id: string, direction: 'left' | 'right') => void;
  onEmpty?: () => void;
  className?: string;
}

export const CardStackSwipe = ({ 
  items, 
  onSwipe, 
  onEmpty,
  className 
}: CardStackSwipeProps) => {
  const haptics = useHaptics();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);

  const handleDragEnd = useCallback((info: PanInfo) => {
    const threshold = 100;
    const velocity = info.velocity.x;
    const offset = info.offset.x;

    if (Math.abs(offset) > threshold || Math.abs(velocity) > 500) {
      const direction = offset > 0 ? 'right' : 'left';
      setExitDirection(direction);
      haptics.success();
      
      setTimeout(() => {
        onSwipe?.(items[currentIndex].id, direction);
        setCurrentIndex(prev => {
          const next = prev + 1;
          if (next >= items.length) {
            onEmpty?.();
          }
          return next;
        });
        setExitDirection(null);
      }, 200);
    }
  }, [currentIndex, items, onSwipe, onEmpty, haptics]);

  const handleDrag = useCallback((info: PanInfo) => {
    if (Math.abs(info.offset.x) > 50) {
      haptics.selection();
    }
  }, [haptics]);

  if (currentIndex >= items.length) {
    return null;
  }

  return (
    <div className={cn("relative h-[300px] w-full", className)}>
      {items.slice(currentIndex, currentIndex + 3).map((item, i) => {
        const isTop = i === 0;
        const stackOffset = i * 8;
        const stackScale = 1 - i * 0.05;

        return (
          <motion.div
            key={item.id}
            className={cn(
              "absolute inset-x-4 top-0 h-full rounded-2xl bg-card border border-border shadow-xl overflow-hidden",
              isTop ? "cursor-grab active:cursor-grabbing" : ""
            )}
            style={{
              zIndex: items.length - i,
            }}
            initial={{ 
              y: stackOffset,
              scale: stackScale,
              opacity: 1 - i * 0.2,
            }}
            animate={exitDirection && isTop ? {
              x: exitDirection === 'left' ? -400 : 400,
              rotate: exitDirection === 'left' ? -20 : 20,
              opacity: 0,
            } : {
              y: stackOffset,
              scale: stackScale,
              opacity: 1 - i * 0.2,
            }}
            transition={{
              type: "spring",
              damping: 20,
              stiffness: 300,
            }}
            drag={isTop ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.8}
            onDrag={(_, info) => isTop && handleDrag(info)}
            onDragEnd={(_, info) => isTop && handleDragEnd(info)}
          >
            {item.content}
          </motion.div>
        );
      })}

      {/* Swipe indicators */}
      <motion.div
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.8 }}
        whileHover={{ opacity: 1, scale: 1 }}
      >
        <span className="text-destructive text-xl">✕</span>
      </motion.div>
      <motion.div
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.8 }}
        whileHover={{ opacity: 1, scale: 1 }}
      >
        <span className="text-primary text-xl">✓</span>
      </motion.div>
    </div>
  );
};

// ============================================================================
// 3. MOMENTUM SCROLL REVEAL - Smooth scroll-triggered reveals with haptics
// ============================================================================

interface ScrollRevealItemProps {
  children: React.ReactNode;
  index?: number;
  className?: string;
}

export const ScrollRevealItem = ({ 
  children, 
  index = 0,
  className 
}: ScrollRevealItemProps) => {
  const haptics = useHaptics();
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hasTriggeredHaptic = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
          if (!hasTriggeredHaptic.current) {
            hasTriggeredHaptic.current = true;
            haptics.light();
          }
        }
      },
      {
        threshold: 0.3,
        rootMargin: '-50px',
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [haptics, isVisible]);

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={isVisible ? {
        opacity: 1,
        y: 0,
        scale: 1,
      } : {}}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {children}
    </motion.div>
  );
};

// ============================================================================
// 4. MAGNETIC BUTTON - Pulls toward touch with haptic feedback
// ============================================================================

interface MagneticButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  magnetStrength?: number;
}

export const MagneticButton = ({
  children,
  onClick,
  className,
  magnetStrength = 0.3,
}: MagneticButtonProps) => {
  const haptics = useHaptics();
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleMove = useCallback((e: React.PointerEvent) => {
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = (e.clientX - centerX) * magnetStrength;
    const deltaY = (e.clientY - centerY) * magnetStrength;
    
    x.set(deltaX);
    y.set(deltaY);
  }, [x, y, magnetStrength]);

  const handleLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  const handleClick = useCallback(() => {
    haptics.medium();
    onClick?.();
  }, [haptics, onClick]);

  return (
    <motion.button
      ref={ref}
      className={cn(
        "relative touch-none",
        className
      )}
      style={{ x, y }}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      onClick={handleClick}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {children}
    </motion.button>
  );
};

// ============================================================================
// 5. RADIAL PROGRESS - Circular progress with haptic milestones
// ============================================================================

interface RadialProgressProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
  milestones?: number[]; // Percentages at which to trigger haptics
}

export const RadialProgress = ({
  value,
  size = 100,
  strokeWidth = 8,
  className,
  children,
  milestones = [25, 50, 75, 100],
}: RadialProgressProps) => {
  const haptics = useHaptics();
  const lastMilestone = useRef(0);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  useEffect(() => {
    const currentMilestone = milestones.find(m => value >= m && lastMilestone.current < m);
    if (currentMilestone) {
      lastMilestone.current = currentMilestone;
      if (currentMilestone === 100) {
        haptics.success();
      } else {
        haptics.light();
      }
    }
  }, [value, milestones, haptics]);

  return (
    <div className={cn("relative inline-flex", className)} style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children ?? (
          <span className="text-lg font-semibold text-foreground">
            {Math.round(value)}%
          </span>
        )}
      </div>
    </div>
  );
};

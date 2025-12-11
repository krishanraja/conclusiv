import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OnboardingSpotlightProps {
  targetSelector: string;
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
  onNext: () => void;
  onSkip: () => void;
  showSkip?: boolean;
  actionLabel?: string;
  isActive: boolean;
}

export const OnboardingSpotlight = ({
  targetSelector,
  title,
  description,
  position = "bottom",
  onNext,
  onSkip,
  showSkip = true,
  actionLabel = "Next",
  isActive,
}: OnboardingSpotlightProps) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;

    const updatePosition = () => {
      const target = document.querySelector(targetSelector);
      if (target) {
        const rect = target.getBoundingClientRect();
        setTargetRect(rect);

        // Calculate tooltip position
        const padding = 16;
        let x = rect.left + rect.width / 2;
        let y = rect.bottom + padding;

        // Adjust based on position prop
        if (position === "top") {
          y = rect.top - padding;
        } else if (position === "left") {
          x = rect.left - padding;
          y = rect.top + rect.height / 2;
        } else if (position === "right") {
          x = rect.right + padding;
          y = rect.top + rect.height / 2;
        }

        // Keep tooltip in viewport
        const tooltipWidth = 280;
        const tooltipHeight = 150;
        
        x = Math.max(tooltipWidth / 2 + 16, Math.min(x, window.innerWidth - tooltipWidth / 2 - 16));
        
        if (position === "bottom" && y + tooltipHeight > window.innerHeight) {
          y = rect.top - padding - tooltipHeight;
        }

        setTooltipPosition({ x, y });
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [targetSelector, position, isActive]);

  if (!isActive || !targetRect) return null;

  const spotlightPadding = 8;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100]"
      >
        {/* Overlay with cutout */}
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={targetRect.left - spotlightPadding}
                y={targetRect.top - spotlightPadding}
                width={targetRect.width + spotlightPadding * 2}
                height={targetRect.height + spotlightPadding * 2}
                rx="8"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.75)"
            mask="url(#spotlight-mask)"
          />
        </svg>

        {/* Spotlight ring */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute border-2 border-primary rounded-lg pointer-events-none"
          style={{
            left: targetRect.left - spotlightPadding,
            top: targetRect.top - spotlightPadding,
            width: targetRect.width + spotlightPadding * 2,
            height: targetRect.height + spotlightPadding * 2,
            boxShadow: '0 0 0 4px hsl(var(--primary) / 0.2)',
          }}
        />

        {/* Tooltip */}
        <motion.div
          ref={tooltipRef}
          initial={{ opacity: 0, y: position === "top" ? 10 : -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "absolute bg-card border border-border rounded-xl shadow-2xl p-4 w-[280px] z-10",
            position === "top" && "-translate-x-1/2 -translate-y-full",
            position === "bottom" && "-translate-x-1/2",
            position === "left" && "-translate-x-full -translate-y-1/2",
            position === "right" && "-translate-y-1/2"
          )}
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
          }}
        >
          {showSkip && (
            <button
              onClick={onSkip}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <h3 className="font-semibold text-foreground mb-1 pr-6">{title}</h3>
          <p className="text-sm text-muted-foreground mb-4">{description}</p>

          <div className="flex items-center justify-between">
            {showSkip && (
              <button
                onClick={onSkip}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip tour
              </button>
            )}
            <Button size="sm" onClick={onNext} className="ml-auto">
              {actionLabel}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

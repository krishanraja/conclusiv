import { useEffect, useCallback } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNarrativeStore } from "@/store/narrativeStore";
import { cn } from "@/lib/utils";
import { getIcon } from "@/lib/icons";
import { TransitionType } from "@/lib/types";

// Animation variants for different transition types
const getTransitionVariants = (type: TransitionType): Variants => {
  const variantsMap: Record<TransitionType, Variants> = {
    zoom_in: {
      initial: { scale: 0.5, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 1.5, opacity: 0 },
    },
    zoom_out: {
      initial: { scale: 1.5, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.5, opacity: 0 },
    },
    pan: {
      initial: { x: 100, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: -100, opacity: 0 },
    },
    slide_left: {
      initial: { x: "100%", opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: "-100%", opacity: 0 },
    },
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    card_expand: {
      initial: { scale: 0.8, opacity: 0, y: 50 },
      animate: { scale: 1, opacity: 1, y: 0 },
      exit: { scale: 0.8, opacity: 0, y: -50 },
    },
    pan_to_node: {
      initial: { x: 200, y: 50, opacity: 0 },
      animate: { x: 0, y: 0, opacity: 1 },
      exit: { x: -200, y: -50, opacity: 0 },
    },
    orbit: {
      initial: { rotate: -45, scale: 0.8, opacity: 0 },
      animate: { rotate: 0, scale: 1, opacity: 1 },
      exit: { rotate: 45, scale: 0.8, opacity: 0 },
    },
    tilt: {
      initial: { rotateY: 30, opacity: 0 },
      animate: { rotateY: 0, opacity: 1 },
      exit: { rotateY: -30, opacity: 0 },
    },
    split_reveal: {
      initial: { clipPath: "inset(0 50% 0 50%)", opacity: 0 },
      animate: { clipPath: "inset(0 0% 0 0%)", opacity: 1 },
      exit: { clipPath: "inset(0 50% 0 50%)", opacity: 0 },
    },
    side_flip: {
      initial: { rotateY: -90, opacity: 0 },
      animate: { rotateY: 0, opacity: 1 },
      exit: { rotateY: 90, opacity: 0 },
    },
    step_up: {
      initial: { y: 100, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: -100, opacity: 0 },
    },
    highlight: {
      initial: { scale: 0.9, opacity: 0, filter: "brightness(0.5)" },
      animate: { scale: 1, opacity: 1, filter: "brightness(1)" },
      exit: { scale: 1.1, opacity: 0, filter: "brightness(1.5)" },
    },
  };
  
  return variantsMap[type] || variantsMap.fade;
};

export const PresentScreen = () => {
  const { 
    narrative, 
    currentSectionIndex, 
    nextSection, 
    prevSection,
    setCurrentSectionIndex,
    setCurrentStep,
  } = useNarrativeStore();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === " ") {
      nextSection();
    } else if (e.key === "ArrowLeft") {
      prevSection();
    } else if (e.key === "Escape") {
      setCurrentStep("editor");
    }
  }, [nextSection, prevSection, setCurrentStep]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!narrative) return null;

  const currentSection = narrative.sections[currentSectionIndex];
  const currentTransition = narrative.transitions[currentSectionIndex];
  const Icon = getIcon(currentSection.icon);
  const variants = getTransitionVariants(currentTransition?.type || "fade");

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-10">
        <Button
          variant="glass"
          size="sm"
          onClick={() => setCurrentStep("editor")}
        >
          <X className="w-4 h-4 mr-2" />
          Exit
        </Button>

        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {currentSectionIndex + 1} / {narrative.sections.length}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-12 overflow-hidden" style={{ perspective: "1000px" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSection.id}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ 
              duration: 0.6, 
              ease: [0.22, 1, 0.36, 1] 
            }}
            className="max-w-4xl w-full"
          >
            <div className="glass rounded-3xl p-12 text-center">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-8"
              >
                <Icon className="w-12 h-12 text-primary-foreground" />
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="font-display text-5xl font-bold gradient-text mb-6"
              >
                {currentSection.title}
              </motion.h1>

              {/* Content */}
              {currentSection.content && (
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
                >
                  {currentSection.content}
                </motion.p>
              )}

              {/* Items */}
              {currentSection.items && currentSection.items.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 text-left"
                >
                  {currentSection.items.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="p-4 rounded-xl bg-background/50 border border-border"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <p className="text-foreground">{item}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {narrative.sections.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSectionIndex(i)}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              i === currentSectionIndex 
                ? "w-8 bg-primary" 
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
          />
        ))}
      </div>

      {/* Navigation arrows */}
      <div className="absolute bottom-8 left-8 flex items-center gap-2">
        <Button
          variant="glass"
          size="icon"
          onClick={prevSection}
          disabled={currentSectionIndex === 0}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
      </div>

      <div className="absolute bottom-8 right-8 flex items-center gap-2">
        <Button
          variant="glass"
          size="icon"
          onClick={nextSection}
          disabled={currentSectionIndex === narrative.sections.length - 1}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Keyboard hints */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 text-xs text-muted-foreground">
        <span>← → Navigate</span>
        <span>Space Next</span>
        <span>Esc Exit</span>
      </div>
    </div>
  );
};

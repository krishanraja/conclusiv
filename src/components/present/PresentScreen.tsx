import { useEffect, useCallback } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNarrativeStore } from "@/store/narrativeStore";
import { cn } from "@/lib/utils";
import { getIcon } from "@/lib/icons";
import { TransitionType } from "@/lib/types";
import conclusivIcon from "@/assets/conclusiv-icon.png";

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
      setCurrentStep("preview");
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
      <div className="absolute top-0 left-0 right-0 h-14 flex items-center justify-between px-6 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentStep("preview")}
          className="text-muted-foreground"
        >
          <X className="w-4 h-4 mr-1" />
          Exit
        </Button>

        <span className="text-sm text-muted-foreground tabular-nums">
          {currentSectionIndex + 1} / {narrative.sections.length}
        </span>
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
            className="max-w-3xl w-full"
          >
            <div className="rounded-2xl border border-border/40 bg-card/50 p-10 text-center">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center mx-auto mb-6"
              >
                <Icon className="w-8 h-8 text-primary" />
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl font-semibold text-foreground mb-4 tracking-tight"
              >
                {currentSection.title}
              </motion.h1>

              {/* Content */}
              {currentSection.content && (
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-lg text-muted-foreground max-w-xl mx-auto mb-6"
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
                  className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6 text-left"
                >
                  {currentSection.items.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="p-3 rounded-lg bg-background/50 border border-border/30"
                    >
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <p className="text-sm text-foreground">{item}</p>
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
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
        {narrative.sections.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSectionIndex(i)}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i === currentSectionIndex 
                ? "w-6 bg-primary shimmer-glow" 
                : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
          />
        ))}
      </div>

      {/* Navigation arrows */}
      <div className="absolute bottom-8 left-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={prevSection}
          disabled={currentSectionIndex === 0}
          className="text-muted-foreground"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
      </div>

      <div className="absolute bottom-8 right-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={nextSection}
          disabled={currentSectionIndex === narrative.sections.length - 1}
          className="text-muted-foreground"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Watermark */}
      <div className="absolute bottom-4 right-4 opacity-20 hover:opacity-40 transition-opacity">
        <img 
          src={conclusivIcon} 
          alt="conclusiv" 
          className="h-6 w-auto"
          style={{ aspectRatio: 'auto' }}
        />
      </div>
    </div>
  );
};

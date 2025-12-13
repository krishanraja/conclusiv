import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { X, ChevronLeft, ChevronRight, StickyNote } from "lucide-react";
import { useNarrativeStore } from "@/store/narrativeStore";
import { cn } from "@/lib/utils";
import { getIcon } from "@/lib/icons";
import { useBrandLogo } from "@/hooks/useBrandLogo";
import conclusivIcon from "@/assets/conclusiv-icon.png";

interface MobilePresentScreenProps {
  onExit: () => void;
}

export const MobilePresentScreen = ({ onExit }: MobilePresentScreenProps) => {
  const {
    narrative,
    currentSectionIndex,
    nextSection,
    prevSection,
    setCurrentSectionIndex,
    businessContext,
  } = useNarrativeStore();

  const { logoUrl, showLogo } = useBrandLogo();
  const [showNotes, setShowNotes] = useState(false);
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        nextSection();
      } else if (e.key === "ArrowLeft") {
        prevSection();
      } else if (e.key === "Escape") {
        onExit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSection, prevSection, onExit]);

  // Swipe handling
  const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    
    if (info.offset.x < -threshold && currentSectionIndex < (narrative?.sections.length ?? 0) - 1) {
      nextSection();
    } else if (info.offset.x > threshold && currentSectionIndex > 0) {
      prevSection();
    }
    setDragDirection(null);
  }, [currentSectionIndex, narrative?.sections.length, nextSection, prevSection]);

  const handleDrag = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -20) {
      setDragDirection('left');
    } else if (info.offset.x > 20) {
      setDragDirection('right');
    } else {
      setDragDirection(null);
    }
  }, []);

  if (!narrative || narrative.sections.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="text-center p-6">
          <p className="text-muted-foreground">No content to present</p>
          <button
            onClick={onExit}
            className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentSection = narrative.sections[currentSectionIndex];
  const Icon = getIcon(currentSection.icon);
  const progress = ((currentSectionIndex + 1) / narrative.sections.length) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-hidden touch-none">
      {/* Header - Minimal */}
      <div className="absolute top-0 left-0 right-0 z-20 safe-area-inset-top">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Brand/Logo */}
          <div className="flex items-center gap-2">
            {showLogo && logoUrl ? (
              <img src={logoUrl} alt="" className="h-6 w-auto object-contain" />
            ) : (
              <img src={conclusivIcon} alt="" className="h-5 w-5 object-contain opacity-60" />
            )}
          </div>

          {/* Section counter */}
          <div className="text-xs text-muted-foreground">
            {currentSectionIndex + 1} / {narrative.sections.length}
          </div>

          {/* Exit button */}
          <button
            onClick={onExit}
            className="p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-muted/30">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Main Content - Swipeable */}
      <motion.div
        className="absolute inset-0 pt-16 pb-24 px-6 flex flex-col items-center justify-center"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSectionIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full max-w-sm text-center"
          >
            {/* Icon */}
            <motion.div
              className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Icon className="w-8 h-8 text-primary" />
            </motion.div>

            {/* Title */}
            <motion.h1
              className="text-2xl font-bold mb-4 text-foreground"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              {currentSection.title}
            </motion.h1>

            {/* Content */}
            {currentSection.content && (
              <motion.p
                className="text-base text-muted-foreground leading-relaxed"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {currentSection.content}
              </motion.p>
            )}

            {/* Items */}
            {currentSection.items && currentSection.items.length > 0 && (
              <motion.ul
                className="mt-4 text-left space-y-2"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                {currentSection.items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-primary shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </motion.ul>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Swipe hint indicators */}
        <AnimatePresence>
          {dragDirection === 'left' && currentSectionIndex < narrative.sections.length - 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <ChevronRight className="w-8 h-8 text-primary" />
            </motion.div>
          )}
          {dragDirection === 'right' && currentSectionIndex > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="absolute left-4 top-1/2 -translate-y-1/2"
            >
              <ChevronLeft className="w-8 h-8 text-primary" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 z-20 safe-area-inset-bottom">
        <div className="px-4 py-4 bg-gradient-to-t from-background via-background to-transparent">
          {/* Dot navigation */}
          <div className="flex justify-center gap-1.5 mb-4">
            {narrative.sections.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSectionIndex(idx)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-200",
                  idx === currentSectionIndex
                    ? "w-6 bg-primary"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={prevSection}
              disabled={currentSectionIndex === 0}
              className={cn(
                "flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors",
                currentSectionIndex === 0
                  ? "bg-muted/30 text-muted-foreground/50"
                  : "bg-muted text-foreground active:bg-muted/80"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </button>

            <button
              onClick={() => setShowNotes(!showNotes)}
              className="p-3 rounded-xl bg-muted/50 text-muted-foreground active:bg-muted"
            >
              <StickyNote className="w-5 h-5" />
            </button>

            <button
              onClick={nextSection}
              disabled={currentSectionIndex === narrative.sections.length - 1}
              className={cn(
                "flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors",
                currentSectionIndex === narrative.sections.length - 1
                  ? "bg-muted/30 text-muted-foreground/50"
                  : "bg-primary text-primary-foreground active:bg-primary/90"
              )}
            >
              <span className="text-sm font-medium">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Notes overlay */}
      <AnimatePresence>
        {showNotes && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute inset-x-0 bottom-0 z-30 bg-card border-t border-border rounded-t-2xl shadow-2xl"
            style={{ maxHeight: "50vh" }}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-primary" />
                  Speaker Notes
                </h3>
                <button
                  onClick={() => setShowNotes(false)}
                  className="p-1 rounded-full hover:bg-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="text-sm text-muted-foreground italic">
                Tap here to add notes in preview mode
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

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
  } = useNarrativeStore();

  const { logoUrl, showLogo } = useBrandLogo();
  const [showNotes, setShowNotes] = useState(false);
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null);

  // Force fullscreen and lock body scroll
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = '';
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        nextSection();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevSection();
      } else if (e.key === "Escape") {
        onExit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSection, prevSection, onExit]);

  // Swipe handling - full screen swipe
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
    if (info.offset.x < -30) {
      setDragDirection('left');
    } else if (info.offset.x > 30) {
      setDragDirection('right');
    } else {
      setDragDirection(null);
    }
  }, []);

  if (!narrative || narrative.sections.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="text-center p-6">
          <p className="text-muted-foreground mb-4">No content to present</p>
          <button
            onClick={onExit}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium"
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
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-background to-background/95 flex flex-col touch-none">
      {/* Header - Minimal, safe area aware */}
      <div className="flex-shrink-0 pt-safe">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Brand/Logo */}
          <div className="flex items-center gap-2 min-w-0">
            {showLogo && logoUrl ? (
              <img src={logoUrl} alt="" className="h-5 w-auto object-contain max-w-[100px]" />
            ) : (
              <img src={conclusivIcon} alt="" className="h-4 w-4 object-contain opacity-50" />
            )}
          </div>

          {/* Section counter */}
          <div className="text-xs text-muted-foreground font-medium">
            {currentSectionIndex + 1} / {narrative.sections.length}
          </div>

          {/* Exit button */}
          <button
            onClick={onExit}
            className="p-2 -mr-1 rounded-full hover:bg-muted/50 transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-muted/20 mx-4 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Main Content - Swipeable, fills remaining space */}
      <motion.div
        className="flex-1 min-h-0 relative flex items-center justify-center px-6"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSectionIndex}
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -80 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full max-w-sm text-center"
          >
            {/* Icon */}
            <motion.div
              className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-primary/10 flex items-center justify-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.05 }}
            >
              <Icon className="w-8 h-8 text-primary" />
            </motion.div>

            {/* Title */}
            <motion.h1
              className="text-2xl font-bold mb-4 text-foreground px-2"
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {currentSection.title}
            </motion.h1>

            {/* Content */}
            {currentSection.content && (
              <motion.p
                className="text-base text-muted-foreground leading-relaxed"
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                {currentSection.content}
              </motion.p>
            )}

            {/* Items - Show only first 3 for cleaner mobile view */}
            {currentSection.items && currentSection.items.length > 0 && (
              <motion.ul
                className="mt-5 text-left space-y-2.5 mx-auto max-w-xs"
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {currentSection.items.slice(0, 3).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <span className="w-1.5 h-1.5 mt-2 rounded-full bg-primary shrink-0" />
                    <span className="line-clamp-2">{item}</span>
                  </li>
                ))}
                {currentSection.items.length > 3 && (
                  <li className="text-xs text-muted-foreground/60 pl-4">
                    +{currentSection.items.length - 3} more
                  </li>
                )}
              </motion.ul>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Swipe hint indicators */}
        <AnimatePresence>
          {dragDirection === 'left' && currentSectionIndex < narrative.sections.length - 1 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 0.7, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <ChevronRight className="w-10 h-10 text-primary" />
            </motion.div>
          )}
          {dragDirection === 'right' && currentSectionIndex > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 0.7, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="absolute left-2 top-1/2 -translate-y-1/2"
            >
              <ChevronLeft className="w-10 h-10 text-primary" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Bottom Navigation - Fixed, safe area aware */}
      <div className="flex-shrink-0 pb-safe">
        <div className="px-4 py-3">
          {/* Dot navigation */}
          <div className="flex justify-center gap-1.5 mb-3">
            {narrative.sections.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSectionIndex(idx)}
                className={cn(
                  "h-2 rounded-full transition-all duration-200",
                  idx === currentSectionIndex
                    ? "w-6 bg-primary"
                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={prevSection}
              disabled={currentSectionIndex === 0}
              className={cn(
                "flex-1 max-w-[140px] py-3 rounded-xl flex items-center justify-center gap-2 transition-all font-medium",
                currentSectionIndex === 0
                  ? "bg-muted/30 text-muted-foreground/40"
                  : "bg-muted text-foreground active:scale-[0.98]"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </button>

            <button
              onClick={() => setShowNotes(!showNotes)}
              className="p-3 rounded-xl bg-muted/30 text-muted-foreground active:bg-muted/50 transition-colors"
            >
              <StickyNote className="w-5 h-5" />
            </button>

            <button
              onClick={nextSection}
              disabled={currentSectionIndex === narrative.sections.length - 1}
              className={cn(
                "flex-1 max-w-[140px] py-3 rounded-xl flex items-center justify-center gap-2 transition-all font-medium",
                currentSectionIndex === narrative.sections.length - 1
                  ? "bg-primary/30 text-primary-foreground/40"
                  : "bg-primary text-primary-foreground active:scale-[0.98]"
              )}
            >
              <span className="text-sm">Next</span>
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
            style={{ maxHeight: "45vh" }}
          >
            <div className="p-4 pb-safe">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-primary" />
                  Speaker Notes
                </h3>
                <button
                  onClick={() => setShowNotes(false)}
                  className="p-1.5 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="text-sm text-muted-foreground italic">
                {currentSection.speakerNotes || "No notes for this section. Tap to add notes in preview mode."}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

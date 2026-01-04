import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { X, ChevronLeft, ChevronRight, StickyNote, RotateCcw, List, PanelLeftOpen, PanelRightOpen, Sparkles } from "lucide-react";
import { useNarrativeStore } from "@/store/narrativeStore";
import { cn } from "@/lib/utils";
import { getIcon } from "@/lib/icons";
import { useBrandLogo } from "@/hooks/useBrandLogo";
import { useHaptics } from "@/hooks/useHaptics";
import { getTemplateConfig, getMobileConfig } from "@/lib/animationTemplates";
import conclusivIcon from "@/assets/conclusiv-icon.png";

interface MobilePresentScreenProps {
  onExit: () => void;
  onStartOver?: () => void;
}

// Innovative mobile-specific transitions
const mobileTransitionVariants = {
  // Card stack effect - cards fly in from bottom
  cardStack: {
    initial: { opacity: 0, y: 100, scale: 0.85, rotateX: -15 },
    animate: { opacity: 1, y: 0, scale: 1, rotateX: 0 },
    exit: { opacity: 0, y: -50, scale: 0.9, rotateX: 10 },
    transition: { type: "spring", stiffness: 400, damping: 35 },
  },
  // Parallax slide - content slides with depth layers
  parallaxSlide: {
    initial: (direction: number) => ({ 
      opacity: 0, 
      x: direction * 150,
      scale: 0.92,
    }),
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: (direction: number) => ({ 
      opacity: 0, 
      x: direction * -100,
      scale: 0.95,
    }),
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
  // Morph reveal - content morphs in with blur
  morphReveal: {
    initial: { opacity: 0, scale: 1.1, filter: "blur(20px)" },
    animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
    exit: { opacity: 0, scale: 0.95, filter: "blur(10px)" },
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
  // Flip card - 3D flip effect
  flipCard: {
    initial: { opacity: 0, rotateY: 90, scale: 0.8 },
    animate: { opacity: 1, rotateY: 0, scale: 1 },
    exit: { opacity: 0, rotateY: -90, scale: 0.8 },
    transition: { type: "spring", stiffness: 200, damping: 25 },
  },
  // Elastic bounce - bouncy entrance
  elasticBounce: {
    initial: { opacity: 0, y: 80, scale: 0.7 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -40, scale: 0.9 },
    transition: { type: "spring", stiffness: 500, damping: 25 },
  },
};

// Get animation variant based on template and section index
const getTransitionVariant = (templateName: string, sectionIndex: number) => {
  const variants = Object.keys(mobileTransitionVariants);
  
  // Map templates to preferred variants
  const templateMap: Record<string, string> = {
    ZoomReveal: "morphReveal",
    LinearStoryboard: "parallaxSlide",
    FlyoverMap: "cardStack",
    ContrastSplit: "flipCard",
    PriorityLadder: "elasticBounce",
  };
  
  const preferred = templateMap[templateName];
  if (preferred) return mobileTransitionVariants[preferred as keyof typeof mobileTransitionVariants];
  
  // Fallback to cycling through variants
  const variantKey = variants[sectionIndex % variants.length];
  return mobileTransitionVariants[variantKey as keyof typeof mobileTransitionVariants];
};

export const MobilePresentScreen = ({ onExit, onStartOver }: MobilePresentScreenProps) => {
  const {
    narrative,
    currentSectionIndex,
    nextSection,
    prevSection,
    setCurrentSectionIndex,
    reset,
    selectedTemplate,
    presentationStyle,
  } = useNarrativeStore();

  const { logoUrl, showLogo } = useBrandLogo();
  const haptics = useHaptics();
  const [showNotes, setShowNotes] = useState(false);
  const [showExitMenu, setShowExitMenu] = useState(false);
  const [showNarrativePanel, setShowNarrativePanel] = useState(false);
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [direction, setDirection] = useState(0);
  
  // Motion values for tilt/parallax effect
  const dragX = useMotionValue(0);
  const tiltRotation = useTransform(dragX, [-150, 0, 150], [-8, 0, 8]);
  const parallaxOffset = useTransform(dragX, [-150, 0, 150], [20, 0, -20]);
  const scaleOnDrag = useTransform(dragX, [-150, 0, 150], [0.95, 1, 0.95]);
  
  // Template-specific config
  const mobileConfig = useMemo(() => getMobileConfig(selectedTemplate), [selectedTemplate]);
  const transitionVariant = useMemo(() => 
    getTransitionVariant(selectedTemplate, currentSectionIndex),
    [selectedTemplate, currentSectionIndex]
  );

  const handleStartOver = () => {
    haptics.heavy();
    reset();
    if (onStartOver) {
      onStartOver();
    } else {
      onExit();
    }
  };

  // Haptic navigation with direction tracking
  const handleNextWithHaptics = useCallback(() => {
    if (currentSectionIndex < (narrative?.sections.length ?? 0) - 1) {
      haptics.light();
      setDirection(1);
      nextSection();
    }
  }, [currentSectionIndex, narrative?.sections.length, haptics, nextSection]);

  const handlePrevWithHaptics = useCallback(() => {
    if (currentSectionIndex > 0) {
      haptics.light();
      setDirection(-1);
      prevSection();
    }
  }, [currentSectionIndex, haptics, prevSection]);

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
        setDirection(1);
        nextSection();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setDirection(-1);
        prevSection();
      } else if (e.key === "Escape") {
        onExit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSection, prevSection, onExit]);

  // Enhanced swipe handling with physics-based momentum
  const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    const velocity = info.velocity.x;
    
    // Use velocity for momentum-based navigation
    const shouldNavigate = Math.abs(velocity) > 500 || Math.abs(info.offset.x) > threshold;
    
    if (shouldNavigate) {
      if ((info.offset.x < 0 || velocity < -500) && currentSectionIndex < (narrative?.sections.length ?? 0) - 1) {
        haptics.medium();
        setDirection(1);
        nextSection();
      } else if ((info.offset.x > 0 || velocity > 500) && currentSectionIndex > 0) {
        haptics.medium();
        setDirection(-1);
        prevSection();
      }
    }
    
    dragX.set(0);
  }, [currentSectionIndex, narrative?.sections.length, nextSection, prevSection, haptics, dragX]);

  const handleDrag = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    dragX.set(info.offset.x);
  }, [dragX]);

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
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-background to-background/95 flex flex-col touch-none overflow-hidden">
      {/* Ambient background particles - template aware */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(mobileConfig.particleCount ?? 8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/30"
            style={{
              left: `${10 + (i * 17) % 80}%`,
              top: `${15 + (i * 23) % 70}%`,
            }}
            animate={{
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      {/* Header - Minimal, safe area aware */}
      <div className="flex-shrink-0 pt-safe bg-background/90 backdrop-blur-sm z-20">
        <div className="flex items-center justify-between px-4 py-2.5">
          {/* Brand/Logo */}
          <div className="flex items-center gap-2 min-w-0">
            {showLogo && logoUrl ? (
              <img src={logoUrl} alt="" className="h-5 w-auto object-contain max-w-[100px]" />
            ) : (
              <img src={conclusivIcon} alt="" className="h-4 w-4 object-contain opacity-50" />
            )}
          </div>

          {/* Section counter with animated badge */}
          <motion.div 
            key={currentSectionIndex}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-xs text-muted-foreground font-medium px-2.5 py-1 bg-muted/30 rounded-full"
          >
            {currentSectionIndex + 1} / {narrative.sections.length}
          </motion.div>

          {/* Exit button */}
          <button
            onClick={() => setShowExitMenu(true)}
            className="p-1.5 -mr-1 rounded-full hover:bg-muted/50 transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Progress bar with glow effect */}
        <div className="h-1 bg-muted/20 mx-4 rounded-full overflow-hidden mb-2 relative">
          <motion.div
            className="h-full bg-primary rounded-full relative"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Glow pulse at the end */}
            <motion.div
              className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary"
              animate={{
                opacity: [0.5, 1, 0.5],
                scale: [1, 1.5, 1],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ filter: "blur(4px)" }}
            />
          </motion.div>
        </div>
      </div>

      {/* Edge Navigation Tabs with preview peek */}
      <motion.button
        onClick={() => {
          haptics.light();
          setShowNarrativePanel(true);
        }}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-8 h-16 bg-card/90 backdrop-blur-sm border border-border/30 rounded-r-xl shadow-lg"
        initial={{ x: -32, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.8, type: "spring", stiffness: 300, damping: 25 }}
        whileTap={{ scale: 0.95, x: 4 }}
        whileHover={{ x: 4 }}
        aria-label="View all sections"
      >
        <PanelLeftOpen className="w-4 h-4 text-primary" />
      </motion.button>
      
      <motion.button
        onClick={() => {
          haptics.light();
          setShowNotesPanel(true);
        }}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-8 h-16 bg-card/90 backdrop-blur-sm border border-border/30 rounded-l-xl shadow-lg"
        initial={{ x: 32, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.8, type: "spring", stiffness: 300, damping: 25 }}
        whileTap={{ scale: 0.95, x: -4 }}
        whileHover={{ x: -4 }}
        aria-label="View speaker notes"
      >
        <PanelRightOpen className="w-4 h-4 text-primary" />
      </motion.button>

      {/* Main Content - Swipeable with parallax/tilt effects */}
      <motion.div
        className="flex-1 min-h-0 relative flex items-center justify-center px-6 py-4"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{
          perspective: 1000,
        }}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentSectionIndex}
            custom={direction}
            initial={transitionVariant.initial}
            animate={transitionVariant.animate}
            exit={transitionVariant.exit}
            transition={transitionVariant.transition}
            style={{
              rotateY: tiltRotation,
              x: parallaxOffset,
              scale: scaleOnDrag,
              transformStyle: "preserve-3d",
            }}
            className="w-full max-w-sm text-center"
          >
            {/* Icon with magic glow effect */}
            <motion.div
              className="relative w-16 h-16 mx-auto mb-5"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 25 }}
            >
              {/* Glow rings */}
              <motion.div
                className="absolute inset-0 rounded-xl bg-primary/20"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0, 0.3],
                }}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-0 rounded-xl bg-primary/10"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.2, 0, 0.2],
                }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 0.3 }}
              />
              {/* Icon container */}
              <div className="relative w-full h-full rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Icon className="w-8 h-8 text-primary" />
              </div>
            </motion.div>

            {/* Title with staggered letter animation on first render */}
            <motion.h1
              className="text-2xl font-bold mb-4 text-foreground px-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 25 }}
              style={presentationStyle?.primaryFont ? { fontFamily: presentationStyle.primaryFont } : undefined}
            >
              {currentSection.title}
            </motion.h1>

            {/* Content with reveal animation */}
            {currentSection.content && (
              <motion.p
                className="text-base text-muted-foreground leading-relaxed"
                initial={{ y: 20, opacity: 0, filter: "blur(4px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                {currentSection.content}
              </motion.p>
            )}

            {/* Items with staggered entrance */}
            {currentSection.items && currentSection.items.length > 0 && (
              <motion.ul
                className="mt-5 text-left space-y-2.5 mx-auto max-w-xs"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { 
                    opacity: 1,
                    transition: { staggerChildren: 0.08, delayChildren: 0.25 }
                  },
                }}
              >
                {currentSection.items.slice(0, 3).map((item, idx) => (
                  <motion.li 
                    key={idx} 
                    className="flex items-start gap-2.5 text-sm text-muted-foreground"
                    variants={{
                      hidden: { opacity: 0, x: -20, scale: 0.95 },
                      visible: { opacity: 1, x: 0, scale: 1 },
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  >
                    <motion.span 
                      className="w-1.5 h-1.5 mt-2 rounded-full bg-primary shrink-0"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: idx * 0.2 }}
                    />
                    <span className="line-clamp-2">{item}</span>
                  </motion.li>
                ))}
                {currentSection.items.length > 3 && (
                  <motion.li 
                    className="text-xs text-muted-foreground/60 pl-4 flex items-center gap-1"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: { opacity: 1 },
                    }}
                  >
                    <Sparkles className="w-3 h-3" />
                    +{currentSection.items.length - 3} more
                  </motion.li>
                )}
              </motion.ul>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Edge peek preview - shows next/prev section hint on drag */}
        <AnimatePresence>
          {dragX.get() < -30 && currentSectionIndex < narrative.sections.length - 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 0.6, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col items-center"
            >
              <ChevronRight className="w-8 h-8 text-primary" />
              <span className="text-[10px] text-muted-foreground mt-1 max-w-[60px] text-center truncate">
                {narrative.sections[currentSectionIndex + 1]?.title}
              </span>
            </motion.div>
          )}
          {dragX.get() > 30 && currentSectionIndex > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 0.6, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col items-center"
            >
              <ChevronLeft className="w-8 h-8 text-primary" />
              <span className="text-[10px] text-muted-foreground mt-1 max-w-[60px] text-center truncate">
                {narrative.sections[currentSectionIndex - 1]?.title}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Bottom Navigation - Floating pill design */}
      <div className="flex-shrink-0 pb-safe">
        <div className="px-4 py-3">
          {/* Dot navigation with active indicator animation */}
          <div className="flex justify-center gap-1.5 mb-3">
            {narrative.sections.map((_, idx) => (
              <motion.button
                key={idx}
                onClick={() => {
                  haptics.selection();
                  setDirection(idx > currentSectionIndex ? 1 : -1);
                  setCurrentSectionIndex(idx);
                }}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  idx === currentSectionIndex
                    ? "bg-primary"
                    : "bg-muted-foreground/30"
                )}
                animate={{
                  width: idx === currentSectionIndex ? 24 : 8,
                }}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </div>

          {/* Navigation buttons with micro-interactions */}
          <div className="flex items-center justify-center gap-3">
            <motion.button
              onClick={handlePrevWithHaptics}
              disabled={currentSectionIndex === 0}
              className={cn(
                "flex-1 max-w-[140px] py-3 rounded-xl flex items-center justify-center gap-2 transition-all font-medium",
                currentSectionIndex === 0
                  ? "bg-muted/30 text-muted-foreground/40"
                  : "bg-muted text-foreground"
              )}
              whileTap={currentSectionIndex > 0 ? { scale: 0.95, x: -4 } : {}}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </motion.button>

            <motion.button
              onClick={() => {
                haptics.selection();
                setShowNotes(!showNotes);
              }}
              className="p-3 rounded-xl bg-muted/30 text-muted-foreground transition-colors relative overflow-hidden"
              whileTap={{ scale: 0.92 }}
            >
              <StickyNote className="w-5 h-5 relative z-10" />
              {/* Ripple effect */}
              <motion.div
                className="absolute inset-0 bg-primary/20 rounded-xl"
                initial={{ scale: 0, opacity: 0 }}
                whileTap={{ scale: 2, opacity: [0.5, 0] }}
                transition={{ duration: 0.4 }}
              />
            </motion.button>

            <motion.button
              onClick={handleNextWithHaptics}
              disabled={currentSectionIndex === narrative.sections.length - 1}
              className={cn(
                "flex-1 max-w-[140px] py-3 rounded-xl flex items-center justify-center gap-2 transition-all font-medium relative overflow-hidden",
                currentSectionIndex === narrative.sections.length - 1
                  ? "bg-primary/30 text-primary-foreground/40"
                  : "bg-primary text-primary-foreground"
              )}
              whileTap={currentSectionIndex < narrative.sections.length - 1 ? { scale: 0.95, x: 4 } : {}}
            >
              <span className="text-sm">Next</span>
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Left Slide-in Panel - Narrative Sections */}
      <AnimatePresence>
        {showNarrativePanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                haptics.selection();
                setShowNarrativePanel(false);
              }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[85vw] max-w-[320px] bg-card border-r border-border z-50 overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Panel Header */}
              <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card pt-safe">
                <div className="flex items-center gap-2">
                  <List className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-base">All Sections</h3>
                </div>
                <button 
                  onClick={() => {
                    haptics.selection();
                    setShowNarrativePanel(false);
                  }}
                  className="p-1.5 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              
              {/* Section List - Scrollable */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1 pb-safe">
                {narrative.sections.map((section, idx) => {
                  const SectionIcon = getIcon(section.icon);
                  const isActive = idx === currentSectionIndex;
                  return (
                    <motion.button
                      key={idx}
                      onClick={() => {
                        haptics.medium();
                        setDirection(idx > currentSectionIndex ? 1 : -1);
                        setCurrentSectionIndex(idx);
                        setShowNarrativePanel(false);
                      }}
                      className={cn(
                        "w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all",
                        isActive 
                          ? "bg-primary/10 border border-primary/30" 
                          : "hover:bg-muted/50 active:bg-muted"
                      )}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        isActive ? "bg-primary/20" : "bg-muted"
                      )}>
                        <SectionIcon className={cn(
                          "w-4 h-4",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-medium truncate",
                          isActive ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {section.title}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                          Section {idx + 1}
                        </p>
                      </div>
                      {isActive && (
                        <motion.div 
                          className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2"
                          layoutId="activeIndicator"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Right Slide-in Panel - Speaker Notes */}
      <AnimatePresence>
        {showNotesPanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                haptics.selection();
                setShowNotesPanel(false);
              }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[85vw] max-w-[320px] bg-card border-l border-border z-50 overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Panel Header */}
              <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card pt-safe">
                <div className="flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-base">Speaker Notes</h3>
                </div>
                <button 
                  onClick={() => {
                    haptics.selection();
                    setShowNotesPanel(false);
                  }}
                  className="p-1.5 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              
              {/* Notes Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-4 pb-safe">
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                    Current Section
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {currentSection.title}
                  </p>
                </div>
                
                <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="text-center py-4">
                    <StickyNote className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground/70 italic">
                      No notes for this section
                    </p>
                    <p className="text-xs text-muted-foreground/50 mt-1">
                      Add notes in preview mode
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Notes overlay (legacy - keeping for bottom button) */}
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
                No notes for this section. Add notes in preview mode.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exit menu overlay */}
      <AnimatePresence>
        {showExitMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 bg-background/80 backdrop-blur-sm"
              onClick={() => setShowExitMenu(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute inset-x-0 bottom-0 z-50 bg-card border-t border-border rounded-t-2xl shadow-2xl"
            >
              <div className="p-4 pb-safe space-y-2">
                <div className="flex justify-center mb-2">
                  <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
                </div>
                
                <motion.button
                  onClick={onExit}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-muted/50 text-foreground font-medium transition-colors active:bg-muted"
                  whileTap={{ scale: 0.98 }}
                >
                  <X className="w-5 h-5" />
                  Exit to Preview
                </motion.button>
                
                <motion.button
                  onClick={handleStartOver}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-primary/10 text-primary font-medium transition-colors active:bg-primary/20"
                  whileTap={{ scale: 0.98 }}
                >
                  <RotateCcw className="w-5 h-5" />
                  Start Over
                </motion.button>
                
                <button
                  onClick={() => setShowExitMenu(false)}
                  className="w-full px-4 py-3 text-center text-sm text-muted-foreground"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

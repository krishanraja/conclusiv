import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Share2, 
  Download,
  Wand2,
  Film,
  Sparkles,
  Sliders,
  ArrowLeft,
  X,
  Edit3,
  PanelLeftOpen,
  PanelRightOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickAdjustments } from "./QuickAdjustments";
import { useNarrativeStore } from "@/store/narrativeStore";
import { cn } from "@/lib/utils";
import { getIcon } from "@/lib/icons";
import { useHaptics } from "@/hooks/useHaptics";
import { useBrandFonts } from "@/hooks/useBrandFonts";
import { NarrativeRemix } from "@/components/power-user/NarrativeRemix";
import { MakingOfView, MakingOfTrigger } from "@/components/power-user/MakingOfView";

interface MobilePreviewLayoutProps {
  onBack: () => void;
  onPresent: () => void;
  onShare: () => void;
  onExport: () => void;
  onGenerateAlternatives?: () => void;
}

export const MobilePreviewLayout = ({
  onBack,
  onPresent,
  onShare,
  onExport,
  onGenerateAlternatives,
}: MobilePreviewLayoutProps) => {
  const { narrative, businessContext, presentationStyle, alternatives, isGeneratingAlternatives } = useNarrativeStore();
  const haptics = useHaptics();
  useBrandFonts(); // Ensure brand fonts are loaded for presentation
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [makingOfOpen, setMakingOfOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null);

  // Swipe to navigate between sections with haptic feedback
  const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    
    if (!narrative) return;
    
    // Navigate sections with swipe
    if (info.offset.x < -threshold && currentIndex < narrative.sections.length - 1) {
      haptics.light();
      setCurrentIndex(prev => prev + 1);
    } else if (info.offset.x > threshold && currentIndex > 0) {
      haptics.light();
      setCurrentIndex(prev => prev - 1);
    }
    setDragDirection(null);
  }, [currentIndex, narrative, haptics]);

  const handleDrag = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -30) {
      setDragDirection('left');
    } else if (info.offset.x > 30) {
      setDragDirection('right');
    } else {
      setDragDirection(null);
    }
  }, []);

  if (!narrative || narrative.sections.length === 0) return null;

  const currentSection = narrative.sections[currentIndex];
  const Icon = getIcon(currentSection?.icon || 'Lightbulb');
  const progress = ((currentIndex + 1) / narrative.sections.length) * 100;

  return (
    <div className="fixed inset-0 flex flex-col bg-background overflow-hidden">
      {/* Header - Fixed height */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b border-border/30 bg-background z-20">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-8 px-2">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        
        <div className="flex items-center gap-1">
          {businessContext?.companyName && (
            <span className="text-xs text-muted-foreground truncate max-w-[100px]">
              {businessContext.companyName}
            </span>
          )}
          <span className="text-xs text-primary ml-1">
            {currentIndex + 1}/{narrative.sections.length}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLeftPanelOpen(true)}
            className="h-8 w-8 p-0"
          >
            <BarChart3 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRightPanelOpen(true)}
            className="h-8 w-8 p-0"
          >
            <Sliders className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex-shrink-0 h-1 bg-muted/30">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>

      {/* Edge Arrow Buttons - Always visible for opening sidebars */}
      <motion.button
        onClick={() => {
          haptics.light();
          setLeftPanelOpen(true);
        }}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-8 h-16 bg-card/80 backdrop-blur-sm border border-border/30 rounded-r-xl shadow-lg"
        initial={{ x: -32, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 25 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open analysis panel"
      >
        <PanelLeftOpen className="w-4 h-4 text-primary" />
      </motion.button>
      
      <motion.button
        onClick={() => {
          haptics.light();
          setRightPanelOpen(true);
        }}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-8 h-16 bg-card/80 backdrop-blur-sm border border-border/30 rounded-l-xl shadow-lg"
        initial={{ x: 32, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 25 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open adjustments panel"
      >
        <PanelRightOpen className="w-4 h-4 text-primary" />
      </motion.button>

      {/* Main Preview Area - Full swipe */}
      <motion.div 
        className="flex-1 relative overflow-hidden touch-pan-y"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute inset-0 flex flex-col items-center justify-center p-6"
          >
            {/* Section Icon */}
            <motion.div
              className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Icon className="w-7 h-7 text-primary" />
            </motion.div>

            {/* Section Title */}
            <motion.h2
              className="text-xl font-bold text-center mb-3 text-foreground"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              {currentSection.title}
            </motion.h2>

            {/* Section Content */}
            {currentSection.content && (
              <motion.p
                className="text-sm text-muted-foreground text-center leading-relaxed max-w-sm px-2"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {currentSection.content}
              </motion.p>
            )}

            {/* Section Items - scrollable for long content */}
            {currentSection.items && currentSection.items.length > 0 && (
              <motion.div
                className="mt-4 w-full max-w-sm max-h-[35vh] overflow-y-auto px-2"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                <ul className="space-y-2">
                  {currentSection.items.slice(0, 5).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-primary shrink-0" />
                      <span className="line-clamp-3">{item}</span>
                    </li>
                  ))}
                  {currentSection.items.length > 5 && (
                    <li className="text-xs text-muted-foreground/60 pl-3">
                      +{currentSection.items.length - 5} more items
                    </li>
                  )}
                </ul>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Swipe Direction Indicators */}
        <AnimatePresence>
          {dragDirection === 'left' && currentIndex < narrative.sections.length - 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <ChevronRight className="w-8 h-8 text-primary" />
            </motion.div>
          )}
          {dragDirection === 'right' && currentIndex > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="absolute left-2 top-1/2 -translate-y-1/2"
            >
              <ChevronLeft className="w-8 h-8 text-primary" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Dot Navigation */}
      <div className="flex-shrink-0 flex justify-center gap-1.5 py-2">
        {narrative.sections.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-200",
              idx === currentIndex
                ? "w-5 bg-primary"
                : "bg-muted-foreground/30"
            )}
          />
        ))}
      </div>

      {/* Making Of View */}
      <MakingOfView isOpen={makingOfOpen} onClose={() => setMakingOfOpen(false)} />

      {/* Left Slide-in Panel - Remix, Making Of, Re-Narrate */}
      <AnimatePresence>
        {leftPanelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                haptics.selection();
                setLeftPanelOpen(false);
              }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[90vw] max-w-[340px] bg-card border-r border-border z-40 overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Panel Header */}
              <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card">
                <h3 className="font-semibold text-base">Narrative Tools</h3>
                <button 
                  onClick={() => {
                    haptics.selection();
                    setLeftPanelOpen(false);
                  }}
                  className="p-1.5 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              
              {/* Panel Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-safe">
                {/* Remix */}
                <div className="p-3 rounded-lg border border-border/50 bg-background/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Wand2 className="w-4 h-4 text-primary" />
                    <h4 className="font-medium text-sm">Remix</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Transform your narrative style
                  </p>
                  <NarrativeRemix onRemixComplete={() => {
                    haptics.success();
                    setLeftPanelOpen(false);
                  }} />
                </div>

                {/* Making Of */}
                <button
                  onClick={() => {
                    haptics.selection();
                    setMakingOfOpen(true);
                    setLeftPanelOpen(false);
                  }}
                  className="w-full p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-background transition-colors text-left"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Film className="w-4 h-4 text-primary" />
                    <h4 className="font-medium text-sm">Making Of</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    View narrative score, processing stats, and AI reasoning
                  </p>
                </button>

                {/* Re-Narrate (Alternatives) */}
                <button
                  onClick={() => {
                    haptics.selection();
                    if (onGenerateAlternatives) {
                      onGenerateAlternatives();
                    }
                    setLeftPanelOpen(false);
                  }}
                  disabled={!narrative || isGeneratingAlternatives}
                  className="w-full p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-background transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <h4 className="font-medium text-sm">Re-Narrate</h4>
                    {alternatives.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({alternatives.length})
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isGeneratingAlternatives 
                      ? "Generating alternatives..." 
                      : alternatives.length > 0
                      ? "View different framings of your narrative"
                      : "Generate alternative framings for different goals"}
                  </p>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Right Slide-in Panel - Adjustments */}
      <AnimatePresence>
        {rightPanelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                haptics.selection();
                setRightPanelOpen(false);
              }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[90vw] max-w-[340px] bg-card border-l border-border z-40 overflow-hidden flex flex-col shadow-2xl"
            >
              {/* Panel Header */}
              <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border/50 bg-card">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-base">Quick Adjustments</h3>
                </div>
                <button 
                  onClick={() => {
                    haptics.selection();
                    setRightPanelOpen(false);
                  }}
                  className="p-1.5 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              
              {/* Panel Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-safe">
                <QuickAdjustments />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Action Bar - Fixed height, safe area aware */}
      <div className="flex-shrink-0 flex items-center justify-around px-2 py-2 border-t border-border/30 bg-card z-20 pb-safe">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            haptics.light();
            onExport();
          }}
          className="flex flex-col items-center gap-0.5 h-auto py-1.5 px-3"
        >
          <Download className="w-5 h-5" />
          <span className="text-[10px]">Export</span>
        </Button>
        
        <Button
          variant="shimmer"
          size="lg"
          onClick={() => {
            haptics.medium();
            onPresent();
          }}
          className="px-6 h-10"
        >
          <Play className="w-4 h-4 mr-1.5" />
          Present
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            haptics.light();
            onShare();
          }}
          className="flex flex-col items-center gap-0.5 h-auto py-1.5 px-3"
        >
          <Share2 className="w-5 h-5" />
          <span className="text-[10px]">Share</span>
        </Button>
      </div>
    </div>
  );
};

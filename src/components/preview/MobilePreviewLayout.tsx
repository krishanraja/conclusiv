import { useState, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Share2, 
  Download,
  BarChart3,
  Sliders,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NarrativePreview } from "./NarrativePreview";
import { NarrativeQualityScore } from "@/components/intelligence/NarrativeQualityScore";
import { ExecutiveSummary } from "@/components/intelligence/ExecutiveSummary";
import { ImproveMyScore } from "@/components/intelligence/ImproveMyScore";
import { QuickAdjustments } from "./QuickAdjustments";
import { useNarrativeStore } from "@/store/narrativeStore";
import { cn } from "@/lib/utils";

interface MobilePreviewLayoutProps {
  onBack: () => void;
  onPresent: () => void;
  onShare: () => void;
  onExport: () => void;
}

export const MobilePreviewLayout = ({
  onBack,
  onPresent,
  onShare,
  onExport,
}: MobilePreviewLayoutProps) => {
  const { narrative, businessContext } = useNarrativeStore();
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  // Auto-open Quick Adjustments on mount
  useEffect(() => {
    const timer = setTimeout(() => setRightPanelOpen(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const handlePanEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    
    if (info.offset.x > threshold && !leftPanelOpen && !rightPanelOpen) {
      setLeftPanelOpen(true);
    } else if (info.offset.x < -threshold && !leftPanelOpen && !rightPanelOpen) {
      setRightPanelOpen(true);
    } else if (info.offset.x < -threshold && leftPanelOpen) {
      setLeftPanelOpen(false);
    } else if (info.offset.x > threshold && rightPanelOpen) {
      setRightPanelOpen(false);
    }
  };

  if (!narrative) return null;

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 bg-background/95 backdrop-blur-sm z-20">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-8 px-2">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        
        <div className="flex items-center gap-1">
          {businessContext?.companyName && (
            <span className="text-xs text-muted-foreground truncate max-w-[120px]">
              {businessContext.companyName}
            </span>
          )}
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

      {/* Swipe Hint */}
      <AnimatePresence>
        {!leftPanelOpen && !rightPanelOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-1/2 left-0 right-0 z-10 pointer-events-none flex justify-between px-1"
          >
            <div className="w-1 h-12 bg-primary/20 rounded-r-full" />
            <div className="w-1 h-12 bg-primary/20 rounded-l-full" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Preview Area with Pan Gesture */}
      <motion.div 
        className="flex-1 overflow-hidden relative"
        onPanEnd={handlePanEnd}
        drag={false}
      >
        <div className="h-full overflow-y-auto overflow-x-hidden">
          <NarrativePreview />
        </div>
      </motion.div>

      {/* Left Slide-in Panel - Score & Summary */}
      <AnimatePresence>
        {leftPanelOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLeftPanelOpen(false)}
              className="fixed inset-0 bg-black/50 z-30"
            />
            {/* Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[85vw] max-w-[320px] bg-background border-r border-border z-40 overflow-y-auto"
            >
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Narrative Analysis</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setLeftPanelOpen(false)}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>
                
                <NarrativeQualityScore />
                <ImproveMyScore />
                <ExecutiveSummary />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Right Slide-in Panel - Adjustments */}
      <AnimatePresence>
        {rightPanelOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRightPanelOpen(false)}
              className="fixed inset-0 bg-black/50 z-30"
            />
            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[85vw] max-w-[320px] bg-background border-l border-border z-40 overflow-y-auto"
            >
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Quick Adjustments</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setRightPanelOpen(false)}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                
                <QuickAdjustments />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Action Bar */}
      <div className="flex items-center justify-around px-2 py-3 border-t border-border/30 bg-background/95 backdrop-blur-sm z-20 pb-safe">
        <Button
          variant="ghost"
          size="sm"
          onClick={onExport}
          className="flex flex-col items-center gap-1 h-auto py-2"
        >
          <Download className="w-5 h-5" />
          <span className="text-[10px]">Export</span>
        </Button>
        
        <Button
          variant="shimmer"
          size="lg"
          onClick={onPresent}
          className="px-8"
        >
          <Play className="w-4 h-4 mr-2" />
          Present
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onShare}
          className="flex flex-col items-center gap-1 h-auto py-2"
        >
          <Share2 className="w-5 h-5" />
          <span className="text-[10px]">Share</span>
        </Button>
      </div>
    </div>
  );
};
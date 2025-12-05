import { useEffect, useCallback, useState, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNarrativeStore } from "@/store/narrativeStore";
import { cn } from "@/lib/utils";
import { getIcon } from "@/lib/icons";
import { TransitionType } from "@/lib/types";
import conclusivIcon from "@/assets/conclusiv-icon.png";

// Canvas size for infinite canvas
const CANVAS_SIZE = 6000;
const NODE_SPACING = 1200;

// Generate positions for nodes in a spiral/organic pattern
const generateNodePositions = (count: number) => {
  const positions: Array<{ x: number; y: number; scale: number; rotation: number }> = [];
  const centerX = CANVAS_SIZE / 2;
  const centerY = CANVAS_SIZE / 2;
  
  for (let i = 0; i < count; i++) {
    // Create an interesting spiral/constellation pattern
    const angle = (i * 137.5 * Math.PI) / 180; // Golden angle for natural distribution
    const radius = 400 + i * 180;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    const scale = 1 + (Math.random() * 0.3 - 0.15); // Slight scale variation
    const rotation = Math.sin(i * 0.5) * 8; // Subtle rotation variation
    
    positions.push({ x, y, scale, rotation });
  }
  
  return positions;
};

// Dramatic transition configurations
const getTransitionConfig = (type: TransitionType, fromIdx: number, toIdx: number) => {
  const isForward = toIdx > fromIdx;
  const distance = Math.abs(toIdx - fromIdx);
  
  const configs: Record<TransitionType, { duration: number; ease: number[]; zoomOut: number; rotationDelta: number }> = {
    zoom_in: { duration: 1.2, ease: [0.22, 1, 0.36, 1], zoomOut: 0.3, rotationDelta: 0 },
    zoom_out: { duration: 1.0, ease: [0.33, 1, 0.68, 1], zoomOut: 0.5, rotationDelta: 0 },
    pan: { duration: 0.8, ease: [0.4, 0, 0.2, 1], zoomOut: 0.15, rotationDelta: 0 },
    slide_left: { duration: 0.9, ease: [0.25, 1, 0.5, 1], zoomOut: 0.2, rotationDelta: isForward ? 3 : -3 },
    fade: { duration: 0.7, ease: [0.4, 0, 0.2, 1], zoomOut: 0.1, rotationDelta: 0 },
    card_expand: { duration: 1.0, ease: [0.22, 1, 0.36, 1], zoomOut: 0.35, rotationDelta: 0 },
    pan_to_node: { duration: 1.3, ease: [0.16, 1, 0.3, 1], zoomOut: 0.4, rotationDelta: isForward ? 5 : -5 },
    orbit: { duration: 1.5, ease: [0.22, 1, 0.36, 1], zoomOut: 0.45, rotationDelta: isForward ? 15 : -15 },
    tilt: { duration: 1.1, ease: [0.33, 1, 0.68, 1], zoomOut: 0.25, rotationDelta: isForward ? 8 : -8 },
    split_reveal: { duration: 1.0, ease: [0.4, 0, 0.2, 1], zoomOut: 0.2, rotationDelta: 0 },
    side_flip: { duration: 1.2, ease: [0.22, 1, 0.36, 1], zoomOut: 0.3, rotationDelta: 0 },
    step_up: { duration: 0.9, ease: [0.25, 1, 0.5, 1], zoomOut: 0.2, rotationDelta: 0 },
    highlight: { duration: 0.8, ease: [0.4, 0, 0.2, 1], zoomOut: 0.15, rotationDelta: 0 },
  };
  
  // Increase duration for larger jumps
  const config = configs[type] || configs.fade;
  return {
    ...config,
    duration: config.duration + distance * 0.15,
    zoomOut: Math.min(0.6, config.zoomOut + distance * 0.05),
  };
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

  const [showMinimap, setShowMinimap] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [prevIndex, setPrevIndex] = useState(0);

  // Generate node positions once
  const nodePositions = useMemo(() => {
    if (!narrative) return [];
    return generateNodePositions(narrative.sections.length);
  }, [narrative?.sections.length]);

  // Spring-based camera position for smooth movement
  const cameraX = useSpring(CANVAS_SIZE / 2, { stiffness: 80, damping: 25 });
  const cameraY = useSpring(CANVAS_SIZE / 2, { stiffness: 80, damping: 25 });
  const cameraZoom = useSpring(1, { stiffness: 60, damping: 20 });
  const cameraRotation = useSpring(0, { stiffness: 50, damping: 18 });

  // Motion blur based on camera velocity
  const blurAmount = useMotionValue(0);

  // Update camera when section changes
  useEffect(() => {
    if (!narrative || nodePositions.length === 0) return;
    
    const targetPos = nodePositions[currentSectionIndex];
    if (!targetPos) return;

    const currentTransition = narrative.transitions[currentSectionIndex];
    const config = getTransitionConfig(
      currentTransition?.type || "fade",
      prevIndex,
      currentSectionIndex
    );

    setIsTransitioning(true);
    
    // Calculate travel distance for motion blur
    const dx = targetPos.x - cameraX.get();
    const dy = targetPos.y - cameraY.get();
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Apply motion blur during transition
    blurAmount.set(Math.min(8, distance / 200));
    
    // Dramatic zoom out during travel, then zoom back in
    const midpointDelay = config.duration * 0.4;
    
    // First: zoom out and start rotating
    cameraZoom.set(1 - config.zoomOut);
    cameraRotation.set(cameraRotation.get() + config.rotationDelta);
    
    // Move to target
    cameraX.set(targetPos.x);
    cameraY.set(targetPos.y);
    
    // Then: zoom back in after reaching midpoint
    setTimeout(() => {
      cameraZoom.set(1);
      blurAmount.set(0);
    }, midpointDelay * 1000);

    // End transition
    setTimeout(() => {
      setIsTransitioning(false);
      setPrevIndex(currentSectionIndex);
    }, config.duration * 1000);

  }, [currentSectionIndex, narrative, nodePositions]);

  // Initialize camera position on mount
  useEffect(() => {
    if (nodePositions.length > 0) {
      const pos = nodePositions[0];
      cameraX.set(pos.x);
      cameraY.set(pos.y);
    }
  }, [nodePositions]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isTransitioning) return;
    
    if (e.key === "ArrowRight" || e.key === " ") {
      nextSection();
    } else if (e.key === "ArrowLeft") {
      prevSection();
    } else if (e.key === "Escape") {
      setCurrentStep("preview");
    } else if (e.key === "m") {
      setShowMinimap(prev => !prev);
    }
  }, [nextSection, prevSection, setCurrentStep, isTransitioning]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!narrative) return null;

  const currentSection = narrative.sections[currentSectionIndex];

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-hidden">
      {/* Infinite Canvas Container */}
      <motion.div
        className="absolute inset-0"
        style={{
          perspective: 2000,
          perspectiveOrigin: "50% 50%",
        }}
      >
        {/* Camera/Viewport */}
        <motion.div
          className="absolute w-full h-full"
          style={{
            x: useTransform(cameraX, (x) => `calc(50vw - ${x}px)`),
            y: useTransform(cameraY, (y) => `calc(50vh - ${y}px)`),
            scale: cameraZoom,
            rotate: cameraRotation,
            filter: useTransform(blurAmount, (b) => `blur(${b}px)`),
            transformStyle: "preserve-3d",
          }}
        >
          {/* Connecting lines between nodes */}
          <svg 
            className="absolute top-0 left-0 pointer-events-none"
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            style={{ opacity: 0.15 }}
          >
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            {nodePositions.map((pos, i) => {
              if (i === 0) return null;
              const prevPos = nodePositions[i - 1];
              return (
                <motion.line
                  key={`line-${i}`}
                  x1={prevPos.x}
                  y1={prevPos.y}
                  x2={pos.x}
                  y2={pos.y}
                  stroke="url(#lineGradient)"
                  strokeWidth={2}
                  strokeDasharray="8 4"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, delay: i * 0.1 }}
                />
              );
            })}
          </svg>

          {/* Section Nodes */}
          {narrative.sections.map((section, i) => {
            const pos = nodePositions[i];
            if (!pos) return null;
            
            const Icon = getIcon(section.icon);
            const isActive = i === currentSectionIndex;
            const isPast = i < currentSectionIndex;
            const distance = Math.abs(i - currentSectionIndex);
            
            // Depth of field - blur unfocused nodes
            const nodeBlur = isActive ? 0 : Math.min(6, distance * 1.5);
            const nodeOpacity = isActive ? 1 : Math.max(0.3, 1 - distance * 0.15);
            
            return (
              <motion.div
                key={section.id}
                className="absolute"
                style={{
                  left: pos.x,
                  top: pos.y,
                  x: "-50%",
                  y: "-50%",
                  transformStyle: "preserve-3d",
                }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ 
                  opacity: nodeOpacity,
                  scale: isActive ? 1 : 0.85,
                  filter: `blur(${nodeBlur}px)`,
                  rotateX: isActive ? 0 : (i % 2 === 0 ? 5 : -5),
                  rotateY: isActive ? 0 : (i % 3 === 0 ? 8 : -8),
                }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <div 
                  className={cn(
                    "w-[500px] rounded-2xl border bg-card/95 backdrop-blur-sm p-8 text-center shadow-2xl transition-all duration-500",
                    isActive 
                      ? "border-primary/50 shadow-primary/20" 
                      : isPast 
                        ? "border-border/30 shadow-none" 
                        : "border-border/20 shadow-none"
                  )}
                  style={{
                    transform: `rotateZ(${pos.rotation}deg)`,
                  }}
                >
                  {/* Glow effect for active node */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 -z-10 rounded-2xl bg-primary/10 blur-3xl"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1.2 }}
                      transition={{ duration: 0.5 }}
                    />
                  )}

                  {/* Icon */}
                  <div className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-5 transition-all duration-300",
                    isActive 
                      ? "bg-gradient-to-br from-primary/30 to-accent/30 border border-primary/40" 
                      : "bg-muted/50 border border-border/30"
                  )}>
                    <Icon className={cn(
                      "w-7 h-7 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>

                  {/* Title */}
                  <h2 className={cn(
                    "text-2xl font-semibold mb-3 tracking-tight transition-colors",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {section.title}
                  </h2>

                  {/* Content */}
                  {section.content && isActive && (
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-base text-muted-foreground max-w-md mx-auto mb-4"
                    >
                      {section.content}
                    </motion.p>
                  )}

                  {/* Items - only show for active node */}
                  {section.items && section.items.length > 0 && isActive && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="grid grid-cols-1 gap-2 mt-4 text-left"
                    >
                      {section.items.slice(0, 4).map((item, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + idx * 0.08 }}
                          className="p-2.5 rounded-lg bg-background/60 border border-border/20"
                        >
                          <div className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                            <p className="text-sm text-foreground">{item}</p>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  {/* Node number indicator */}
                  <div className={cn(
                    "absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {i + 1}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>

      {/* Vignette effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 50%, hsl(var(--background)) 100%)",
          opacity: isTransitioning ? 0.7 : 0.4,
          transition: "opacity 0.5s ease",
        }}
      />

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-14 flex items-center justify-between px-6 z-20">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentStep("preview")}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4 mr-1" />
          Exit
        </Button>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMinimap(prev => !prev)}
            className={cn(
              "text-muted-foreground",
              showMinimap && "text-primary"
            )}
          >
            <Map className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground tabular-nums">
            {currentSectionIndex + 1} / {narrative.sections.length}
          </span>
        </div>
      </div>

      {/* Mini-map */}
      <AnimatePresence>
        {showMinimap && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 20 }}
            className="absolute top-20 right-6 z-20"
          >
            <div className="w-48 h-48 rounded-xl border border-border/50 bg-card/80 backdrop-blur-md overflow-hidden">
              <div 
                className="relative w-full h-full"
                style={{ transform: `scale(${48 / CANVAS_SIZE * 100})`, transformOrigin: "top left" }}
              >
                {/* Mini nodes */}
                {nodePositions.map((pos, i) => (
                  <button
                    key={i}
                    onClick={() => !isTransitioning && setCurrentSectionIndex(i)}
                    className={cn(
                      "absolute w-6 h-6 rounded-full transition-all",
                      i === currentSectionIndex 
                        ? "bg-primary scale-150" 
                        : i < currentSectionIndex
                          ? "bg-primary/50"
                          : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    )}
                    style={{
                      left: pos.x - 3,
                      top: pos.y - 3,
                    }}
                  />
                ))}
                {/* Mini connecting lines */}
                <svg className="absolute inset-0 pointer-events-none" width={CANVAS_SIZE} height={CANVAS_SIZE}>
                  {nodePositions.map((pos, i) => {
                    if (i === 0) return null;
                    const prevPos = nodePositions[i - 1];
                    return (
                      <line
                        key={i}
                        x1={prevPos.x}
                        y1={prevPos.y}
                        x2={pos.x}
                        y2={pos.y}
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        opacity={0.3}
                      />
                    );
                  })}
                </svg>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
        {narrative.sections.map((_, i) => (
          <button
            key={i}
            onClick={() => !isTransitioning && setCurrentSectionIndex(i)}
            disabled={isTransitioning}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === currentSectionIndex 
                ? "w-8 bg-primary" 
                : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
          />
        ))}
      </div>

      {/* Navigation arrows */}
      <div className="absolute bottom-8 left-6 z-20">
        <Button
          variant="ghost"
          size="icon"
          onClick={prevSection}
          disabled={currentSectionIndex === 0 || isTransitioning}
          className="text-muted-foreground"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
      </div>

      <div className="absolute bottom-8 right-6 z-20">
        <Button
          variant="ghost"
          size="icon"
          onClick={nextSection}
          disabled={currentSectionIndex === narrative.sections.length - 1 || isTransitioning}
          className="text-muted-foreground"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Transition indicator */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20"
          >
            <div className="px-4 py-2 rounded-full bg-card/80 backdrop-blur-sm border border-border/50">
              <span className="text-xs text-muted-foreground">Flying to section {currentSectionIndex + 1}...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Watermark */}
      <div className="absolute bottom-4 right-4 opacity-20 hover:opacity-40 transition-opacity z-20">
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

import { useEffect, useCallback, useState, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNarrativeStore } from "@/store/narrativeStore";
import { cn } from "@/lib/utils";
import { getIcon } from "@/lib/icons";
import { TransitionType } from "@/lib/types";
import { useSubscription } from "@/hooks/useSubscription";
import { Watermark } from "@/components/subscription/Watermark";
import { UpgradePrompt } from "@/components/subscription/UpgradePrompt";
import { useIsMobile } from "@/hooks/use-mobile";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { TitleSequence } from "@/components/cinematic/TitleSequence";
import { useBrandLogo } from "@/hooks/useBrandLogo";
import conclusivLogo from "@/assets/conclusiv-logo.png";

// Canvas size for infinite canvas
const CANVAS_SIZE = 6000;

// Generate floating particles for the background - reduced count on mobile
const generateParticles = (count: number) => {
  const particles: Array<{
    x: number;
    y: number;
    size: number;
    opacity: number;
    duration: number;
    delay: number;
    drift: number;
  }> = [];
  
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * CANVAS_SIZE,
      y: Math.random() * CANVAS_SIZE,
      size: 2 + Math.random() * 6,
      opacity: 0.1 + Math.random() * 0.3,
      duration: 15 + Math.random() * 25,
      delay: Math.random() * -20,
      drift: 50 + Math.random() * 150,
    });
  }
  
  return particles;
};

// Generate positions for nodes in a spiral/organic pattern
const generateNodePositions = (count: number) => {
  const positions: Array<{ x: number; y: number; scale: number; rotation: number }> = [];
  const centerX = CANVAS_SIZE / 2;
  const centerY = CANVAS_SIZE / 2;
  
  for (let i = 0; i < count; i++) {
    const angle = (i * 137.5 * Math.PI) / 180;
    const radius = 500 + i * 200;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    const scale = 1 + (Math.random() * 0.2 - 0.1);
    const rotation = Math.sin(i * 0.5) * 5;
    
    positions.push({ x, y, scale, rotation });
  }
  
  return positions;
};

// Refined dramatic transition configurations - faster on mobile
const getTransitionConfig = (type: TransitionType, fromIdx: number, toIdx: number, isMobile: boolean) => {
  const isForward = toIdx > fromIdx;
  const distance = Math.abs(toIdx - fromIdx);
  
  // Mobile gets 40% faster animations
  const mobileMultiplier = isMobile ? 0.6 : 1;
  
  const configs: Record<TransitionType, { duration: number; ease: number[]; zoomOut: number; rotationDelta: number }> = {
    zoom_in: { duration: 1.4, ease: [0.16, 1, 0.3, 1], zoomOut: 0.15, rotationDelta: 0 },
    zoom_out: { duration: 1.2, ease: [0.22, 1, 0.36, 1], zoomOut: 0.2, rotationDelta: 0 },
    pan: { duration: 1.0, ease: [0.33, 1, 0.68, 1], zoomOut: 0.08, rotationDelta: 0 },
    slide_left: { duration: 1.2, ease: [0.16, 1, 0.3, 1], zoomOut: 0.12, rotationDelta: 0 },
    fade: { duration: 0.8, ease: [0.4, 0, 0.2, 1], zoomOut: 0.05, rotationDelta: 0 },
    card_expand: { duration: 1.4, ease: [0.16, 1, 0.3, 1], zoomOut: 0.18, rotationDelta: 0 },
    pan_to_node: { duration: 1.4, ease: [0.12, 0.8, 0.25, 1], zoomOut: 0.15, rotationDelta: 0 },
    orbit: { duration: 1.6, ease: [0.16, 1, 0.3, 1], zoomOut: 0.2, rotationDelta: 0 },
    tilt: { duration: 1.2, ease: [0.22, 1, 0.36, 1], zoomOut: 0.12, rotationDelta: 0 },
    split_reveal: { duration: 1.2, ease: [0.33, 1, 0.68, 1], zoomOut: 0.12, rotationDelta: 0 },
    side_flip: { duration: 1.4, ease: [0.16, 1, 0.3, 1], zoomOut: 0.15, rotationDelta: 0 },
    step_up: { duration: 1.0, ease: [0.22, 1, 0.36, 1], zoomOut: 0.1, rotationDelta: 0 },
    highlight: { duration: 1.0, ease: [0.33, 1, 0.68, 1], zoomOut: 0.08, rotationDelta: 0 },
  };
  
  const config = configs[type] || configs.fade;
  return {
    ...config,
    duration: (config.duration + distance * 0.2) * mobileMultiplier,
    zoomOut: Math.min(0.65, config.zoomOut + distance * 0.06),
    // Disable rotation on mobile
    rotationDelta: isMobile ? 0 : config.rotationDelta,
  };
};

// Floating particle component - simplified on mobile
const FloatingParticle = ({ particle, isMobile, reducedMotion }: { 
  particle: ReturnType<typeof generateParticles>[0]; 
  isMobile: boolean;
  reducedMotion: boolean;
}) => {
  // Static particle for reduced motion or very simple animation on mobile
  if (reducedMotion) {
    return (
      <div
        className="absolute rounded-full bg-primary/40"
        style={{
          left: particle.x,
          top: particle.y,
          width: particle.size,
          height: particle.size,
          opacity: particle.opacity,
        }}
      />
    );
  }

  return (
    <motion.div
      className="absolute rounded-full bg-primary/40 will-change-transform"
      style={{
        left: particle.x,
        top: particle.y,
        width: particle.size,
        height: particle.size,
        transform: "translateZ(0)",
        backfaceVisibility: "hidden",
      }}
      animate={isMobile ? {
        // Simpler animation on mobile - just opacity pulse
        opacity: [particle.opacity, particle.opacity * 1.3, particle.opacity],
      } : {
        y: [0, -particle.drift, 0],
        x: [0, particle.drift * 0.3, 0],
        opacity: [particle.opacity, particle.opacity * 1.5, particle.opacity],
        scale: [1, 1.2, 1],
      }}
      transition={{
        duration: isMobile ? particle.duration * 1.5 : particle.duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay: particle.delay,
      }}
    />
  );
};

// Nebula/glow effect component - disabled blur on mobile
const NebulaGlow = ({ x, y, size, color, delay, isMobile, reducedMotion }: { 
  x: number; 
  y: number; 
  size: number; 
  color: string; 
  delay: number;
  isMobile: boolean;
  reducedMotion: boolean;
}) => {
  // Skip entirely for reduced motion
  if (reducedMotion) {
    return null;
  }

  return (
    <motion.div
      className="absolute rounded-full pointer-events-none will-change-transform"
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        // Disable blur on mobile for performance
        filter: isMobile ? "none" : "blur(40px)",
        opacity: isMobile ? 0.1 : 0.15,
        transform: "translateZ(0)",
        backfaceVisibility: "hidden",
      }}
      animate={isMobile ? {
        // Simpler scale animation on mobile
        opacity: [0.08, 0.12, 0.08],
      } : {
        scale: [1, 1.3, 1],
        opacity: [0.15, 0.25, 0.15],
      }}
      transition={{
        duration: 12 + Math.random() * 8,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    />
  );
};

export const PresentScreen = () => {
  const { 
    narrative, 
    currentSectionIndex, 
    nextSection, 
    prevSection,
    setCurrentSectionIndex,
    setCurrentStep,
    businessContext,
    presentationStyle,
  } = useNarrativeStore();

  const { isPro, limits } = useSubscription();
  const isMobile = useIsMobile();
  const reducedMotion = useReducedMotion();
  
  // Brand logo with dark mode detection
  const { logoUrl, showLogo, logoPosition, logoSize } = useBrandLogo();
  
  const [showMinimap, setShowMinimap] = useState(!isMobile);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [prevIndex, setPrevIndex] = useState(0);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showTitleSequence, setShowTitleSequence] = useState(() => {
    // Check localStorage to see if user prefers to skip
    const skipIntro = localStorage.getItem('conclusiv_skip_intro');
    return skipIntro !== 'true';
  });
  const showWatermark = limits.hasWatermark;
  
  // Logo positioning classes
  const logoPositionClasses: Record<string, string> = {
    'top-left': 'top-20 left-6',
    'top-right': 'top-20 right-6',
    'bottom-left': 'bottom-20 left-6',
    'bottom-right': 'bottom-20 right-6',
  };
  
  const logoSizeClasses: Record<string, string> = {
    'sm': 'h-6',
    'md': 'h-8',
    'lg': 'h-12',
  };
  
  // Brand color styling
  const brandColorStyles = useMemo(() => {
    const styles: React.CSSProperties & Record<string, string> = {};
    if (presentationStyle?.primaryColor) {
      styles['--brand-primary'] = presentationStyle.primaryColor;
    }
    if (presentationStyle?.secondaryColor) {
      styles['--brand-secondary'] = presentationStyle.secondaryColor;
    }
    if (presentationStyle?.accentColor) {
      styles['--brand-accent'] = presentationStyle.accentColor;
    }
    return styles;
  }, [presentationStyle]);

  // Reduce particles and effects on mobile
  const particleCount = isMobile ? 15 : 80;
  const nebulaCount = isMobile ? 2 : 5;

  // Generate particles and node positions once
  const particles = useMemo(() => generateParticles(particleCount), [particleCount]);
  const nebulaPositions = useMemo(() => [
    { x: CANVAS_SIZE * 0.2, y: CANVAS_SIZE * 0.3, size: 600, color: "hsl(var(--primary))", delay: 0 },
    { x: CANVAS_SIZE * 0.7, y: CANVAS_SIZE * 0.2, size: 500, color: "hsl(var(--accent))", delay: 3 },
    { x: CANVAS_SIZE * 0.5, y: CANVAS_SIZE * 0.6, size: 700, color: "hsl(var(--primary))", delay: 6 },
    { x: CANVAS_SIZE * 0.3, y: CANVAS_SIZE * 0.8, size: 450, color: "hsl(var(--accent))", delay: 9 },
    { x: CANVAS_SIZE * 0.8, y: CANVAS_SIZE * 0.7, size: 550, color: "hsl(var(--primary))", delay: 4 },
  ].slice(0, nebulaCount), [nebulaCount]);

  const nodePositions = useMemo(() => {
    if (!narrative) return [];
    return generateNodePositions(narrative.sections.length);
  }, [narrative?.sections.length]);

  // Spring-based camera - simpler physics on mobile
  const springConfig = isMobile 
    ? { stiffness: 100, damping: 30, mass: 0.8 } // Faster, snappier on mobile
    : { stiffness: 40, damping: 20, mass: 1.2 };
  
  const cameraX = useSpring(CANVAS_SIZE / 2, springConfig);
  const cameraY = useSpring(CANVAS_SIZE / 2, springConfig);
  const cameraZoom = useSpring(1, isMobile ? { stiffness: 80, damping: 25, mass: 0.6 } : { stiffness: 35, damping: 18, mass: 1 });
  const cameraRotation = useSpring(0, { stiffness: 30, damping: 15, mass: 0.8 });

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
      currentSectionIndex,
      isMobile
    );

    setIsTransitioning(true);
    
    const dx = targetPos.x - cameraX.get();
    const dy = targetPos.y - cameraY.get();
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Disable motion blur on mobile
    if (!isMobile && !reducedMotion) {
      blurAmount.set(Math.min(6, distance / 300));
    }
    
    // Cinematic zoom sequence
    const midpointDelay = config.duration * 0.45;
    
    cameraZoom.set(1 - config.zoomOut);
    
    // Disable rotation on mobile
    if (!isMobile) {
      cameraRotation.set(cameraRotation.get() + config.rotationDelta);
    }
    
    cameraX.set(targetPos.x);
    cameraY.set(targetPos.y);
    
    setTimeout(() => {
      cameraZoom.set(1);
      blurAmount.set(0);
    }, midpointDelay * 1000);

    setTimeout(() => {
      setIsTransitioning(false);
      setPrevIndex(currentSectionIndex);
    }, config.duration * 1000);

  }, [currentSectionIndex, narrative, nodePositions, isMobile, reducedMotion]);

  // Initialize camera position
  useEffect(() => {
    if (nodePositions.length > 0) {
      const pos = nodePositions[0];
      cameraX.set(pos.x);
      cameraY.set(pos.y);
    }
  }, [nodePositions]);

  // Hide minimap on mobile by default
  useEffect(() => {
    setShowMinimap(!isMobile);
  }, [isMobile]);

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

  // Simplified rendering for reduced motion preference
  const shouldSimplifyAnimations = reducedMotion || isMobile;

  return (
    <>
      {/* Title Sequence */}
      {showTitleSequence && (
        <TitleSequence 
          onComplete={() => setShowTitleSequence(false)}
          companyLogoUrl={logoUrl}
          brandColors={businessContext?.brandColors}
        />
      )}
      
      {showWatermark && <Watermark onUpgrade={() => setShowUpgrade(true)} />}
      <UpgradePrompt trigger="presentation" isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
      <div className="fixed inset-0 bg-background z-50 overflow-hidden" style={brandColorStyles}>
      
      {/* Brand Logo Overlay */}
      {showLogo && logoUrl && logoPosition !== 'none' && (
        <motion.div 
          className={cn(
            "absolute z-30 opacity-70 hover:opacity-100 transition-opacity",
            logoPositionClasses[logoPosition]
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <img 
            src={logoUrl} 
            alt="Logo" 
            className={cn(
              "w-auto object-contain",
              logoSizeClasses[logoSize]
            )}
          />
        </motion.div>
      )}
      {/* Infinite Canvas Container */}
      <motion.div
        className="absolute inset-0"
        style={isMobile ? {
          // Disable 3D transforms on mobile for performance
        } : {
          perspective: 2500,
          perspectiveOrigin: "50% 50%",
        }}
      >
        {/* Camera/Viewport */}
        <motion.div
          className="absolute w-full h-full will-change-transform"
          style={{
            x: useTransform(cameraX, (x) => `calc(50vw - ${x}px)`),
            y: useTransform(cameraY, (y) => `calc(50vh - ${y}px)`),
            scale: cameraZoom,
            rotate: isMobile ? 0 : cameraRotation,
            // Disable motion blur on mobile
            filter: isMobile ? "none" : useTransform(blurAmount, (b) => `blur(${b}px)`),
            transformStyle: isMobile ? "flat" : "preserve-3d",
            backfaceVisibility: "hidden",
          }}
        >
          {/* Nebula glows - ambient background */}
          {nebulaPositions.map((nebula, i) => (
            <NebulaGlow 
              key={`nebula-${i}`} 
              {...nebula} 
              isMobile={isMobile} 
              reducedMotion={reducedMotion}
            />
          ))}

          {/* Floating particles */}
          {particles.map((particle, i) => (
            <FloatingParticle 
              key={`particle-${i}`} 
              particle={particle} 
              isMobile={isMobile}
              reducedMotion={reducedMotion}
            />
          ))}

          {/* Connecting lines between nodes */}
          <svg 
            className="absolute top-0 left-0 pointer-events-none"
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            style={{ opacity: 0.2 }}
          >
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
                <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
              </linearGradient>
              {!isMobile && (
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              )}
            </defs>
            {nodePositions.map((pos, i) => {
              if (i === 0) return null;
              const prevPos = nodePositions[i - 1];
              const isActive = i === currentSectionIndex || i - 1 === currentSectionIndex;
              return (
                <motion.line
                  key={`line-${i}`}
                  x1={prevPos.x}
                  y1={prevPos.y}
                  x2={pos.x}
                  y2={pos.y}
                  stroke="url(#lineGradient)"
                  strokeWidth={isActive ? 3 : 2}
                  strokeDasharray="12 6"
                  filter={isActive && !isMobile ? "url(#glow)" : undefined}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: isActive ? 0.6 : 0.3 }}
                  transition={{ 
                    duration: shouldSimplifyAnimations ? 0.5 : 1.5, 
                    delay: shouldSimplifyAnimations ? i * 0.05 : i * 0.15, 
                    ease: "easeOut" 
                  }}
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
            
            // Disable blur on mobile
            const nodeBlur = isMobile ? 0 : (isActive ? 0 : Math.min(5, distance * 1.2));
            const nodeOpacity = isActive ? 1 : Math.max(0.35, 1 - distance * 0.12);
            
            return (
              <motion.div
                key={section.id}
                className="absolute will-change-transform"
                style={{
                  left: pos.x,
                  top: pos.y,
                  x: "-50%",
                  y: "-50%",
                  transformStyle: isMobile ? "flat" : "preserve-3d",
                  backfaceVisibility: "hidden",
                }}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ 
                  opacity: nodeOpacity,
                  scale: isActive ? 1 : 0.85,
                  filter: isMobile ? "none" : `blur(${nodeBlur}px)`,
                }}
                transition={{ 
                  duration: shouldSimplifyAnimations ? 0.3 : 0.8, 
                  ease: shouldSimplifyAnimations ? "easeOut" : [0.16, 1, 0.3, 1] 
                }}
              >
                <div 
                  className={cn(
                    "w-[520px] max-w-[90vw] rounded-2xl border bg-card/95 backdrop-blur-md p-8 text-center shadow-2xl transition-all",
                    shouldSimplifyAnimations ? "duration-300" : "duration-700",
                    isActive 
                      ? "border-primary/60 shadow-primary/30" 
                      : isPast 
                        ? "border-border/30 shadow-none" 
                        : "border-border/20 shadow-none"
                  )}
                  style={{
                    transform: isMobile ? "none" : `rotateZ(${pos.rotation}deg)`,
                  }}
                >
                  {/* Pulsing glow effect for active node - simplified on mobile */}
                  {isActive && !reducedMotion && (
                    <>
                      <motion.div
                        className="absolute inset-0 -z-10 rounded-2xl bg-primary/15"
                        style={{ 
                          filter: isMobile ? "none" : "blur(24px)",
                        }}
                        animate={isMobile ? { 
                          opacity: [0.3, 0.5, 0.3],
                        } : { 
                          opacity: [0.5, 0.8, 0.5],
                          scale: [1, 1.15, 1],
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      />
                      {!isMobile && (
                        <motion.div
                          className="absolute inset-0 -z-20 rounded-2xl bg-accent/10 blur-[60px]"
                          animate={{ 
                            opacity: [0.3, 0.5, 0.3],
                            scale: [1.1, 1.3, 1.1],
                          }}
                          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        />
                      )}
                    </>
                  )}

                  {/* Icon */}
                  <motion.div 
                    className={cn(
                      "w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-5 transition-all",
                      shouldSimplifyAnimations ? "duration-200" : "duration-500",
                      isActive 
                        ? "bg-gradient-to-br from-primary/40 to-accent/40 border border-primary/50" 
                        : "bg-muted/50 border border-border/30"
                    )}
                    animate={isActive && !reducedMotion && !isMobile ? { 
                      boxShadow: ["0 0 20px hsl(var(--primary) / 0.3)", "0 0 40px hsl(var(--primary) / 0.5)", "0 0 20px hsl(var(--primary) / 0.3)"]
                    } : {}}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Icon className={cn(
                      "w-8 h-8 transition-colors duration-300",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )} />
                  </motion.div>

                  {/* Title */}
                  <h2 className={cn(
                    "text-2xl font-semibold mb-3 tracking-tight transition-colors duration-300",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {section.title}
                  </h2>

                  {/* Content */}
                  {section.content && isActive && (
                    <motion.p
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        delay: shouldSimplifyAnimations ? 0.15 : 0.4, 
                        duration: shouldSimplifyAnimations ? 0.3 : 0.6, 
                        ease: "easeOut" 
                      }}
                      className="text-base text-muted-foreground max-w-md mx-auto mb-4"
                    >
                      {section.content}
                    </motion.p>
                  )}

                  {/* Items */}
                  {section.items && section.items.length > 0 && isActive && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ 
                        delay: shouldSimplifyAnimations ? 0.2 : 0.5, 
                        duration: shouldSimplifyAnimations ? 0.2 : 0.5 
                      }}
                      className="grid grid-cols-1 gap-2 mt-4 text-left"
                    >
                      {section.items.slice(0, 4).map((item, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -15 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ 
                            delay: shouldSimplifyAnimations ? 0.2 + idx * 0.05 : 0.5 + idx * 0.1, 
                            duration: shouldSimplifyAnimations ? 0.2 : 0.5, 
                            ease: "easeOut" 
                          }}
                          className="p-2.5 rounded-lg bg-background/60 border border-border/20"
                        >
                          <div className="flex items-start gap-2">
                            <motion.div 
                              className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0"
                              animate={reducedMotion ? {} : { scale: [1, 1.3, 1] }}
                              transition={{ duration: 2, repeat: Infinity, delay: idx * 0.2 }}
                            />
                            <p className="text-sm text-foreground">{item}</p>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  {/* Node number */}
                  <div className={cn(
                    "absolute -top-3 -right-3 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/40" 
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
          background: "radial-gradient(ellipse at center, transparent 40%, hsl(var(--background)) 100%)",
          opacity: isTransitioning ? 0.75 : 0.5,
          transition: "opacity 0.8s ease",
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
      <AnimatePresence mode="wait">
        {showMinimap && (
          <motion.div
            key="minimap"
            initial={{ opacity: 0, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 20 }}
            transition={{ duration: shouldSimplifyAnimations ? 0.15 : 0.3 }}
            className="absolute top-20 right-6 z-20"
          >
            <div className="w-48 h-48 rounded-xl border border-border/50 bg-card/90 backdrop-blur-md overflow-hidden shadow-xl">
              <div 
                className="relative w-full h-full"
                style={{ transform: `scale(${48 / CANVAS_SIZE * 100})`, transformOrigin: "top left" }}
              >
                {nodePositions.map((pos, i) => (
                  <button
                    key={i}
                    onClick={() => !isTransitioning && setCurrentSectionIndex(i)}
                    className={cn(
                      "absolute w-6 h-6 rounded-full transition-all duration-300",
                      i === currentSectionIndex 
                        ? "bg-primary scale-150 shadow-lg shadow-primary/50" 
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
                        opacity={0.4}
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
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
        {narrative.sections.map((_, i) => (
          <button
            key={i}
            onClick={() => !isTransitioning && setCurrentSectionIndex(i)}
            disabled={isTransitioning}
            className={cn(
              "rounded-full transition-all",
              shouldSimplifyAnimations ? "duration-200" : "duration-500",
              i === currentSectionIndex 
                ? "w-10 h-2 bg-primary shadow-lg shadow-primary/50" 
                : "w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
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
          className="text-muted-foreground hover:text-foreground"
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
          className="text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Transition indicator */}
      <AnimatePresence mode="wait">
        {isTransitioning && (
          <motion.div
            key="transition-indicator"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: shouldSimplifyAnimations ? 0.1 : 0.2 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20"
          >
            <div className="px-5 py-2.5 rounded-full bg-card/90 backdrop-blur-md border border-border/50 shadow-lg">
              <span className="text-xs text-muted-foreground flex items-center gap-2">
                <motion.span
                  className="w-2 h-2 rounded-full bg-primary"
                  animate={reducedMotion ? {} : { scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                />
                Flying to section {currentSectionIndex + 1}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Watermark */}
      <div className="absolute bottom-4 right-4 opacity-20 hover:opacity-40 transition-opacity z-20">
        <img 
          src={conclusivLogo} 
          alt="conclusiv" 
          className="h-5 w-auto"
          style={{ aspectRatio: 'auto' }}
        />
      </div>
    </div>
    </>
  );
};

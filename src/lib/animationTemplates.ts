import type { TemplateName, TransitionType } from "./types";

// Animation template configurations
// Each template has a radically different visual personality

export interface TemplateAnimationConfig {
  // Camera & viewport
  cameraSpring: { stiffness: number; damping: number; mass: number };
  zoomSpring: { stiffness: number; damping: number; mass: number };
  maxZoomOut: number;
  useRotation: boolean;
  use3D: boolean;
  perspectiveDistance: number;
  
  // Node layout
  layoutType: "spiral" | "horizontal" | "vertical" | "grid" | "radial";
  nodeSpacing: number;
  nodeScale: { active: number; inactive: number };
  
  // Card styling
  cardWidth: number;
  cardBlur: { active: number; inactive: number };
  cardOpacity: { active: number; inactive: number };
  cardBorderRadius: number;
  
  // Particle effects
  particleCount: number;
  particleDrift: number;
  nebulaCount: number;
  nebulaOpacity: number;
  
  // Transition characteristics
  transitionDuration: { base: number; perStep: number };
  ease: number[];
  staggerDelay: number;
  contentDelay: number;
  
  // Unique features
  features: {
    parallaxLayers?: boolean;
    kenBurnsEffect?: boolean;
    splitReveal?: boolean;
    elevatorMotion?: boolean;
    aerialPerspective?: boolean;
    comicPanels?: boolean;
    diagonalWipes?: boolean;
  };
}

// ZoomReveal - Cinematic zoom with deep 3D parallax (Ken Burns inspired)
const ZoomReveal: TemplateAnimationConfig = {
  cameraSpring: { stiffness: 25, damping: 18, mass: 1.5 },
  zoomSpring: { stiffness: 20, damping: 15, mass: 1.8 },
  maxZoomOut: 0.4,
  useRotation: true,
  use3D: true,
  perspectiveDistance: 1500,
  
  layoutType: "spiral",
  nodeSpacing: 350,
  nodeScale: { active: 1.1, inactive: 0.7 },
  
  cardWidth: 600,
  cardBlur: { active: 0, inactive: 8 },
  cardOpacity: { active: 1, inactive: 0.3 },
  cardBorderRadius: 24,
  
  particleCount: 100,
  particleDrift: 180,
  nebulaCount: 6,
  nebulaOpacity: 0.2,
  
  transitionDuration: { base: 2.2, perStep: 0.3 },
  ease: [0.16, 1, 0.3, 1],
  staggerDelay: 0.15,
  contentDelay: 0.5,
  
  features: {
    parallaxLayers: true,
    kenBurnsEffect: true,
  },
};

// LinearStoryboard - Horizontal scroll with comic book panels
const LinearStoryboard: TemplateAnimationConfig = {
  cameraSpring: { stiffness: 80, damping: 28, mass: 0.8 },
  zoomSpring: { stiffness: 60, damping: 22, mass: 0.6 },
  maxZoomOut: 0.12,
  useRotation: false,
  use3D: false,
  perspectiveDistance: 2000,
  
  layoutType: "horizontal",
  nodeSpacing: 700,
  nodeScale: { active: 1, inactive: 0.92 },
  
  cardWidth: 500,
  cardBlur: { active: 0, inactive: 2 },
  cardOpacity: { active: 1, inactive: 0.5 },
  cardBorderRadius: 16,
  
  particleCount: 40,
  particleDrift: 60,
  nebulaCount: 2,
  nebulaOpacity: 0.08,
  
  transitionDuration: { base: 0.8, perStep: 0.1 },
  ease: [0.33, 1, 0.68, 1],
  staggerDelay: 0.08,
  contentDelay: 0.2,
  
  features: {
    comicPanels: true,
  },
};

// FlyoverMap - Aerial perspective with bird's eye camera swoops
const FlyoverMap: TemplateAnimationConfig = {
  cameraSpring: { stiffness: 30, damping: 20, mass: 1.2 },
  zoomSpring: { stiffness: 25, damping: 18, mass: 1.4 },
  maxZoomOut: 0.55,
  useRotation: true,
  use3D: true,
  perspectiveDistance: 800,
  
  layoutType: "radial",
  nodeSpacing: 450,
  nodeScale: { active: 1.05, inactive: 0.65 },
  
  cardWidth: 480,
  cardBlur: { active: 0, inactive: 12 },
  cardOpacity: { active: 1, inactive: 0.25 },
  cardBorderRadius: 20,
  
  particleCount: 120,
  particleDrift: 200,
  nebulaCount: 8,
  nebulaOpacity: 0.15,
  
  transitionDuration: { base: 1.8, perStep: 0.25 },
  ease: [0.12, 0.8, 0.25, 1],
  staggerDelay: 0.12,
  contentDelay: 0.4,
  
  features: {
    aerialPerspective: true,
    parallaxLayers: true,
  },
};

// ContrastSplit - Diagonal wipes and before/after reveals
const ContrastSplit: TemplateAnimationConfig = {
  cameraSpring: { stiffness: 50, damping: 24, mass: 1.0 },
  zoomSpring: { stiffness: 45, damping: 20, mass: 0.9 },
  maxZoomOut: 0.2,
  useRotation: false,
  use3D: true,
  perspectiveDistance: 2500,
  
  layoutType: "grid",
  nodeSpacing: 550,
  nodeScale: { active: 1, inactive: 0.85 },
  
  cardWidth: 520,
  cardBlur: { active: 0, inactive: 4 },
  cardOpacity: { active: 1, inactive: 0.4 },
  cardBorderRadius: 8,
  
  particleCount: 50,
  particleDrift: 80,
  nebulaCount: 3,
  nebulaOpacity: 0.1,
  
  transitionDuration: { base: 1.2, perStep: 0.15 },
  ease: [0.22, 1, 0.36, 1],
  staggerDelay: 0.1,
  contentDelay: 0.3,
  
  features: {
    splitReveal: true,
    diagonalWipes: true,
  },
};

// PriorityLadder - Vertical climb with elevator motion and floor indicators
const PriorityLadder: TemplateAnimationConfig = {
  cameraSpring: { stiffness: 65, damping: 26, mass: 0.9 },
  zoomSpring: { stiffness: 55, damping: 22, mass: 0.7 },
  maxZoomOut: 0.18,
  useRotation: false,
  use3D: true,
  perspectiveDistance: 3000,
  
  layoutType: "vertical",
  nodeSpacing: 450,
  nodeScale: { active: 1, inactive: 0.88 },
  
  cardWidth: 540,
  cardBlur: { active: 0, inactive: 3 },
  cardOpacity: { active: 1, inactive: 0.45 },
  cardBorderRadius: 12,
  
  particleCount: 60,
  particleDrift: 100,
  nebulaCount: 4,
  nebulaOpacity: 0.12,
  
  transitionDuration: { base: 1.0, perStep: 0.12 },
  ease: [0.22, 1, 0.36, 1],
  staggerDelay: 0.06,
  contentDelay: 0.25,
  
  features: {
    elevatorMotion: true,
  },
};

// Template configuration map
export const templateConfigs: Record<TemplateName, TemplateAnimationConfig> = {
  ZoomReveal,
  LinearStoryboard,
  FlyoverMap,
  ContrastSplit,
  PriorityLadder,
};

// Default template used when none is selected
const DEFAULT_TEMPLATE: TemplateName = "LinearStoryboard";

// Get animation config for a template (null-safe)
export const getTemplateConfig = (template: TemplateName | null | undefined): TemplateAnimationConfig => {
  const safeTemplate = template || DEFAULT_TEMPLATE;
  return templateConfigs[safeTemplate] || LinearStoryboard;
};

// Generate node positions based on layout type
export const generateNodePositions = (
  count: number, 
  config: TemplateAnimationConfig,
  canvasSize: number
): Array<{ x: number; y: number; scale: number; rotation: number; z: number }> => {
  const positions: Array<{ x: number; y: number; scale: number; rotation: number; z: number }> = [];
  const centerX = canvasSize / 2;
  const centerY = canvasSize / 2;
  
  switch (config.layoutType) {
    case "spiral": {
      for (let i = 0; i < count; i++) {
        const angle = (i * 137.5 * Math.PI) / 180;
        const radius = config.nodeSpacing + i * (config.nodeSpacing * 0.5);
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        const rotation = config.useRotation ? Math.sin(i * 0.5) * 5 : 0;
        const z = config.use3D ? (i % 3 - 1) * 100 : 0;
        positions.push({ x, y, scale: 1, rotation, z });
      }
      break;
    }
    
    case "horizontal": {
      for (let i = 0; i < count; i++) {
        const x = centerX + (i - (count - 1) / 2) * config.nodeSpacing;
        const y = centerY;
        const z = 0;
        positions.push({ x, y, scale: 1, rotation: 0, z });
      }
      break;
    }
    
    case "vertical": {
      for (let i = 0; i < count; i++) {
        const x = centerX;
        const y = centerY + (i - (count - 1) / 2) * config.nodeSpacing;
        const z = config.use3D ? Math.sin(i * 0.8) * 50 : 0;
        positions.push({ x, y, scale: 1, rotation: 0, z });
      }
      break;
    }
    
    case "grid": {
      const cols = Math.ceil(Math.sqrt(count));
      for (let i = 0; i < count; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = centerX + (col - (cols - 1) / 2) * config.nodeSpacing;
        const y = centerY + (row - (Math.ceil(count / cols) - 1) / 2) * config.nodeSpacing;
        const z = config.use3D ? ((col + row) % 2) * 80 : 0;
        positions.push({ x, y, scale: 1, rotation: 0, z });
      }
      break;
    }
    
    case "radial": {
      // First node at center
      positions.push({ x: centerX, y: centerY, scale: 1.1, rotation: 0, z: 0 });
      
      // Remaining nodes in concentric circles
      let nodeIndex = 1;
      let ring = 1;
      while (nodeIndex < count) {
        const nodesInRing = Math.min(6 * ring, count - nodeIndex);
        for (let j = 0; j < nodesInRing; j++) {
          const angle = (j / nodesInRing) * Math.PI * 2 - Math.PI / 2;
          const radius = ring * config.nodeSpacing;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          const rotation = config.useRotation ? angle * 180 / Math.PI * 0.05 : 0;
          const z = config.use3D ? ring * 60 : 0;
          positions.push({ x, y, scale: 1, rotation, z });
          nodeIndex++;
          if (nodeIndex >= count) break;
        }
        ring++;
      }
      break;
    }
  }
  
  return positions;
};

// Get transition type sequence for a template (null-safe)
export const getTransitionSequence = (template: TemplateName | null | undefined, sectionCount: number): TransitionType[] => {
  const transitions: TransitionType[] = [];
  const safeTemplate = template || DEFAULT_TEMPLATE;
  
  const templateTransitions: Record<TemplateName, TransitionType[]> = {
    ZoomReveal: ["zoom_in", "zoom_out", "pan", "zoom_in", "orbit", "zoom_out", "pan_to_node"],
    LinearStoryboard: ["slide_left", "slide_left", "fade", "slide_left", "slide_left"],
    FlyoverMap: ["pan_to_node", "orbit", "zoom_in", "pan", "zoom_out", "orbit", "pan_to_node"],
    ContrastSplit: ["split_reveal", "side_flip", "fade", "split_reveal", "tilt", "side_flip"],
    PriorityLadder: ["step_up", "step_up", "highlight", "step_up", "zoom_in", "step_up"],
  };
  
  const sequence = templateTransitions[safeTemplate] || templateTransitions.LinearStoryboard;
  
  for (let i = 0; i < sectionCount; i++) {
    transitions.push(sequence[i % sequence.length]);
  }
  
  return transitions;
};

// Calculate content enter animations per template (null-safe)
export const getContentEnterAnimation = (template: TemplateName | null | undefined) => {
  const safeTemplate = template || DEFAULT_TEMPLATE;
  const configs: Record<TemplateName, {
    title: { initial: object; animate: object; transition: object };
    content: { initial: object; animate: object; transition: object };
    items: { initial: object; animate: object; transition: object };
  }> = {
    ZoomReveal: {
      title: { 
        initial: { opacity: 0, scale: 1.2, y: -20 }, 
        animate: { opacity: 1, scale: 1, y: 0 },
        transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
      },
      content: { 
        initial: { opacity: 0, y: 30, filter: "blur(8px)" }, 
        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
        transition: { duration: 0.7, delay: 0.3 }
      },
      items: { 
        initial: { opacity: 0, x: -40, scale: 0.9 }, 
        animate: { opacity: 1, x: 0, scale: 1 },
        transition: { duration: 0.5 }
      },
    },
    LinearStoryboard: {
      title: { 
        initial: { opacity: 0, x: 60 }, 
        animate: { opacity: 1, x: 0 },
        transition: { duration: 0.5, ease: [0.33, 1, 0.68, 1] }
      },
      content: { 
        initial: { opacity: 0, x: 40 }, 
        animate: { opacity: 1, x: 0 },
        transition: { duration: 0.4, delay: 0.15 }
      },
      items: { 
        initial: { opacity: 0, x: 20 }, 
        animate: { opacity: 1, x: 0 },
        transition: { duration: 0.3 }
      },
    },
    FlyoverMap: {
      title: { 
        initial: { opacity: 0, y: -50, scale: 0.8 }, 
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { duration: 0.9, ease: [0.12, 0.8, 0.25, 1] }
      },
      content: { 
        initial: { opacity: 0, y: 40 }, 
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6, delay: 0.25 }
      },
      items: { 
        initial: { opacity: 0, scale: 0.8, rotate: -5 }, 
        animate: { opacity: 1, scale: 1, rotate: 0 },
        transition: { duration: 0.5 }
      },
    },
    ContrastSplit: {
      title: { 
        initial: { opacity: 0, clipPath: "inset(0 100% 0 0)" }, 
        animate: { opacity: 1, clipPath: "inset(0 0% 0 0)" },
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
      },
      content: { 
        initial: { opacity: 0, clipPath: "inset(0 0 100% 0)" }, 
        animate: { opacity: 1, clipPath: "inset(0 0 0% 0)" },
        transition: { duration: 0.5, delay: 0.2 }
      },
      items: { 
        initial: { opacity: 0, x: -30 }, 
        animate: { opacity: 1, x: 0 },
        transition: { duration: 0.4 }
      },
    },
    PriorityLadder: {
      title: { 
        initial: { opacity: 0, y: 40 }, 
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
      },
      content: { 
        initial: { opacity: 0, y: 25 }, 
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, delay: 0.1 }
      },
      items: { 
        initial: { opacity: 0, y: 15, scale: 0.95 }, 
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { duration: 0.3 }
      },
    },
  };
  
  return configs[safeTemplate] || configs.LinearStoryboard;
};

// Mobile-optimized configs (simplified animations, null-safe)
export const getMobileConfig = (template: TemplateName | null | undefined): Partial<TemplateAnimationConfig> => {
  const safeTemplate = template || DEFAULT_TEMPLATE;
  const baseConfig = templateConfigs[safeTemplate];
  
  return {
    cameraSpring: { stiffness: 100, damping: 30, mass: 0.7 },
    zoomSpring: { stiffness: 80, damping: 25, mass: 0.5 },
    maxZoomOut: Math.min(0.15, baseConfig.maxZoomOut),
    useRotation: false,
    use3D: false,
    particleCount: Math.min(20, baseConfig.particleCount),
    nebulaCount: Math.min(2, baseConfig.nebulaCount),
    transitionDuration: { 
      base: baseConfig.transitionDuration.base * 0.6,
      perStep: baseConfig.transitionDuration.perStep * 0.5,
    },
  };
};


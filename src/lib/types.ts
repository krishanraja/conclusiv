export type Priority = "low" | "medium" | "high";

export type ItemType = "insight" | "risk" | "metric" | "trend" | "opportunity" | "problem" | "driver";

export interface ThemeItem {
  id: string;
  text: string;
  type: ItemType;
  score: number;
}

export interface Theme {
  id: string;
  name: string;
  priority: Priority;
  items: ThemeItem[];
  keep: boolean;
}

export type TransitionType = 
  | "zoom_in"
  | "zoom_out"
  | "pan"
  | "slide_left"
  | "fade"
  | "card_expand"
  | "pan_to_node"
  | "orbit"
  | "tilt"
  | "split_reveal"
  | "side_flip"
  | "step_up"
  | "highlight";

export type TemplateName = 
  | "ZoomReveal" 
  | "LinearStoryboard" 
  | "FlyoverMap" 
  | "ContrastSplit" 
  | "PriorityLadder";

export type ColorTheme = "darkCinematic" | "cleanWhite" | "warmNeutral" | "deepOcean";

export type IconSet = "minimal" | "bold" | "outline";

export interface Position {
  x: number;
  y: number;
}

export interface NarrativeSection {
  id: string;
  title: string;
  content?: string;
  items?: string[];
  position: Position;
  icon: string;
  image?: string;
}

export interface Transition {
  type: TransitionType;
  target: string;
  duration?: number;
}

export interface NarrativeSchema {
  template: TemplateName;
  colorTheme: ColorTheme;
  iconSet: IconSet;
  sections: NarrativeSection[];
  transitions: Transition[];
}

export interface TemplateRecommendation {
  template: TemplateName;
  confidence: number;
  reason: string;
}

export interface ExtractionResult {
  themes: Theme[];
  narrativeShape: string;
  recommendations: TemplateRecommendation[];
}

export interface BusinessContext {
  companyName: string;
  industry: string;
  products: string[];
  valuePropositions: string[];
  brandVoice: string;
}

export interface BuildNarrativeResponse {
  themes: Theme[];
  recommendedTemplate: TemplateName;
  narrative: NarrativeSchema;
  businessContext?: BusinessContext;
}

export interface AppState {
  rawText: string;
  themes: Theme[];
  selectedTemplate: TemplateName | null;
  narrative: NarrativeSchema | null;
  currentStep: "input" | "refine" | "preview" | "present";
}

// Refinement types
export interface RefinementHighlight {
  start: number;
  end: number;
  text: string;
}

export interface KeyClaim {
  id: string;
  text: string;
  source?: string;
  approved: boolean | null;
  flaggedMisleading: boolean;
}

export interface RefinementState {
  highlights: RefinementHighlight[];
  keyClaims: KeyClaim[];
  voiceFeedback: string;
}

export interface ExtractClaimsResponse {
  claims?: KeyClaim[];
  error?: string;
}

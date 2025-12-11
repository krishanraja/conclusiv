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
  title: string;
  text: string;
  source?: string;
  approved: boolean | null;
  edited?: boolean;
  originalTitle?: string;
  originalText?: string;
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

// ===== PHASE 1: Audience Mode =====
export type AudienceMode = "exec" | "product" | "investors" | "clients" | "ops" | "briefing";

export const audienceDescriptions: Record<AudienceMode, { label: string; description: string; icon: string }> = {
  exec: { label: "Executives", description: "High-level, decision-focused", icon: "Crown" },
  product: { label: "Product Team", description: "Feature-centric, technical depth", icon: "Package" },
  investors: { label: "Investors", description: "Growth metrics, market opportunity", icon: "TrendingUp" },
  clients: { label: "Clients", description: "Value delivery, ROI focus", icon: "Users" },
  ops: { label: "Operations", description: "Process clarity, dependencies", icon: "Settings" },
  briefing: { label: "Briefing", description: "Military precision, crisp", icon: "Target" },
};

// ===== PHASE 2: Tension Detector =====
export type TensionType = "contradiction" | "blind_spot" | "hidden_risk" | "strategic_option";
export type TensionSeverity = "low" | "medium" | "high";

export interface Tension {
  id: string;
  type: TensionType;
  severity: TensionSeverity;
  title: string;
  description: string;
  sourceA?: string;
  sourceB?: string;
  recommendation: string;
}

// ===== PHASE 3: Narrative Archetypes =====
export type NarrativeArchetype = 
  | "strategy_brief"
  | "exec_decision_memo"
  | "investor_pitch"
  | "gtm_plan"
  | "problem_framing"
  | "root_cause"
  | "workshop_outline"
  | "competitive_teardown";

// ===== PHASE 4: Adaptive Compression =====
export type NarrativeDuration = "10s" | "1min" | "5min" | "full";

export const durationDescriptions: Record<NarrativeDuration, { label: string; sections: string }> = {
  "10s": { label: "10 seconds", sections: "3 slides" },
  "1min": { label: "1 minute", sections: "4-5 slides" },
  "5min": { label: "5 minutes", sections: "6-8 slides" },
  "full": { label: "Full", sections: "All slides" },
};

// ===== PHASE 5: View Modes =====
export type ViewMode = "present" | "reader" | "external";

export const viewModeDescriptions: Record<ViewMode, { label: string; description: string }> = {
  present: { label: "Present", description: "Animated presentation mode" },
  reader: { label: "Reader", description: "Scrollable document view" },
  external: { label: "External View", description: "Clean view for sharing" },
};

// ===== PHASE 6: Company Brain =====
export interface CompanyBrain {
  id: string;
  user_id: string;
  company_name: string;
  historical_themes: string[];
  tone_patterns: Record<string, string>;
  strategic_guardrails: string[];
  emphasized_topics: string[];
  narrative_count: number;
  created_at: string;
  updated_at: string;
}

// ===== PHASE 7: Alternative Narratives =====
export type AlternativeGoal = "funding" | "alignment" | "adversarial" | "optimistic" | "risk_focused";

export interface NarrativeAlternative {
  id: string;
  goal: AlternativeGoal;
  goalLabel: string;
  rationale: string;
  narrative: NarrativeSchema;
}

export const alternativeGoalDescriptions: Record<AlternativeGoal, { label: string; description: string }> = {
  funding: { label: "Optimized for Funding", description: "Emphasizes growth potential and market opportunity" },
  alignment: { label: "Internal Alignment", description: "Focuses on shared goals and team coordination" },
  adversarial: { label: "Devil's Advocate", description: "Highlights risks and challenges" },
  optimistic: { label: "Optimistic Projection", description: "Best-case scenario framing" },
  risk_focused: { label: "Risk-Aware", description: "Conservative with mitigation strategies" },
};

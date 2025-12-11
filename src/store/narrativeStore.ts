import { create } from "zustand";
import type { 
  Theme, 
  TemplateName, 
  NarrativeSchema, 
  Priority, 
  BusinessContext, 
  RefinementHighlight, 
  KeyClaim,
  AudienceMode,
  NarrativeArchetype,
  NarrativeDuration,
  ViewMode,
  Tension,
  NarrativeAlternative,
  CompanyBrain
} from "@/lib/types";

interface NarrativeState {
  // Input
  rawText: string;
  setRawText: (text: string) => void;
  
  // Voice
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
  
  // Business Context
  businessWebsite: string;
  setBusinessWebsite: (url: string) => void;
  businessContext: BusinessContext | null;
  setBusinessContext: (context: BusinessContext | null) => void;
  
  // Themes
  themes: Theme[];
  setThemes: (themes: Theme[]) => void;
  toggleThemeKeep: (themeId: string) => void;
  setThemePriority: (themeId: string, priority: Priority) => void;
  
  // Template
  selectedTemplate: TemplateName | null;
  setSelectedTemplate: (template: TemplateName | null) => void;
  
  // Narrative
  narrative: NarrativeSchema | null;
  setNarrative: (narrative: NarrativeSchema | null) => void;
  updateSectionContent: (sectionId: string, content: string) => void;
  updateSectionIcon: (sectionId: string, icon: string) => void;
  reorderSections: (fromIndex: number, toIndex: number) => void;
  
  // Refinement state
  highlights: RefinementHighlight[];
  setHighlights: (highlights: RefinementHighlight[]) => void;
  keyClaims: KeyClaim[];
  setKeyClaims: (claims: KeyClaim[]) => void;
  approveClaim: (claimId: string) => void;
  rejectClaim: (claimId: string) => void;
  updateClaim: (claimId: string, updates: { title?: string; text?: string }) => void;
  voiceFeedback: string;
  setVoiceFeedback: (feedback: string) => void;
  
  // UI State - 4-step flow with refine
  currentStep: "input" | "refine" | "preview" | "present";
  setCurrentStep: (step: "input" | "refine" | "preview" | "present") => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  loadingMessage: string;
  setLoadingMessage: (message: string) => void;
  
  // Loading stages
  loadingStage: number;
  setLoadingStage: (stage: number) => void;
  loadingProgress: number;
  setLoadingProgress: (progress: number) => void;
  
  // Present mode
  currentSectionIndex: number;
  setCurrentSectionIndex: (index: number) => void;
  nextSection: () => void;
  prevSection: () => void;
  
  // View mode (Phase 5 - extended)
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  
  // ===== PHASE 1: Audience Mode =====
  audienceMode: AudienceMode | null;
  setAudienceMode: (mode: AudienceMode | null) => void;
  
  // ===== PHASE 2: Tensions =====
  tensions: Tension[];
  setTensions: (tensions: Tension[]) => void;
  includeTensionSlide: boolean;
  setIncludeTensionSlide: (include: boolean) => void;
  
  // ===== PHASE 3: Archetypes =====
  selectedArchetype: NarrativeArchetype | null;
  setSelectedArchetype: (archetype: NarrativeArchetype | null) => void;
  
  // ===== PHASE 4: Duration =====
  duration: NarrativeDuration;
  setDuration: (duration: NarrativeDuration) => void;
  
  // ===== PHASE 6: Company Brain =====
  companyBrain: CompanyBrain | null;
  setCompanyBrain: (brain: CompanyBrain | null) => void;
  
  // ===== PHASE 7: Alternatives =====
  alternatives: NarrativeAlternative[];
  setAlternatives: (alternatives: NarrativeAlternative[]) => void;
  swapWithAlternative: (alternativeId: string) => void;
  isGeneratingAlternatives: boolean;
  setIsGeneratingAlternatives: (generating: boolean) => void;
  
  // Reset
  reset: () => void;
}

const initialState = {
  rawText: "",
  isRecording: false,
  businessWebsite: "",
  businessContext: null,
  themes: [],
  selectedTemplate: null,
  narrative: null,
  highlights: [] as RefinementHighlight[],
  keyClaims: [] as KeyClaim[],
  voiceFeedback: "",
  currentStep: "input" as const,
  isLoading: false,
  loadingMessage: "",
  loadingStage: 0,
  loadingProgress: 0,
  currentSectionIndex: 0,
  viewMode: "present" as ViewMode,
  // Phase 1
  audienceMode: null as AudienceMode | null,
  // Phase 2
  tensions: [] as Tension[],
  includeTensionSlide: false,
  // Phase 3
  selectedArchetype: null as NarrativeArchetype | null,
  // Phase 4
  duration: "full" as NarrativeDuration,
  // Phase 6
  companyBrain: null as CompanyBrain | null,
  // Phase 7
  alternatives: [] as NarrativeAlternative[],
  isGeneratingAlternatives: false,
};

export const useNarrativeStore = create<NarrativeState>((set, get) => ({
  ...initialState,
  
  setRawText: (text) => set({ rawText: text }),
  
  setIsRecording: (recording) => set({ isRecording: recording }),
  
  setBusinessWebsite: (url) => set({ businessWebsite: url }),
  
  setBusinessContext: (context) => set({ businessContext: context }),
  
  setThemes: (themes) => set({ themes }),
  
  toggleThemeKeep: (themeId) => set((state) => ({
    themes: state.themes.map((t) =>
      t.id === themeId ? { ...t, keep: !t.keep } : t
    ),
  })),
  
  setThemePriority: (themeId, priority) => set((state) => ({
    themes: state.themes.map((t) =>
      t.id === themeId ? { ...t, priority } : t
    ),
  })),
  
  setSelectedTemplate: (template) => set({ selectedTemplate: template }),
  
  setNarrative: (narrative) => set({ narrative }),
  
  updateSectionContent: (sectionId, content) => set((state) => ({
    narrative: state.narrative
      ? {
          ...state.narrative,
          sections: state.narrative.sections.map((s) =>
            s.id === sectionId ? { ...s, content } : s
          ),
        }
      : null,
  })),
  
  updateSectionIcon: (sectionId, icon) => set((state) => ({
    narrative: state.narrative
      ? {
          ...state.narrative,
          sections: state.narrative.sections.map((s) =>
            s.id === sectionId ? { ...s, icon } : s
          ),
        }
      : null,
  })),
  
  reorderSections: (fromIndex, toIndex) => set((state) => {
    if (!state.narrative) return state;
    const sections = [...state.narrative.sections];
    const [removed] = sections.splice(fromIndex, 1);
    sections.splice(toIndex, 0, removed);
    return {
      narrative: { ...state.narrative, sections },
    };
  }),
  
  // Refinement actions
  setHighlights: (highlights) => set({ highlights }),
  
  setKeyClaims: (keyClaims) => set({ keyClaims }),
  
  approveClaim: (claimId) => set((state) => ({
    keyClaims: state.keyClaims.map((c) =>
      c.id === claimId ? { ...c, approved: c.approved === true ? null : true } : c
    ),
  })),
  
  rejectClaim: (claimId) => set((state) => ({
    keyClaims: state.keyClaims.map((c) =>
      c.id === claimId ? { ...c, approved: c.approved === false ? null : false } : c
    ),
  })),
  
  updateClaim: (claimId, updates) => set((state) => ({
    keyClaims: state.keyClaims.map((c) =>
      c.id === claimId ? { 
        ...c, 
        ...updates,
        edited: true,
        originalTitle: c.originalTitle ?? c.title,
        originalText: c.originalText ?? c.text,
      } : c
    ),
  })),
  
  setVoiceFeedback: (voiceFeedback) => set({ voiceFeedback }),
  
  setCurrentStep: (step) => set({ currentStep: step }),
  
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  setLoadingMessage: (message) => set({ loadingMessage: message }),
  
  setLoadingStage: (stage) => set({ loadingStage: stage }),
  
  setLoadingProgress: (progress) => set({ loadingProgress: progress }),
  
  setCurrentSectionIndex: (index) => set({ currentSectionIndex: index }),
  
  nextSection: () => set((state) => {
    const maxIndex = state.narrative?.sections.length ?? 0;
    return {
      currentSectionIndex: Math.min(state.currentSectionIndex + 1, maxIndex - 1),
    };
  }),
  
  prevSection: () => set((state) => ({
    currentSectionIndex: Math.max(state.currentSectionIndex - 1, 0),
  })),
  
  setViewMode: (mode) => set({ viewMode: mode }),
  
  // Phase 1: Audience Mode
  setAudienceMode: (mode) => set({ audienceMode: mode }),
  
  // Phase 2: Tensions
  setTensions: (tensions) => set({ tensions }),
  setIncludeTensionSlide: (include) => set({ includeTensionSlide: include }),
  
  // Phase 3: Archetypes
  setSelectedArchetype: (archetype) => set({ selectedArchetype: archetype }),
  
  // Phase 4: Duration
  setDuration: (duration) => set({ duration }),
  
  // Phase 6: Company Brain
  setCompanyBrain: (brain) => set({ companyBrain: brain }),
  
  // Phase 7: Alternatives
  setAlternatives: (alternatives) => set({ alternatives }),
  swapWithAlternative: (alternativeId) => set((state) => {
    const alternative = state.alternatives.find(a => a.id === alternativeId);
    if (!alternative || !state.narrative) return state;
    
    // Store current narrative as an alternative
    const currentAsAlternative: NarrativeAlternative = {
      id: crypto.randomUUID(),
      goal: "alignment",
      goalLabel: "Previous Version",
      rationale: "Your previous narrative",
      narrative: state.narrative,
    };
    
    return {
      narrative: alternative.narrative,
      alternatives: [
        currentAsAlternative,
        ...state.alternatives.filter(a => a.id !== alternativeId),
      ],
    };
  }),
  setIsGeneratingAlternatives: (generating) => set({ isGeneratingAlternatives: generating }),
  
  reset: () => set(initialState),
}));

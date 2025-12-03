import { create } from "zustand";
import { Theme, TemplateName, NarrativeSchema, Priority, BusinessContext } from "@/lib/types";

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
  
  // UI State - Simplified 3-step flow
  currentStep: "input" | "preview" | "present";
  setCurrentStep: (step: "input" | "preview" | "present") => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  loadingMessage: string;
  setLoadingMessage: (message: string) => void;
  
  // Present mode
  currentSectionIndex: number;
  setCurrentSectionIndex: (index: number) => void;
  nextSection: () => void;
  prevSection: () => void;
  
  // View mode
  viewMode: "present" | "reader";
  setViewMode: (mode: "present" | "reader") => void;
  
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
  currentStep: "input" as const,
  isLoading: false,
  loadingMessage: "",
  currentSectionIndex: 0,
  viewMode: "present" as const,
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
  
  setCurrentStep: (step) => set({ currentStep: step }),
  
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  setLoadingMessage: (message) => set({ loadingMessage: message }),
  
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
  
  reset: () => set(initialState),
}));

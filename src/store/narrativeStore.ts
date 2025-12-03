import { create } from "zustand";
import { Theme, TemplateName, NarrativeSchema, Priority } from "@/lib/types";

interface NarrativeState {
  // Input
  rawText: string;
  setRawText: (text: string) => void;
  
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
  
  // UI State
  currentStep: "extract" | "review" | "template" | "editor" | "present";
  setCurrentStep: (step: "extract" | "review" | "template" | "editor" | "present") => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // Present mode
  currentSectionIndex: number;
  setCurrentSectionIndex: (index: number) => void;
  nextSection: () => void;
  prevSection: () => void;
  
  // Reset
  reset: () => void;
}

const initialState = {
  rawText: "",
  themes: [],
  selectedTemplate: null,
  narrative: null,
  currentStep: "extract" as const,
  isLoading: false,
  currentSectionIndex: 0,
};

export const useNarrativeStore = create<NarrativeState>((set, get) => ({
  ...initialState,
  
  setRawText: (text) => set({ rawText: text }),
  
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
  
  reset: () => set(initialState),
}));

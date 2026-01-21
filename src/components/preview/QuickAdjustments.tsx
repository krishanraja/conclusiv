import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Layers, Film, List, Lock, Users, Clock, Paintbrush, Save, Wand2, Minimize2, Maximize2, ShieldAlert, RotateCcw, BookOpen, Loader2 } from "lucide-react";
import { useNarrativeStore } from "@/store/narrativeStore";
import { TemplateName } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useFeatureGate } from "@/components/subscription/FeatureGate";
import { AudienceSelector } from "./AudienceSelector";
import { TensionsExplorer, TensionsExplorerTrigger } from "./TensionsExplorer";
import { DurationSelector } from "./DurationSelector";
import { BrandStyleEditor } from "@/components/editor/BrandStyleEditor";
import { SaveNarrativeDialog } from "./SaveNarrativeDialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type RemixOption = "shorter" | "bolder" | "safer" | "flip" | "plain-english";

const remixOptions: { id: RemixOption; label: string; icon: React.ReactNode; prompt: string }[] = [
  {
    id: "shorter",
    label: "Shorter",
    icon: <Minimize2 className="w-4 h-4" />,
    prompt: "Compress this narrative to only the most essential 3-4 points. Be extremely concise but keep the core message and call to action intact.",
  },
  {
    id: "bolder",
    label: "Bolder",
    icon: <Maximize2 className="w-4 h-4" />,
    prompt: "Rewrite this narrative with more confident, assertive language. Remove hedging words, make claims stronger, and add more conviction to the recommendations.",
  },
  {
    id: "safer",
    label: "Safer",
    icon: <ShieldAlert className="w-4 h-4" />,
    prompt: "Rewrite this narrative with more balanced language. Add appropriate caveats, acknowledge uncertainties, and present a more measured view while keeping the core insights.",
  },
  {
    id: "flip",
    label: "Flip",
    icon: <RotateCcw className="w-4 h-4" />,
    prompt: "Rewrite this narrative from the opposite perspective. If it was optimistic, make it cautionary. If it highlighted opportunities, highlight risks. Maintain factual accuracy but shift the framing entirely.",
  },
  {
    id: "plain-english",
    label: "Simple",
    icon: <BookOpen className="w-4 h-4" />,
    prompt: "Rewrite this narrative in plain English. Replace technical jargon, acronyms, and industry-specific terms with simple, everyday language that anyone can understand.",
  },
];


const templates: { name: TemplateName; label: string; proOnly: boolean }[] = [
  { name: "LinearStoryboard", label: "Linear", proOnly: false },
  { name: "ZoomReveal", label: "Zoom", proOnly: true },
  { name: "FlyoverMap", label: "Flyover", proOnly: true },
  { name: "ContrastSplit", label: "Split", proOnly: true },
  { name: "PriorityLadder", label: "Ladder", proOnly: true },
];

export const QuickAdjustments = () => {
  const [expandedPanel, setExpandedPanel] = useState<string | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [isRemixing, setIsRemixing] = useState<RemixOption | null>(null);
  const [tensionsExplorerOpen, setTensionsExplorerOpen] = useState(false);
  const { toast } = useToast();
  const { 
    themes, 
    toggleThemeKeep, 
    selectedTemplate, 
    setSelectedTemplate, 
    narrative,
    setNarrative,
    rawText,
    audienceMode,
    tensions,
    setIncludeTensionSlide,
    businessContext,
    hasUnsavedChanges,
    originalSettings,
  } = useNarrativeStore();
  const { requireFeature, UpgradePromptComponent, isPro } = useFeatureGate();

  const handleRemix = async (option: typeof remixOptions[0]) => {
    if (!narrative) return;

    setIsRemixing(option.id);

    try {
      const response = await supabase.functions.invoke("build-narrative", {
        body: {
          text: rawText,
          businessContext,
          remixPrompt: option.prompt,
          currentNarrative: narrative,
        },
      });

      if (response.error) throw response.error;

      const result = response.data;
      if (result.narrative) {
        setNarrative(result.narrative);
      }
    } catch (error) {
      console.error("Remix failed:", error);
      toast({
        title: "Remix failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsRemixing(null);
    }
  };
  
  // Check if there are unsaved changes (only if we have original settings to compare against)
  const showSaveButton = originalSettings && hasUnsavedChanges();

  const hasLogo = !!(businessContext?.logoUrl || businessContext?.userUploadedLogoUrl);
  const hasBrandData = !!(businessContext?.brandColors || businessContext?.brandFonts || hasLogo);

  const togglePanel = (panel: string) => {
    setExpandedPanel(expandedPanel === panel ? null : panel);
  };

  const handleTemplateSelect = (template: TemplateName, proOnly: boolean) => {
    if (proOnly && !isPro) {
      requireFeature('template');
      return;
    }
    setSelectedTemplate(template);
  };

  const keptThemesCount = themes.filter((t) => t.keep).length;

  return (
    <>
      {UpgradePromptComponent}
      <div className="space-y-1">
        {/* Audience Panel - NEW */}
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <button
            onClick={() => togglePanel("audience")}
            className="w-full flex items-center justify-between p-3 hover:bg-card/50 transition-colors"
          >
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>Audience</span>
              {audienceMode && (
                <span className="text-xs text-shimmer-start capitalize">
                  ({audienceMode})
                </span>
              )}
            </div>
            <motion.div
              animate={{ rotate: expandedPanel === "audience" ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </button>

          <AnimatePresence>
            {expandedPanel === "audience" && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
              <div className="p-3 pt-0">
                  <AudienceSelector />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Duration Panel - NEW */}
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <button
            onClick={() => togglePanel("duration")}
            className="w-full flex items-center justify-between p-3 hover:bg-card/50 transition-colors"
          >
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>Duration</span>
            </div>
            <motion.div
              animate={{ rotate: expandedPanel === "duration" ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </button>

          <AnimatePresence>
            {expandedPanel === "duration" && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-3 pt-0">
                  <DurationSelector />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tensions - Opens full explorer panel */}
        {tensions.length > 0 && (
          <TensionsExplorerTrigger onClick={() => setTensionsExplorerOpen(true)} />
        )}

        {/* Story Pillars Panel */}
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <button
            onClick={() => togglePanel("storyPillars")}
            className="w-full flex items-center justify-between p-3 hover:bg-card/50 transition-colors"
          >
            <div className="flex items-center gap-2 text-sm">
              <Layers className="w-4 h-4 text-muted-foreground" />
              <span>Story Pillars</span>
              <span className="text-xs text-muted-foreground">({keptThemesCount} selected)</span>
            </div>
            <motion.div
              animate={{ rotate: expandedPanel === "storyPillars" ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </button>

          <AnimatePresence>
            {expandedPanel === "storyPillars" && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-3 pt-0 space-y-2">
                  {themes.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => toggleThemeKeep(theme.id)}
                      className={cn(
                        "w-full flex items-center gap-2 p-2 rounded-md text-sm text-left transition-colors",
                        theme.keep
                          ? "bg-shimmer-start/10 text-foreground"
                          : "bg-card/50 text-muted-foreground"
                      )}
                    >
                      <div
                        className={cn(
                          "w-3 h-3 rounded-full border-2 transition-colors",
                          theme.keep
                            ? "bg-shimmer-start border-shimmer-start"
                            : "border-muted-foreground"
                        )}
                      />
                      <span className="truncate">{theme.name}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Animation Panel */}
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <button
            onClick={() => togglePanel("animation")}
            className="w-full flex items-center justify-between p-3 hover:bg-card/50 transition-colors"
          >
            <div className="flex items-center gap-2 text-sm">
              <Film className="w-4 h-4 text-muted-foreground" />
              <span>Animation</span>
              <span className="text-xs text-muted-foreground">
                {templates.find((t) => t.name === selectedTemplate)?.label}
              </span>
            </div>
            <motion.div
              animate={{ rotate: expandedPanel === "animation" ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </button>

          <AnimatePresence>
            {expandedPanel === "animation" && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-3 pt-0 flex flex-wrap gap-2">
                  {templates.map((template) => (
                    <button
                      key={template.name}
                      onClick={() => handleTemplateSelect(template.name, template.proOnly)}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-xs transition-colors flex items-center gap-1",
                        selectedTemplate === template.name
                          ? "bg-shimmer-start/20 text-shimmer-start border border-shimmer-start/30"
                          : "bg-card text-muted-foreground hover:text-foreground",
                        template.proOnly && !isPro && "opacity-60"
                      )}
                    >
                      {template.label}
                      {template.proOnly && !isPro && <Lock className="w-3 h-3 opacity-50" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Brand Style Panel - NEW */}
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <button
            onClick={() => togglePanel("brandStyle")}
            className="w-full flex items-center justify-between p-3 hover:bg-card/50 transition-colors"
          >
            <div className="flex items-center gap-2 text-sm">
              <Paintbrush className="w-4 h-4 text-muted-foreground" />
              <span>Brand Style</span>
              {hasBrandData && (
                <span className="text-xs text-shimmer-start">customized</span>
              )}
            </div>
            <motion.div
              animate={{ rotate: expandedPanel === "brandStyle" ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </button>

          <AnimatePresence>
            {expandedPanel === "brandStyle" && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-3 pt-0">
                  <BrandStyleEditor />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sections Panel */}
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <button
            onClick={() => togglePanel("sections")}
            className="w-full flex items-center justify-between p-3 hover:bg-card/50 transition-colors"
          >
            <div className="flex items-center gap-2 text-sm">
              <List className="w-4 h-4 text-muted-foreground" />
              <span>Sections</span>
              <span className="text-xs text-muted-foreground">
                ({narrative?.sections.length || 0})
              </span>
            </div>
            <motion.div
              animate={{ rotate: expandedPanel === "sections" ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </button>

          <AnimatePresence>
            {expandedPanel === "sections" && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-3 pt-0 space-y-1">
                  {narrative?.sections.map((section, index) => (
                    <div
                      key={section.id}
                      className="flex items-center gap-2 p-2 rounded-md bg-card/50 text-sm"
                    >
                      <span className="text-xs text-muted-foreground w-4">{index + 1}</span>
                      <span className="truncate">{section.title}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Remix Panel - Mobile-friendly quick transforms */}
        <div className="lg:hidden rounded-lg border border-border/50 overflow-hidden">
          <button
            onClick={() => togglePanel("remix")}
            className="w-full flex items-center justify-between p-3 hover:bg-card/50 transition-colors"
          >
            <div className="flex items-center gap-2 text-sm">
              <Wand2 className="w-4 h-4 text-primary" />
              <span>Remix</span>
              {isRemixing && (
                <Loader2 className="w-3 h-3 animate-spin text-primary" />
              )}
            </div>
            <motion.div
              animate={{ rotate: expandedPanel === "remix" ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </button>

          <AnimatePresence>
            {expandedPanel === "remix" && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-3 pt-0">
                  <p className="text-xs text-muted-foreground mb-3">
                    Transform your narrative style
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {remixOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleRemix(option)}
                        disabled={isRemixing !== null || !narrative}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-2.5 rounded-lg border transition-all",
                          "hover:bg-primary/5 hover:border-primary/30",
                          isRemixing === option.id 
                            ? "bg-primary/10 border-primary/40" 
                            : "border-border/50 bg-card/30",
                          (isRemixing !== null && isRemixing !== option.id) && "opacity-50"
                        )}
                      >
                        {isRemixing === option.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        ) : (
                          <span className="text-muted-foreground">{option.icon}</span>
                        )}
                        <span className="text-[10px] font-medium text-foreground">
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Save Button - appears when changes are detected */}
        <AnimatePresence>
          {showSaveButton && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
              className="pt-4 mt-2 sticky bottom-0 z-feedback bg-gradient-to-t from-background/100 via-background/95 to-background/0 pb-2"
            >
              {/* Visual emphasis border */}
              <div className="rounded-lg border-2 border-shimmer-start/50 p-3 bg-shimmer-start/5">
                <motion.div
                  animate={{ 
                    boxShadow: [
                      "0 0 0 0 rgba(110, 231, 183, 0.4)",
                      "0 0 0 8px rgba(110, 231, 183, 0)",
                    ]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="rounded-lg"
                >
                  <Button
                    onClick={() => setSaveDialogOpen(true)}
                    className="w-full gap-2 bg-shimmer-start hover:bg-shimmer-start/90 text-background font-medium"
                    size="lg"
                  >
                    <Save className="w-4 h-4" />
                    Save & Regenerate
                  </Button>
                </motion.div>
                <p className="text-xs text-shimmer-start text-center mt-2 font-medium">
                  Your narrative will be regenerated with these changes
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Save Dialog */}
      <SaveNarrativeDialog 
        open={saveDialogOpen} 
        onOpenChange={setSaveDialogOpen} 
      />

      {/* Tensions Explorer Panel */}
      <TensionsExplorer 
        isOpen={tensionsExplorerOpen} 
        onClose={() => setTensionsExplorerOpen(false)} 
      />
    </>
  );
};

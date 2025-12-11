import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Layers, Layout, List, Lock, Users, AlertTriangle, Clock, RefreshCw } from "lucide-react";
import { useNarrativeStore } from "@/store/narrativeStore";
import { TemplateName } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useFeatureGate } from "@/components/subscription/FeatureGate";
import { AudienceSelector } from "./AudienceSelector";
import { TensionCard } from "./TensionCard";
import { DurationSelector } from "./DurationSelector";
import { useToast } from "@/hooks/use-toast";

const templates: { name: TemplateName; label: string; proOnly: boolean }[] = [
  { name: "LinearStoryboard", label: "Linear", proOnly: false },
  { name: "ZoomReveal", label: "Zoom", proOnly: true },
  { name: "FlyoverMap", label: "Flyover", proOnly: true },
  { name: "ContrastSplit", label: "Split", proOnly: true },
  { name: "PriorityLadder", label: "Ladder", proOnly: true },
];

export const QuickAdjustments = () => {
  const [expandedPanel, setExpandedPanel] = useState<string | null>(null);
  const [settingsChanged, setSettingsChanged] = useState(false);
  const { toast } = useToast();
  const { 
    themes, 
    toggleThemeKeep, 
    selectedTemplate, 
    setSelectedTemplate, 
    narrative,
    audienceMode,
    tensions,
    setIncludeTensionSlide,
  } = useNarrativeStore();
  const { requireFeature, UpgradePromptComponent, isPro } = useFeatureGate();

  const togglePanel = (panel: string) => {
    setExpandedPanel(expandedPanel === panel ? null : panel);
  };

  const handleSettingChange = (setting: string) => {
    setSettingsChanged(true);
    toast({
      title: "Setting updated",
      description: (
        <span className="flex items-center gap-2">
          <RefreshCw className="w-3 h-3" />
          Click "Rebuild" to apply {setting.toLowerCase()} changes
        </span>
      ),
    });
  };

  const handleTemplateSelect = (template: TemplateName, proOnly: boolean) => {
    if (proOnly && !isPro) {
      requireFeature('template');
      return;
    }
    setSelectedTemplate(template);
    handleSettingChange("Template");
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
                  <AudienceSelector onSelect={() => handleSettingChange("Audience")} />
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
                  <DurationSelector onSelect={() => handleSettingChange("Duration")} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tensions Panel - NEW */}
        {tensions.length > 0 && (
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <button
              onClick={() => togglePanel("tensions")}
              className="w-full flex items-center justify-between p-3 hover:bg-card/50 transition-colors"
            >
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Tensions</span>
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-400">
                  {tensions.length}
                </span>
              </div>
              <motion.div
                animate={{ rotate: expandedPanel === "tensions" ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            </button>

            <AnimatePresence>
              {expandedPanel === "tensions" && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 pt-0 space-y-2 max-h-64 overflow-y-auto">
                    {tensions.map((tension) => (
                      <TensionCard 
                        key={tension.id} 
                        tension={tension}
                        onAddToNarrative={() => setIncludeTensionSlide(true)}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Themes Panel */}
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <button
            onClick={() => togglePanel("themes")}
            className="w-full flex items-center justify-between p-3 hover:bg-card/50 transition-colors"
          >
            <div className="flex items-center gap-2 text-sm">
              <Layers className="w-4 h-4 text-muted-foreground" />
              <span>Themes</span>
              <span className="text-xs text-muted-foreground">({keptThemesCount} selected)</span>
            </div>
            <motion.div
              animate={{ rotate: expandedPanel === "themes" ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </button>

          <AnimatePresence>
            {expandedPanel === "themes" && (
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

        {/* Template Panel */}
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <button
            onClick={() => togglePanel("template")}
            className="w-full flex items-center justify-between p-3 hover:bg-card/50 transition-colors"
          >
            <div className="flex items-center gap-2 text-sm">
              <Layout className="w-4 h-4 text-muted-foreground" />
              <span>Template</span>
              <span className="text-xs text-muted-foreground">
                {templates.find((t) => t.name === selectedTemplate)?.label}
              </span>
            </div>
            <motion.div
              animate={{ rotate: expandedPanel === "template" ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </button>

          <AnimatePresence>
            {expandedPanel === "template" && (
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
      </div>
    </>
  );
};

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Play, 
  Layers, 
  Type, 
  Image, 
  GripVertical,
  Save,
  Share2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useNarrativeStore } from "@/store/narrativeStore";
import { cn } from "@/lib/utils";
import { NarrativeCanvas } from "./NarrativeCanvas";
import { IconPicker } from "./IconPicker";
import { availableIcons } from "@/lib/icons";

export const EditorScreen = () => {
  const { 
    narrative, 
    setCurrentStep, 
    updateSectionContent,
    updateSectionIcon,
  } = useNarrativeStore();

  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    narrative?.sections[0]?.id || null
  );
  const [showIconPicker, setShowIconPicker] = useState(false);

  if (!narrative) return null;

  const selectedSection = narrative.sections.find(s => s.id === selectedSectionId);

  return (
    <div className="min-h-screen pt-16 flex flex-col">
      {/* Editor Header */}
      <div className="h-14 glass-strong border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentStep("template")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Templates
          </Button>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <span className="font-display font-medium text-foreground">
              {narrative.template}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="glass" size="sm">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button variant="glass" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button 
            variant="hero" 
            size="sm"
            onClick={() => setCurrentStep("present")}
          >
            <Play className="w-4 h-4 mr-2" />
            Present
          </Button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 flex">
        {/* Left Sidebar - Section List */}
        <div className="w-64 border-r border-border glass-strong overflow-y-auto">
          <div className="p-3 border-b border-border">
            <h3 className="font-display font-semibold text-sm text-foreground">
              Sections
            </h3>
            <p className="text-xs text-muted-foreground">
              {narrative.sections.length} sections
            </p>
          </div>
          
          <div className="p-2 space-y-1">
            {narrative.sections.map((section, index) => (
              <button
                key={section.id}
                onClick={() => setSelectedSectionId(section.id)}
                className={cn(
                  "w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all",
                  selectedSectionId === section.id 
                    ? "bg-primary/10 border border-primary/30" 
                    : "hover:bg-secondary"
                )}
              >
                <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                <span className="text-xs text-muted-foreground w-5">{index + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {section.title}
                  </p>
                </div>
                <ChevronRight className={cn(
                  "w-4 h-4 transition-transform",
                  selectedSectionId === section.id ? "text-primary rotate-90" : "text-muted-foreground"
                )} />
              </button>
            ))}
          </div>
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 narrative-canvas overflow-hidden relative">
          <NarrativeCanvas 
            narrative={narrative} 
            selectedSectionId={selectedSectionId}
            onSelectSection={setSelectedSectionId}
          />
        </div>

        {/* Right Sidebar - Editor Panel */}
        <div className="w-80 border-l border-border glass-strong overflow-y-auto">
          <AnimatePresence mode="wait">
            {selectedSection ? (
              <motion.div
                key={selectedSection.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-4 space-y-4"
              >
                <div>
                  <h3 className="font-display font-semibold text-foreground mb-1">
                    {selectedSection.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Edit content for this section
                  </p>
                </div>

                {/* Content Editor */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <Type className="w-4 h-4" />
                    Content
                  </label>
                  <Textarea
                    value={selectedSection.content || ""}
                    onChange={(e) => updateSectionContent(selectedSection.id, e.target.value)}
                    placeholder="Enter section content..."
                    className="min-h-[120px] bg-background/50 border-border/50"
                  />
                </div>

                {/* Items List */}
                {selectedSection.items && selectedSection.items.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Key Points
                    </label>
                    <div className="space-y-2">
                      {selectedSection.items.map((item, i) => (
                        <div key={i} className="p-2 rounded-lg bg-background/50 border border-border/50">
                          <p className="text-sm text-foreground">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Icon Picker */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                    <Image className="w-4 h-4" />
                    Icon
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    className="w-full justify-start"
                  >
                    Current: {selectedSection.icon}
                  </Button>
                  
                  {showIconPicker && (
                    <IconPicker
                      selectedIcon={selectedSection.icon}
                      onSelect={(icon) => {
                        updateSectionIcon(selectedSection.id, icon);
                        setShowIconPicker(false);
                      }}
                      icons={availableIcons}
                    />
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                Select a section to edit
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

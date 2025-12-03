import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Play, 
  Type,
  GripVertical,
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
    <div className="min-h-screen pt-14 flex flex-col">
      {/* Editor Header */}
      <div className="h-12 border-b border-border/40 flex items-center justify-between px-4 bg-background/80 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentStep("template")}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>

        <Button 
          variant="shimmer" 
          size="sm"
          onClick={() => setCurrentStep("present")}
        >
          <Play className="w-4 h-4 mr-1" />
          Present
        </Button>
      </div>

      {/* Editor Body */}
      <div className="flex-1 flex">
        {/* Left Sidebar - Section List */}
        <div className="w-56 border-r border-border/40 bg-card/30 overflow-y-auto">
          <div className="p-3 border-b border-border/30">
            <span className="text-xs text-muted-foreground">
              {narrative.sections.length} sections
            </span>
          </div>
          
          <div className="p-2 space-y-1">
            {narrative.sections.map((section, index) => (
              <button
                key={section.id}
                onClick={() => setSelectedSectionId(section.id)}
                className={cn(
                  "w-full flex items-center gap-2 p-2 rounded-md text-left transition-all",
                  selectedSectionId === section.id 
                    ? "bg-primary/10 border border-primary/30" 
                    : "hover:bg-secondary/50"
                )}
              >
                <GripVertical className="w-3 h-3 text-muted-foreground/50" />
                <span className="text-xs text-muted-foreground w-4">{index + 1}</span>
                <p className="text-sm text-foreground truncate flex-1">
                  {section.title}
                </p>
                <ChevronRight className={cn(
                  "w-3 h-3 transition-transform",
                  selectedSectionId === section.id ? "text-primary rotate-90" : "text-muted-foreground/50"
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
        <div className="w-72 border-l border-border/40 bg-card/30 overflow-y-auto">
          <AnimatePresence mode="wait">
            {selectedSection ? (
              <motion.div
                key={selectedSection.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="p-4 space-y-4"
              >
                <h3 className="font-medium text-foreground text-sm">
                  {selectedSection.title}
                </h3>

                {/* Content Editor */}
                <div>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Type className="w-3 h-3" />
                    Content
                  </label>
                  <Textarea
                    value={selectedSection.content || ""}
                    onChange={(e) => updateSectionContent(selectedSection.id, e.target.value)}
                    placeholder="Enter content..."
                    className="min-h-[100px] bg-background/50 border-border/40 text-sm"
                  />
                </div>

                {/* Items List */}
                {selectedSection.items && selectedSection.items.length > 0 && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block">
                      Points
                    </label>
                    <div className="space-y-1">
                      {selectedSection.items.map((item, i) => (
                        <div key={i} className="p-2 rounded-md bg-background/50 border border-border/30">
                          <p className="text-xs text-muted-foreground">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Icon Picker */}
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    className="w-full justify-start text-xs"
                  >
                    Icon: {selectedSection.icon}
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
              <div className="p-4 text-center text-xs text-muted-foreground">
                Select a section
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
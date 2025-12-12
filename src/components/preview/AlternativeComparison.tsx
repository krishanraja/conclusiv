import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNarrativeStore } from "@/store/narrativeStore";
import { GitCompare, ArrowLeftRight, Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { iconMap } from "@/lib/icons";
import type { NarrativeAlternative, NarrativeSection } from "@/lib/types";

interface AlternativeComparisonProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AlternativeComparison = ({ isOpen, onClose }: AlternativeComparisonProps) => {
  const { narrative, alternatives, swapWithAlternative } = useNarrativeStore();
  const [selectedAlternative, setSelectedAlternative] = useState<NarrativeAlternative | null>(
    alternatives[0] || null
  );
  const [activeSection, setActiveSection] = useState(0);

  if (!isOpen || !narrative || alternatives.length === 0) return null;

  const currentSection = narrative.sections[activeSection];
  const altSection = selectedAlternative?.narrative.sections[activeSection];

  const handleSwap = () => {
    if (selectedAlternative) {
      swapWithAlternative(selectedAlternative.id);
      onClose();
    }
  };

  const findDifferences = (current: NarrativeSection, alt: NarrativeSection | undefined) => {
    if (!alt) return { titleDiff: true, contentDiff: true, itemsDiff: true };
    
    return {
      titleDiff: current.title !== alt.title,
      contentDiff: current.content !== alt.content,
      itemsDiff: JSON.stringify(current.items) !== JSON.stringify(alt.items),
    };
  };

  const diffs = findDifferences(currentSection, altSection);
  const hasDifferences = diffs.titleDiff || diffs.contentDiff || diffs.itemsDiff;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm"
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <GitCompare className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Compare Narratives</h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Alternative selector */}
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
              {alternatives.map((alt) => (
                <button
                  key={alt.id}
                  onClick={() => setSelectedAlternative(alt)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                    selectedAlternative?.id === alt.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {alt.goalLabel}
                </button>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Section navigation */}
        <div className="flex items-center justify-center gap-2 p-4 bg-muted/20 border-b border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
            disabled={activeSection === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-1">
            {narrative.sections.map((section, idx) => {
              const sectionDiffs = findDifferences(
                section,
                selectedAlternative?.narrative.sections[idx]
              );
              const sectionHasDiff = sectionDiffs.titleDiff || sectionDiffs.contentDiff || sectionDiffs.itemsDiff;
              
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(idx)}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                    idx === activeSection
                      ? "bg-primary text-primary-foreground"
                      : sectionHasDiff
                      ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveSection(Math.min(narrative.sections.length - 1, activeSection + 1))}
            disabled={activeSection === narrative.sections.length - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Comparison view */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full grid grid-cols-2 divide-x divide-border">
            {/* Current narrative */}
            <div className="p-6 overflow-y-auto">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm font-medium">Current Version</span>
              </div>
              <SectionDisplay 
                section={currentSection} 
                diffs={diffs}
                side="current"
              />
            </div>

            {/* Alternative narrative */}
            <div className="p-6 overflow-y-auto bg-muted/10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm font-medium">{selectedAlternative?.goalLabel || "Alternative"}</span>
              </div>
              {altSection ? (
                <SectionDisplay 
                  section={altSection} 
                  diffs={diffs}
                  side="alternative"
                />
              ) : (
                <div className="text-muted-foreground text-center py-8">
                  No corresponding section in this alternative
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border bg-muted/30">
          <div className="text-sm text-muted-foreground">
            {hasDifferences ? (
              <span className="text-orange-400">⚡ Differences detected in this section</span>
            ) : (
              <span className="text-green-400">✓ Sections are identical</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onClose}>
              Keep Current
            </Button>
            <Button onClick={handleSwap}>
              <ArrowLeftRight className="w-4 h-4 mr-2" />
              Swap to {selectedAlternative?.goalLabel}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

interface SectionDisplayProps {
  section: NarrativeSection;
  diffs: { titleDiff: boolean; contentDiff: boolean; itemsDiff: boolean };
  side: "current" | "alternative";
}

const SectionDisplay = ({ section, diffs, side }: SectionDisplayProps) => {
  const Icon = iconMap[section.icon] || null;

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className={cn(
        "p-3 rounded-lg",
        diffs.titleDiff && (side === "current" ? "bg-red-500/10 border border-red-500/30" : "bg-green-500/10 border border-green-500/30")
      )}>
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
          )}
          <h3 className="text-xl font-semibold">{section.title}</h3>
        </div>
        {diffs.titleDiff && (
          <div className="mt-2 flex items-center gap-1 text-xs">
            {side === "current" ? (
              <X className="w-3 h-3 text-red-400" />
            ) : (
              <Check className="w-3 h-3 text-green-400" />
            )}
            <span className={side === "current" ? "text-red-400" : "text-green-400"}>
              {side === "current" ? "Will be replaced" : "New title"}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      {section.content && (
        <div className={cn(
          "p-3 rounded-lg",
          diffs.contentDiff && (side === "current" ? "bg-red-500/10 border border-red-500/30" : "bg-green-500/10 border border-green-500/30")
        )}>
          <p className="text-muted-foreground leading-relaxed">{section.content}</p>
          {diffs.contentDiff && (
            <div className="mt-2 flex items-center gap-1 text-xs">
              {side === "current" ? (
                <X className="w-3 h-3 text-red-400" />
              ) : (
                <Check className="w-3 h-3 text-green-400" />
              )}
              <span className={side === "current" ? "text-red-400" : "text-green-400"}>
                {side === "current" ? "Content differs" : "New content"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Items */}
      {section.items && section.items.length > 0 && (
        <div className={cn(
          "p-3 rounded-lg",
          diffs.itemsDiff && (side === "current" ? "bg-red-500/10 border border-red-500/30" : "bg-green-500/10 border border-green-500/30")
        )}>
          <ul className="space-y-2">
            {section.items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <span className="text-foreground/80">{item}</span>
              </li>
            ))}
          </ul>
          {diffs.itemsDiff && (
            <div className="mt-2 flex items-center gap-1 text-xs">
              {side === "current" ? (
                <X className="w-3 h-3 text-red-400" />
              ) : (
                <Check className="w-3 h-3 text-green-400" />
              )}
              <span className={side === "current" ? "text-red-400" : "text-green-400"}>
                {side === "current" ? "Items differ" : "New items"}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
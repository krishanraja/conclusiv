import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Target, FileCheck, TrendingUp, Rocket, Search, GitBranch, Users, Shield, Info } from "lucide-react";
import { useNarrativeStore } from "@/store/narrativeStore";
import { NarrativeArchetype } from "@/lib/types";
import { archetypeList } from "@/lib/archetypes";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const iconMap: Record<string, React.ElementType> = {
  Target,
  FileCheck,
  TrendingUp,
  Rocket,
  Search,
  GitBranch,
  Users,
  Shield,
};

export const ArchetypeSelector = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { selectedArchetype, setSelectedArchetype } = useNarrativeStore();

  const selectedConfig = selectedArchetype 
    ? archetypeList.find(a => a.key === selectedArchetype) 
    : null;

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50 hover:bg-card/70 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Story type:</span>
          <span className="text-foreground font-medium">
            {selectedConfig?.name || "Auto-detect"}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
              {/* Auto-detect option */}
              <button
                onClick={() => {
                  setSelectedArchetype(null);
                  setIsExpanded(false);
                }}
                className={cn(
                  "p-3 rounded-lg border text-left transition-all",
                  !selectedArchetype
                    ? "bg-shimmer-start/10 border-shimmer-start/30 text-shimmer-start"
                    : "bg-card/50 border-border/50 text-muted-foreground hover:text-foreground hover:bg-card"
                )}
              >
                <div className="w-8 h-8 rounded-lg bg-background/50 flex items-center justify-center mb-2">
                  <span className="text-lg">✨</span>
                </div>
                <h4 className="text-xs font-medium">Auto-detect</h4>
                <p className="text-[10px] opacity-70 mt-0.5">Let AI choose</p>
              </button>

              {/* Archetype options */}
              {archetypeList.map((archetype) => {
                const Icon = iconMap[archetype.icon] || Target;
                const isSelected = selectedArchetype === archetype.key;

                return (
                  <TooltipProvider key={archetype.key}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => {
                            setSelectedArchetype(archetype.key);
                            setIsExpanded(false);
                          }}
                          className={cn(
                            "p-3 rounded-lg border text-left transition-all relative group",
                            isSelected
                              ? "bg-shimmer-start/10 border-shimmer-start/30 text-shimmer-start"
                              : "bg-card/50 border-border/50 text-muted-foreground hover:text-foreground hover:bg-card"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center mb-2",
                            isSelected ? "bg-shimmer-start/20" : "bg-background/50"
                          )}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <h4 className="text-xs font-medium">{archetype.name}</h4>
                          <p className="text-[10px] opacity-70 mt-0.5 line-clamp-1">{archetype.bestFor}</p>
                          
                          {/* Preview indicator */}
                          <Info className="absolute top-2 right-2 w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs p-3">
                        <p className="font-medium text-xs mb-2">{archetype.name} structure:</p>
                        <ol className="text-[10px] space-y-0.5 text-muted-foreground">
                          {archetype.sectionStructure.map((section, i) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <span className="w-4 h-4 rounded-full bg-shimmer-start/20 text-shimmer-start flex items-center justify-center text-[8px] flex-shrink-0">
                                {i + 1}
                              </span>
                              {section}
                            </li>
                          ))}
                        </ol>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

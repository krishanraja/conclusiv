import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Target, FileCheck, TrendingUp, Rocket, Search, GitBranch, Users, Shield, Info } from "lucide-react";
import { useNarrativeStore } from "@/store/narrativeStore";
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
    <div className="w-full">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <Target className="w-4 h-4" />
        <span>Story type:</span>
        <span className="text-foreground font-medium">
          {selectedConfig?.name || "Auto-detect"}
        </span>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4" />
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-3">
              {/* Auto-detect option */}
              <button
                onClick={() => {
                  setSelectedArchetype(null);
                  setIsExpanded(false);
                }}
                className={cn(
                  "p-2.5 rounded-lg border text-left transition-all",
                  !selectedArchetype
                    ? "bg-shimmer-start/10 border-shimmer-start/30 text-shimmer-start"
                    : "bg-card/30 border-border/50 text-muted-foreground hover:text-foreground hover:bg-card/50"
                )}
              >
                <div className="w-7 h-7 rounded-lg bg-background/50 flex items-center justify-center mb-1.5">
                  <span className="text-base">✨</span>
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
                            "p-2.5 rounded-lg border text-left transition-all relative group",
                            isSelected
                              ? "bg-shimmer-start/10 border-shimmer-start/30 text-shimmer-start"
                              : "bg-card/30 border-border/50 text-muted-foreground hover:text-foreground hover:bg-card/50"
                          )}
                        >
                          <div className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center mb-1.5",
                            isSelected ? "bg-shimmer-start/20" : "bg-background/50"
                          )}>
                            <Icon className="w-3.5 h-3.5" />
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

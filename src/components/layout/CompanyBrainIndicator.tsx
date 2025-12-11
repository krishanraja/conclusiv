import { Brain } from "lucide-react";
import { useNarrativeStore } from "@/store/narrativeStore";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export const CompanyBrainIndicator = () => {
  const { companyBrain } = useNarrativeStore();

  if (!companyBrain) return null;

  const narrativeCount = companyBrain.narrative_count || 0;
  const hasLearned = narrativeCount > 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors",
            hasLearned 
              ? "bg-shimmer-start/10 text-shimmer-start" 
              : "bg-card text-muted-foreground"
          )}>
            <Brain className={cn("w-3.5 h-3.5", hasLearned && "animate-pulse")} />
            <span className="hidden sm:inline">
              {hasLearned ? `Learning (${narrativeCount})` : "Brain Active"}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">
            {hasLearned 
              ? `Company brain has learned from ${narrativeCount} narrative${narrativeCount > 1 ? 's' : ''}`
              : "Company brain is active and will learn from your narratives"
            }
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

import { motion } from "framer-motion";
import { Crown, Package, TrendingUp, Users, Settings, Target } from "lucide-react";
import { useNarrativeStore } from "@/store/narrativeStore";
import { AudienceMode, audienceDescriptions } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const iconMap: Record<string, React.ElementType> = {
  Crown,
  Package,
  TrendingUp,
  Users,
  Settings,
  Target,
};

const audiences: AudienceMode[] = ["exec", "product", "investors", "clients", "ops", "briefing"];

export const AudienceSelector = () => {
  const { audienceMode, setAudienceMode } = useNarrativeStore();

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-1.5">
        {audiences.map((mode) => {
          const config = audienceDescriptions[mode];
          const Icon = iconMap[config.icon];
          const isSelected = audienceMode === mode;

          return (
            <Tooltip key={mode}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setAudienceMode(isSelected ? null : mode)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-all",
                    isSelected
                      ? "bg-shimmer-start/20 text-shimmer-start border border-shimmer-start/30"
                      : "bg-card/50 text-muted-foreground hover:text-foreground hover:bg-card"
                  )}
                >
                  {Icon && <Icon className="w-3 h-3" />}
                  <span>{config.label}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {config.description}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

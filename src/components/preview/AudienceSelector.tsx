import { motion, AnimatePresence } from "framer-motion";
import { Crown, Package, TrendingUp, Users, Settings, Target, RefreshCw } from "lucide-react";
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

interface AudienceSelectorProps {
  onSelect?: () => void;
  showRegenerationHint?: boolean;
}

export const AudienceSelector = ({ onSelect, showRegenerationHint = true }: AudienceSelectorProps) => {
  const { audienceMode, setAudienceMode, hasUnsavedChanges, originalSettings } = useNarrativeStore();
  
  // Check if audience specifically changed from original
  const audienceChanged = originalSettings && audienceMode !== originalSettings.audienceMode;

  return (
    <TooltipProvider>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {audiences.map((mode) => {
            const config = audienceDescriptions[mode];
            const Icon = iconMap[config.icon];
            const isSelected = audienceMode === mode;

            return (
              <Tooltip key={mode}>
                <TooltipTrigger asChild>
                  <motion.button
                    onClick={() => {
                      setAudienceMode(isSelected ? null : mode);
                      onSelect?.();
                    }}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-all",
                      isSelected
                        ? "bg-shimmer-start/20 text-shimmer-start border border-shimmer-start/30"
                        : "bg-card/50 text-muted-foreground hover:text-foreground hover:bg-card"
                    )}
                    whileTap={{ scale: 0.95 }}
                  >
                    {Icon && <Icon className="w-3 h-3" />}
                    <span>{config.label}</span>
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {config.description}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        
        {/* Regeneration hint when audience changes */}
        <AnimatePresence>
          {showRegenerationHint && audienceChanged && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-1.5 text-xs text-amber-500 bg-amber-500/10 px-2 py-1.5 rounded-md border border-amber-500/20"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Click "Save Changes" below to regenerate narrative for this audience</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
};

import { motion } from "framer-motion";
import { AlertTriangle, Eye, Lightbulb, GitBranch, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { useState } from "react";
import { Tension, TensionType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const typeConfig: Record<TensionType, { icon: React.ElementType; label: string; color: string }> = {
  contradiction: { icon: AlertTriangle, label: "Contradiction", color: "text-red-400 bg-red-400/10 border-red-400/30" },
  blind_spot: { icon: Eye, label: "Blind Spot", color: "text-amber-400 bg-amber-400/10 border-amber-400/30" },
  hidden_risk: { icon: AlertTriangle, label: "Hidden Risk", color: "text-orange-400 bg-orange-400/10 border-orange-400/30" },
  strategic_option: { icon: GitBranch, label: "Strategic Option", color: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
};

const severityColors = {
  low: "border-l-emerald-400",
  medium: "border-l-amber-400",
  high: "border-l-red-400",
};

interface TensionCardProps {
  tension: Tension;
  onAddToNarrative?: () => void;
}

export const TensionCard = ({ tension, onAddToNarrative }: TensionCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = typeConfig[tension.type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-lg border bg-card/50 overflow-hidden border-l-4",
        severityColors[tension.severity]
      )}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 text-left"
      >
        <div className="flex items-start gap-2">
          <div className={cn("p-1.5 rounded-md border", config.color)}>
            <Icon className="w-3 h-3" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", config.color)}>
                {config.label}
              </span>
              <span className="text-[10px] text-muted-foreground capitalize">
                {tension.severity} severity
              </span>
            </div>
            <h4 className="text-sm font-medium text-foreground line-clamp-2">
              {tension.title}
            </h4>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          )}
        </div>
      </button>

      {isExpanded && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: "auto" }}
          exit={{ height: 0 }}
          className="px-3 pb-3"
        >
          <div className="space-y-3 pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {tension.description}
            </p>

            {(tension.sourceA || tension.sourceB) && (
              <div className="flex gap-2 text-[10px]">
                {tension.sourceA && (
                  <span className="px-2 py-1 rounded bg-background text-muted-foreground">
                    "{tension.sourceA}"
                  </span>
                )}
                {tension.sourceB && (
                  <>
                    <span className="text-muted-foreground">vs</span>
                    <span className="px-2 py-1 rounded bg-background text-muted-foreground">
                      "{tension.sourceB}"
                    </span>
                  </>
                )}
              </div>
            )}

            <div className="flex items-start gap-2 p-2 rounded-md bg-shimmer-start/5 border border-shimmer-start/20">
              <Lightbulb className="w-3 h-3 text-shimmer-start flex-shrink-0 mt-0.5" />
              <p className="text-xs text-shimmer-start">
                {tension.recommendation}
              </p>
            </div>

            {onAddToNarrative && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onAddToNarrative}
                className="w-full text-xs h-7"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add "Tension" slide
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

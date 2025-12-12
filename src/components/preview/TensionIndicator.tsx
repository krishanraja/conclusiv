import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Info, AlertCircle } from "lucide-react";
import { Tension, TensionSeverity } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TensionIndicatorProps {
  tension: Tension;
  compact?: boolean;
}

const severityConfig: Record<TensionSeverity, { icon: typeof AlertTriangle; color: string; bgColor: string }> = {
  high: { 
    icon: AlertCircle, 
    color: "text-destructive", 
    bgColor: "bg-destructive/10 hover:bg-destructive/20" 
  },
  medium: { 
    icon: AlertTriangle, 
    color: "text-amber-500", 
    bgColor: "bg-amber-500/10 hover:bg-amber-500/20" 
  },
  low: { 
    icon: Info, 
    color: "text-blue-400", 
    bgColor: "bg-blue-400/10 hover:bg-blue-400/20" 
  },
};

export const TensionIndicator = ({ tension, compact = false }: TensionIndicatorProps) => {
  const config = severityConfig[tension.severity];
  const Icon = config.icon;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cn(
                "inline-flex items-center justify-center w-5 h-5 rounded-full cursor-pointer transition-colors",
                config.bgColor
              )}
            >
              <Icon className={cn("w-3 h-3", config.color)} />
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="font-medium text-sm">{tension.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{tension.description}</p>
            <p className="text-xs text-primary mt-2">💡 {tension.recommendation}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-lg p-3 border transition-colors",
        config.bgColor,
        "border-border/50"
      )}
    >
      <div className="flex items-start gap-2">
        <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", config.color)} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{tension.title}</p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tension.description}</p>
          <p className="text-xs text-primary mt-2 flex items-center gap-1">
            <span>💡</span>
            <span className="line-clamp-1">{tension.recommendation}</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

interface InlineTensionBadgeProps {
  tensions: Tension[];
  sectionTitle: string;
}

export const InlineTensionBadge = ({ tensions, sectionTitle }: InlineTensionBadgeProps) => {
  // Find tensions that might relate to this section
  const relevantTensions = tensions.filter(t => 
    t.title.toLowerCase().includes(sectionTitle.toLowerCase()) ||
    t.description.toLowerCase().includes(sectionTitle.toLowerCase()) ||
    sectionTitle.toLowerCase().includes(t.title.toLowerCase().split(' ')[0])
  );

  if (relevantTensions.length === 0) return null;

  const highestSeverity = relevantTensions.reduce((highest, t) => {
    const order: TensionSeverity[] = ['low', 'medium', 'high'];
    return order.indexOf(t.severity) > order.indexOf(highest) ? t.severity : highest;
  }, 'low' as TensionSeverity);

  const config = severityConfig[highestSeverity];
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs cursor-pointer transition-colors",
              config.bgColor
            )}
          >
            <Icon className={cn("w-3 h-3", config.color)} />
            <span className={config.color}>
              {relevantTensions.length} tension{relevantTensions.length > 1 ? 's' : ''}
            </span>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-sm">
          <div className="space-y-2">
            {relevantTensions.map((t) => (
              <div key={t.id}>
                <p className="font-medium text-sm">{t.title}</p>
                <p className="text-xs text-muted-foreground">{t.description}</p>
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

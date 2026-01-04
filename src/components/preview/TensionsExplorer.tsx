import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertTriangle, 
  Eye, 
  Lightbulb, 
  GitBranch, 
  CheckCircle2, 
  ChevronRight,
  Plus,
  FileText,
  Sparkles
} from "lucide-react";
import { useNarrativeStore } from "@/store/narrativeStore";
import { Tension, TensionType, TensionSeverity } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

// Type configurations
const typeConfig: Record<TensionType, { icon: React.ElementType; label: string; color: string; bgColor: string }> = {
  contradiction: { 
    icon: AlertTriangle, 
    label: "Contradiction", 
    color: "text-red-400",
    bgColor: "bg-red-400/10 border-red-400/30" 
  },
  blind_spot: { 
    icon: Eye, 
    label: "Blind Spot", 
    color: "text-amber-400",
    bgColor: "bg-amber-400/10 border-amber-400/30" 
  },
  hidden_risk: { 
    icon: AlertTriangle, 
    label: "Hidden Risk", 
    color: "text-orange-400",
    bgColor: "bg-orange-400/10 border-orange-400/30" 
  },
  strategic_option: { 
    icon: GitBranch, 
    label: "Strategic Option", 
    color: "text-blue-400",
    bgColor: "bg-blue-400/10 border-blue-400/30" 
  },
};

const severityConfig: Record<TensionSeverity, { label: string; borderColor: string; bgGlow: string }> = {
  low: { label: "Low", borderColor: "border-l-emerald-400", bgGlow: "shadow-emerald-500/10" },
  medium: { label: "Medium", borderColor: "border-l-amber-400", bgGlow: "shadow-amber-500/10" },
  high: { label: "High", borderColor: "border-l-red-400", bgGlow: "shadow-red-500/10" },
};

interface TensionExplorerCardProps {
  tension: Tension;
  isSelected: boolean;
  onSelect: () => void;
  isResolved: boolean;
  onResolve: () => void;
  onAddSlide: () => void;
}

const TensionExplorerCard = ({ 
  tension, 
  isSelected, 
  onSelect, 
  isResolved,
  onResolve,
  onAddSlide,
}: TensionExplorerCardProps) => {
  const config = typeConfig[tension.type];
  const severity = severityConfig[tension.severity];
  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl border bg-card/50 overflow-hidden border-l-4 transition-all",
        severity.borderColor,
        isSelected && "ring-2 ring-primary/50 shadow-lg",
        isResolved && "opacity-60"
      )}
    >
      {/* Card header - clickable to expand */}
      <button
        onClick={onSelect}
        className="w-full p-4 text-left"
      >
        <div className="flex items-start gap-3">
          {/* Type icon */}
          <div className={cn("p-2 rounded-lg border", config.bgColor)}>
            <Icon className={cn("w-4 h-4", config.color)} />
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Type and severity badges */}
            <div className="flex items-center gap-2 mb-2">
              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", config.bgColor, config.color)}>
                {config.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {severity.label} Severity
              </span>
              {isResolved && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Addressed
                </span>
              )}
            </div>
            
            {/* Title */}
            <h3 className="text-sm font-semibold text-foreground mb-1">
              {tension.title}
            </h3>
            
            {/* Preview of description */}
            <p className="text-xs text-muted-foreground line-clamp-2">
              {tension.description}
            </p>
          </div>
          
          <ChevronRight className={cn(
            "w-4 h-4 text-muted-foreground transition-transform flex-shrink-0",
            isSelected && "rotate-90"
          )} />
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-4">
              {/* Full description */}
              <p className="text-sm text-muted-foreground leading-relaxed">
                {tension.description}
              </p>

              {/* Source quotes if available */}
              {((tension.sourceA && tension.sourceA !== "null") || (tension.sourceB && tension.sourceB !== "null")) && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Conflicting Sources:</p>
                  <div className="flex flex-col gap-2">
                    {tension.sourceA && tension.sourceA !== "null" && (
                      <div className="px-3 py-2 rounded-lg bg-background border border-border/50 text-xs text-muted-foreground">
                        <span className="text-foreground">Source A:</span> "{tension.sourceA}"
                      </div>
                    )}
                    {tension.sourceB && tension.sourceB !== "null" && (
                      <div className="px-3 py-2 rounded-lg bg-background border border-border/50 text-xs text-muted-foreground">
                        <span className="text-foreground">Source B:</span> "{tension.sourceB}"
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* AI Recommendation */}
              <div className="p-3 rounded-lg bg-shimmer-start/5 border border-shimmer-start/20">
                <div className="flex items-start gap-2">
                  <div className="p-1.5 rounded-md bg-shimmer-start/20">
                    <Sparkles className="w-3.5 h-3.5 text-shimmer-start" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-shimmer-start mb-1">AI Recommendation</p>
                    <p className="text-sm text-foreground/80">
                      {tension.recommendation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant={isResolved ? "outline" : "default"}
                  size="sm"
                  onClick={onResolve}
                  className="flex-1"
                >
                  {isResolved ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                      Mark Unaddressed
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                      Mark as Addressed
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAddSlide}
                  className="flex-1"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Add Slide
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

interface TensionsExplorerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TensionsExplorer = ({ isOpen, onClose }: TensionsExplorerProps) => {
  const { tensions, setIncludeTensionSlide } = useNarrativeStore();
  const [selectedTensionId, setSelectedTensionId] = useState<string | null>(null);
  const [resolvedTensions, setResolvedTensions] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<TensionType | "all">("all");

  // Filter tensions
  const filteredTensions = useMemo(() => {
    if (filterType === "all") return tensions;
    return tensions.filter(t => t.type === filterType);
  }, [tensions, filterType]);

  // Stats
  const stats = useMemo(() => ({
    total: tensions.length,
    resolved: resolvedTensions.size,
    high: tensions.filter(t => t.severity === "high").length,
    byType: {
      contradiction: tensions.filter(t => t.type === "contradiction").length,
      blind_spot: tensions.filter(t => t.type === "blind_spot").length,
      hidden_risk: tensions.filter(t => t.type === "hidden_risk").length,
      strategic_option: tensions.filter(t => t.type === "strategic_option").length,
    },
  }), [tensions, resolvedTensions]);

  const handleResolve = (tensionId: string) => {
    setResolvedTensions(prev => {
      const next = new Set(prev);
      if (next.has(tensionId)) {
        next.delete(tensionId);
      } else {
        next.add(tensionId);
      }
      return next;
    });
  };

  const handleAddSlide = () => {
    setIncludeTensionSlide(true);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b border-border/50">
          <SheetTitle className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-400/10">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            Tensions Explorer
          </SheetTitle>
          
          {/* Progress indicator */}
          <div className="mt-4 p-3 rounded-lg bg-card border border-border/50">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {stats.resolved} / {stats.total} addressed
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
              <motion.div
                className="h-full bg-green-500"
                initial={{ width: 0 }}
                animate={{ width: stats.total > 0 ? `${(stats.resolved / stats.total) * 100}%` : 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            {stats.high > 0 && (
              <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {stats.high} high severity tension{stats.high > 1 ? 's' : ''} require attention
              </p>
            )}
          </div>
        </SheetHeader>

        {/* Filter tabs */}
        <div className="px-6 py-3 border-b border-border/50 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setFilterType("all")}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
              filterType === "all"
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            All ({stats.total})
          </button>
          {Object.entries(typeConfig).map(([type, config]) => {
            const count = stats.byType[type as TensionType];
            if (count === 0) return null;
            return (
              <button
                key={type}
                onClick={() => setFilterType(type as TensionType)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5",
                  filterType === type
                    ? cn(config.bgColor, config.color)
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <config.icon className="w-3 h-3" />
                {config.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Tensions list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredTensions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-foreground mb-2">No tensions found</h3>
              <p className="text-sm text-muted-foreground max-w-[260px]">
                {tensions.length === 0 
                  ? "Your research doesn't contain any detectable tensions or contradictions."
                  : "No tensions match the current filter."
                }
              </p>
            </div>
          ) : (
            filteredTensions.map((tension) => (
              <TensionExplorerCard
                key={tension.id}
                tension={tension}
                isSelected={selectedTensionId === tension.id}
                onSelect={() => setSelectedTensionId(
                  selectedTensionId === tension.id ? null : tension.id
                )}
                isResolved={resolvedTensions.has(tension.id)}
                onResolve={() => handleResolve(tension.id)}
                onAddSlide={handleAddSlide}
              />
            ))
          )}
        </div>

        {/* Footer actions */}
        {tensions.length > 0 && (
          <div className="px-6 py-4 border-t border-border/50 space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleAddSlide}
            >
              <FileText className="w-4 h-4 mr-2" />
              Add "Tensions" Slide to Narrative
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

// Trigger button for sidebar
interface TensionsExplorerTriggerProps {
  onClick: () => void;
}

export const TensionsExplorerTrigger = ({ onClick }: TensionsExplorerTriggerProps) => {
  const { tensions } = useNarrativeStore();
  
  if (tensions.length === 0) return null;

  const highSeverityCount = tensions.filter(t => t.severity === "high").length;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-card/50 transition-colors"
    >
      <div className="flex items-center gap-2 text-sm">
        <AlertTriangle className="w-4 h-4 text-amber-400" />
        <span>Tensions</span>
        <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-400 font-medium">
          {tensions.length}
        </span>
        {highSeverityCount > 0 && (
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-400/20 text-red-400 font-medium">
            {highSeverityCount} high
          </span>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </button>
  );
};


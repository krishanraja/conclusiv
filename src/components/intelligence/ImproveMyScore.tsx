import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNarrativeStore } from "@/store/narrativeStore";
import { calculateNarrativeQuality } from "./NarrativeQualityScore";
import { Sparkles, ChevronDown, ChevronUp, Zap, Target, FileText, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Suggestion {
  id: string;
  metric: string;
  currentScore: number;
  potentialGain: number;
  action: string;
  detail: string;
  icon: React.ElementType;
  priority: "high" | "medium" | "low";
}

export const ImproveMyScore = () => {
  const { narrative, rawText, tensions, businessContext } = useNarrativeStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const { overall, metrics } = calculateNarrativeQuality(narrative, rawText, tensions, businessContext);

  // Generate actionable suggestions based on current scores
  const generateSuggestions = (): Suggestion[] => {
    const suggestions: Suggestion[] = [];

    const structure = metrics.find(m => m.name === "Structure");
    const dataDensity = metrics.find(m => m.name === "Data Density");
    const cta = metrics.find(m => m.name === "Call to Action");
    const tensionBalance = metrics.find(m => m.name === "Tension Balance");
    const personalization = metrics.find(m => m.name === "Personalization");

    if (structure && structure.score < 80) {
      suggestions.push({
        id: "structure",
        metric: "Structure",
        currentScore: Math.round(structure.score),
        potentialGain: Math.round((100 - structure.score) * 0.25),
        action: "Add more sections",
        detail: "Aim for 5-7 well-structured sections with clear titles and content for each.",
        icon: FileText,
        priority: structure.score < 60 ? "high" : "medium",
      });
    }

    if (dataDensity && dataDensity.score < 75) {
      suggestions.push({
        id: "density",
        metric: "Data Density",
        currentScore: Math.round(dataDensity.score),
        potentialGain: Math.round((100 - dataDensity.score) * 0.2),
        action: "Add more data points",
        detail: "Include specific metrics, percentages, and concrete examples in your research input.",
        icon: TrendingUp,
        priority: dataDensity.score < 50 ? "high" : "medium",
      });
    }

    if (cta && cta.score < 80) {
      suggestions.push({
        id: "cta",
        metric: "Call to Action",
        currentScore: Math.round(cta.score),
        potentialGain: Math.round((100 - cta.score) * 0.15),
        action: "Strengthen your conclusion",
        detail: "Add clear next steps or action items to your final section.",
        icon: Target,
        priority: "medium",
      });
    }

    if (tensionBalance && (tensionBalance.score < 70 || tensions.length === 0)) {
      suggestions.push({
        id: "tension",
        metric: "Tension Balance",
        currentScore: Math.round(tensionBalance.score),
        potentialGain: Math.round((100 - tensionBalance.score) * 0.2),
        action: tensions.length === 0 ? "Include counterpoints" : "Address detected tensions",
        detail: tensions.length === 0 
          ? "Add some challenges, risks, or alternative perspectives to make your narrative more balanced."
          : `Review the ${tensions.length} detected tension(s) and address them in your narrative.`,
        icon: Zap,
        priority: tensions.length === 0 ? "low" : "high",
      });
    }

    if (personalization && personalization.score < 80) {
      suggestions.push({
        id: "personalization",
        metric: "Personalization",
        currentScore: Math.round(personalization.score),
        potentialGain: Math.round((100 - personalization.score) * 0.2),
        action: "Add business context",
        detail: !businessContext?.companyName 
          ? "Enter your company website to personalize the narrative with your brand voice."
          : "Add more value propositions and refine your brand voice in the input.",
        icon: Users,
        priority: personalization.score < 50 ? "high" : "low",
      });
    }

    // Sort by priority and potential gain
    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.potentialGain - a.potentialGain;
    });
  };

  const suggestions = generateSuggestions();
  const totalPotentialGain = suggestions.reduce((acc, s) => acc + s.potentialGain, 0);

  if (overall >= 90 || suggestions.length === 0) {
    return (
      <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
        <div className="flex items-center gap-2 text-green-400 text-sm">
          <Sparkles className="w-4 h-4" />
          <span className="font-medium">Excellent score!</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Your narrative is well-optimized. Keep up the great work!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Improve My Score</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-primary">
              +{Math.min(totalPotentialGain, 100 - overall)} potential points
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden"
          >
            {suggestions.slice(0, 4).map((suggestion, index) => {
              const Icon = suggestion.icon;
              return (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "p-3 rounded-lg border",
                    suggestion.priority === "high" 
                      ? "bg-orange-500/5 border-orange-500/20"
                      : suggestion.priority === "medium"
                      ? "bg-yellow-500/5 border-yellow-500/20"
                      : "bg-muted/30 border-border/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-1.5 rounded-lg shrink-0",
                      suggestion.priority === "high" 
                        ? "bg-orange-500/10"
                        : suggestion.priority === "medium"
                        ? "bg-yellow-500/10"
                        : "bg-muted"
                    )}>
                      <Icon className={cn(
                        "w-3.5 h-3.5",
                        suggestion.priority === "high" 
                          ? "text-orange-400"
                          : suggestion.priority === "medium"
                          ? "text-yellow-400"
                          : "text-muted-foreground"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{suggestion.action}</span>
                        <span className="text-xs text-primary shrink-0">
                          +{suggestion.potentialGain} pts
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {suggestion.detail}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-muted-foreground uppercase">
                          {suggestion.metric}
                        </span>
                        <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all"
                            style={{ width: `${suggestion.currentScore}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {suggestion.currentScore}%
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
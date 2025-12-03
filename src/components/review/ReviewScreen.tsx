import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, X, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNarrativeStore } from "@/store/narrativeStore";
import { cn } from "@/lib/utils";
import { Priority } from "@/lib/types";

const priorityColors: Record<Priority, string> = {
  high: "bg-primary/20 border-primary text-primary",
  medium: "bg-accent/20 border-accent text-accent",
  low: "bg-muted border-muted-foreground/30 text-muted-foreground",
};

const priorityIcons: Record<Priority, React.ReactNode> = {
  high: <Star className="w-3.5 h-3.5 fill-current" />,
  medium: <Star className="w-3.5 h-3.5" />,
  low: null,
};

export const ReviewScreen = () => {
  const { 
    themes, 
    toggleThemeKeep, 
    setThemePriority, 
    setCurrentStep,
  } = useNarrativeStore();

  const keptThemes = themes.filter(t => t.keep);

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentStep("extract")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Input
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-display text-3xl font-bold text-foreground">
                Review Extracted Themes
              </h2>
              <p className="text-muted-foreground">
                Toggle themes to include, and set priorities for your narrative
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {themes.map((theme, index) => (
            <motion.div
              key={theme.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "glass rounded-xl p-5 transition-all duration-300",
                !theme.keep && "opacity-50"
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleThemeKeep(theme.id)}
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                      theme.keep 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {theme.keep ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  </button>
                  <div>
                    <h3 className="font-display font-semibold text-foreground">
                      {theme.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {theme.items.length} items
                    </p>
                  </div>
                </div>

                <div className="flex gap-1">
                  {(["low", "medium", "high"] as Priority[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setThemePriority(theme.id, p)}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-all border",
                        theme.priority === p 
                          ? priorityColors[p]
                          : "bg-transparent border-border text-muted-foreground hover:border-muted-foreground"
                      )}
                    >
                      {priorityIcons[p]}
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {theme.items.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-2 p-2 rounded-lg bg-background/50"
                  >
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-xs font-medium",
                      item.type === "insight" && "bg-primary/20 text-primary",
                      item.type === "risk" && "bg-destructive/20 text-destructive",
                      item.type === "opportunity" && "bg-accent/20 text-accent",
                      item.type === "driver" && "bg-primary/20 text-primary",
                      item.type === "metric" && "bg-secondary text-secondary-foreground",
                    )}>
                      {item.type}
                    </span>
                    <p className="text-sm text-foreground flex-1 line-clamp-2">
                      {item.text}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(item.score * 100)}%
                    </span>
                  </div>
                ))}
                {theme.items.length > 3 && (
                  <p className="text-xs text-muted-foreground pl-2">
                    +{theme.items.length - 3} more items
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-between glass rounded-xl p-4"
        >
          <div className="text-sm text-muted-foreground">
            <span className="text-foreground font-semibold">{keptThemes.length}</span> themes selected • 
            <span className="text-foreground font-semibold ml-1">
              {keptThemes.reduce((acc, t) => acc + t.items.length, 0)}
            </span> total items
          </div>

          <Button
            variant="hero"
            size="lg"
            onClick={() => setCurrentStep("template")}
            disabled={keptThemes.length === 0}
          >
            Choose Template
            <ArrowRight className="w-5 h-5" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

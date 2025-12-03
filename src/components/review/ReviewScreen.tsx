import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNarrativeStore } from "@/store/narrativeStore";
import { cn } from "@/lib/utils";
import { Priority } from "@/lib/types";

const priorityStyles: Record<Priority, string> = {
  high: "bg-primary/20 border-primary/50 text-primary",
  medium: "bg-accent/20 border-accent/50 text-accent-foreground",
  low: "bg-secondary border-border text-muted-foreground",
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
    <div className="min-h-screen pt-20 pb-12 px-6">
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
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          <h2 className="text-3xl font-semibold text-foreground tracking-tight">
            Themes
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {themes.map((theme, index) => (
            <motion.div
              key={theme.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "rounded-xl border border-border/40 bg-card/50 p-5 transition-all duration-200",
                !theme.keep && "opacity-40"
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleThemeKeep(theme.id)}
                    className={cn(
                      "w-7 h-7 rounded-md flex items-center justify-center transition-all",
                      theme.keep 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {theme.keep ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  </button>
                  <div>
                    <h3 className="font-medium text-foreground">
                      {theme.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
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
                        "w-7 h-7 rounded-md flex items-center justify-center transition-all border",
                        theme.priority === p 
                          ? priorityStyles[p]
                          : "bg-transparent border-border/50 text-muted-foreground hover:border-border"
                      )}
                      title={p}
                    >
                      {p === "high" && <Star className="w-3.5 h-3.5 fill-current" />}
                      {p === "medium" && <Star className="w-3.5 h-3.5" />}
                      {p === "low" && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {theme.items.slice(0, 2).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-2 p-2 rounded-md bg-background/50"
                  >
                    <span className="w-1 h-1 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {item.text}
                    </p>
                  </div>
                ))}
                {theme.items.length > 2 && (
                  <p className="text-xs text-muted-foreground pl-3">
                    +{theme.items.length - 2} more
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between rounded-xl border border-border/40 bg-card/50 p-4"
        >
          <span className="text-sm text-muted-foreground">
            <span className="text-foreground font-medium">{keptThemes.length}</span> selected
          </span>

          <Button
            variant="shimmer"
            size="lg"
            onClick={() => setCurrentStep("template")}
            disabled={keptThemes.length === 0}
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
};
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNarrativeStore } from "@/store/narrativeStore";
import { recommendTemplates, buildNarrative } from "@/lib/mockAI";
import { getAllTemplates } from "@/lib/templates";
import { cn } from "@/lib/utils";
import { TemplateName } from "@/lib/types";
import { TemplatePreview } from "./TemplatePreview";

export const TemplateScreen = () => {
  const { 
    themes,
    selectedTemplate,
    setSelectedTemplate,
    setNarrative,
    setCurrentStep,
    setIsLoading,
  } = useNarrativeStore();

  const recommendations = recommendTemplates(themes);
  const allTemplates = getAllTemplates();

  const handleSelectTemplate = (templateName: TemplateName) => {
    setSelectedTemplate(templateName);
  };

  const handleGenerate = () => {
    if (!selectedTemplate) return;
    
    setIsLoading(true);
    
    setTimeout(() => {
      const narrative = buildNarrative(themes.filter(t => t.keep), selectedTemplate);
      setNarrative(narrative);
      setIsLoading(false);
      setCurrentStep("editor");
    }, 1500);
  };

  const recommendedTemplateNames = recommendations.map(r => r.template);

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
            onClick={() => setCurrentStep("review")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          <h2 className="text-3xl font-semibold text-foreground tracking-tight">
            Template
          </h2>
        </motion.div>

        {/* Recommended */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="text-primary text-sm">✦</span>
            <span className="text-sm text-muted-foreground">Recommended</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recommendations.map((rec, index) => {
              const template = allTemplates.find(t => t.name === rec.template)!;
              const isSelected = selectedTemplate === rec.template;
              
              return (
                <motion.button
                  key={rec.template}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 + index * 0.05 }}
                  onClick={() => handleSelectTemplate(rec.template)}
                  className={cn(
                    "relative rounded-xl border bg-card/50 text-left transition-all duration-200 overflow-hidden",
                    isSelected 
                      ? "border-primary/50 shimmer-border" 
                      : "border-border/40 hover:border-border"
                  )}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center z-10">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                  
                  <div className="h-28 relative">
                    <TemplatePreview templateName={rec.template} />
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-foreground">
                        {template.displayName}
                      </h4>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {Math.round(rec.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* All Templates */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <span className="text-sm text-muted-foreground mb-4 block">All</span>
          
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
            {allTemplates.map((template) => {
              const isSelected = selectedTemplate === template.name;
              const isRecommended = recommendedTemplateNames.includes(template.name);
              
              return (
                <button
                  key={template.name}
                  onClick={() => handleSelectTemplate(template.name)}
                  className={cn(
                    "relative rounded-lg border bg-card/30 p-2 text-left transition-all duration-150",
                    isSelected 
                      ? "border-primary/50 shimmer-border-subtle" 
                      : isRecommended 
                        ? "border-border/60" 
                        : "border-border/30 hover:border-border/50"
                  )}
                >
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-primary-foreground" />
                    </div>
                  )}
                  
                  <div className="h-12 mb-2 rounded bg-background/50 overflow-hidden">
                    <TemplatePreview templateName={template.name} mini />
                  </div>
                  
                  <p className="text-xs text-muted-foreground truncate">
                    {template.displayName}
                  </p>
                </button>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-between rounded-xl border border-border/40 bg-card/50 p-4"
        >
          <span className="text-sm text-muted-foreground">
            {selectedTemplate ? (
              <span className="text-foreground">{selectedTemplate}</span>
            ) : (
              "Select a template"
            )}
          </span>

          <Button
            variant="shimmer"
            size="lg"
            onClick={handleGenerate}
            disabled={!selectedTemplate}
          >
            Generate
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
};
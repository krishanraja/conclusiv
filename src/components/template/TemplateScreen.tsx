import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles, Check } from "lucide-react";
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
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentStep("review")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Review
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-display text-3xl font-bold text-foreground">
                Choose Your Narrative Template
              </h2>
              <p className="text-muted-foreground">
                AI recommends templates based on your content structure
              </p>
            </div>
          </div>
        </motion.div>

        {/* Recommended Templates */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            AI Recommended
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.map((rec, index) => {
              const template = allTemplates.find(t => t.name === rec.template)!;
              const isSelected = selectedTemplate === rec.template;
              
              return (
                <motion.button
                  key={rec.template}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  onClick={() => handleSelectTemplate(rec.template)}
                  className={cn(
                    "relative glass rounded-xl p-1 text-left transition-all duration-300 group",
                    isSelected ? "ring-2 ring-primary glow-primary" : "hover:ring-1 hover:ring-border"
                  )}
                >
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center z-10">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                  
                  <div className="bg-card rounded-lg overflow-hidden">
                    <div className="h-32 relative">
                      <TemplatePreview templateName={rec.template} />
                    </div>
                    
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-display font-semibold text-foreground">
                          {template.displayName}
                        </h4>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                          {Math.round(rec.confidence * 100)}% match
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {rec.reason}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {template.bestFor.slice(0, 2).map((tag) => (
                          <span key={tag} className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                            {tag}
                          </span>
                        ))}
                      </div>
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
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">
            All Templates
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {allTemplates.map((template) => {
              const isSelected = selectedTemplate === template.name;
              const isRecommended = recommendedTemplateNames.includes(template.name);
              
              return (
                <motion.button
                  key={template.name}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectTemplate(template.name)}
                  className={cn(
                    "relative glass rounded-lg p-3 text-left transition-all duration-200",
                    isSelected ? "ring-2 ring-primary" : "hover:ring-1 hover:ring-border",
                    isRecommended && !isSelected && "ring-1 ring-primary/30"
                  )}
                >
                  {isSelected && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                  
                  <div className="h-16 mb-2 rounded bg-background/50 overflow-hidden">
                    <TemplatePreview templateName={template.name} mini />
                  </div>
                  
                  <h4 className="font-display text-sm font-medium text-foreground truncate">
                    {template.displayName}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {template.description}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-between glass rounded-xl p-4"
        >
          <div className="text-sm text-muted-foreground">
            {selectedTemplate ? (
              <>Selected: <span className="text-foreground font-semibold">{selectedTemplate}</span></>
            ) : (
              "Select a template to continue"
            )}
          </div>

          <Button
            variant="hero"
            size="lg"
            onClick={handleGenerate}
            disabled={!selectedTemplate}
          >
            Generate Narrative
            <ArrowRight className="w-5 h-5" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

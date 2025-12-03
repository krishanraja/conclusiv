import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useNarrativeStore } from "@/store/narrativeStore";
import { extractThemesFromAI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export const ExtractScreen = () => {
  const { rawText, setRawText, setThemes, setCurrentStep, isLoading, setIsLoading } = useNarrativeStore();
  const [charCount, setCharCount] = useState(0);
  const { toast } = useToast();

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRawText(e.target.value);
    setCharCount(e.target.value.length);
  };

  const handleExtract = async () => {
    if (!rawText.trim()) return;
    
    setIsLoading(true);
    
    try {
      const result = await extractThemesFromAI(rawText);
      
      if (result.error) {
        toast({
          title: "Extraction Failed",
          description: result.error,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      if (result.themes.length === 0) {
        toast({
          title: "No Themes Found",
          description: "Try adding more structured content.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      setThemes(result.themes);
      setIsLoading(false);
      setCurrentStep("review");
      
      toast({
        title: "Done",
        description: `${result.themes.length} themes extracted.`,
      });
    } catch (error) {
      console.error('Extraction error:', error);
      toast({
        title: "Error",
        description: "Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-4xl md:text-5xl font-semibold mb-3 tracking-tight">
            <span className="gradient-text">Research</span>
            <span className="text-foreground"> → Story</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-xl border border-border/40 bg-card/50 p-6"
        >
          <Textarea
            placeholder="Paste your research..."
            value={rawText}
            onChange={handleTextChange}
            className="min-h-[280px] bg-transparent border-0 text-foreground placeholder:text-muted-foreground resize-none text-base leading-relaxed focus-visible:ring-0 p-0"
          />

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/30">
            <span className="text-sm text-muted-foreground tabular-nums">
              {charCount.toLocaleString()}
            </span>
            
            <Button
              variant="shimmer"
              size="lg"
              onClick={handleExtract}
              disabled={!rawText.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Extracting
                </>
              ) : (
                <>
                  Extract
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
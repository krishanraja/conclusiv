import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useNarrativeStore } from "@/store/narrativeStore";
import { extractThemes } from "@/lib/mockAI";

export const ExtractScreen = () => {
  const { rawText, setRawText, setThemes, setCurrentStep, isLoading, setIsLoading } = useNarrativeStore();
  const [charCount, setCharCount] = useState(0);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRawText(e.target.value);
    setCharCount(e.target.value.length);
  };

  const handleExtract = async () => {
    if (!rawText.trim()) return;
    
    setIsLoading(true);
    
    // Simulate AI extraction (replace with real API call)
    setTimeout(() => {
      const themes = extractThemes(rawText);
      setThemes(themes);
      setIsLoading(false);
      setCurrentStep("review");
    }, 2000);
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">AI-Powered Extraction</span>
          </div>
          
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Transform Research</span>
            <br />
            <span className="text-foreground">Into Compelling Narratives</span>
          </h2>
          
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Paste your analysis, SWOT, memo, or any longform text. Our AI will extract themes, 
            identify priorities, and structure it for visual storytelling.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass rounded-2xl p-1"
        >
          <div className="bg-card rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-foreground">Paste Your Research</h3>
                <p className="text-sm text-muted-foreground">SWOT, memos, analysis, or any structured text</p>
              </div>
            </div>

            <Textarea
              placeholder={`Paste your research here...\n\nExample:\n\nSTRENGTHS:\n- Strong brand recognition in key markets\n- Experienced leadership team\n- Proprietary technology platform\n\nWEAKNESSES:\n- Limited international presence\n- High customer acquisition costs...`}
              value={rawText}
              onChange={handleTextChange}
              className="min-h-[300px] bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground/50 resize-none text-base leading-relaxed"
            />

            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-muted-foreground">
                {charCount.toLocaleString()} characters
              </span>
              
              <Button
                variant="hero"
                size="lg"
                onClick={handleExtract}
                disabled={!rawText.trim() || isLoading}
                className="min-w-[200px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    Extract Structure
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {[
            { icon: "🎯", title: "Theme Detection", desc: "AI clusters your content into 3-7 key themes" },
            { icon: "⚡", title: "Priority Scoring", desc: "Automatically ranks by impact and relevance" },
            { icon: "🎬", title: "Narrative Mapping", desc: "Suggests optimal story structures" },
          ].map((feature, i) => (
            <div key={i} className="glass rounded-xl p-4 text-center">
              <span className="text-2xl mb-2 block">{feature.icon}</span>
              <h4 className="font-display font-semibold text-foreground mb-1">{feature.title}</h4>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

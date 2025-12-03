import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useNarrativeStore } from "@/store/narrativeStore";
import { useToast } from "@/hooks/use-toast";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { buildNarrative, scrapeBusinessContext } from "@/lib/api";
import { VoiceRecorder } from "./VoiceRecorder";
import { BusinessContextInput } from "./BusinessContextInput";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "lucide-react";

export const InputScreen = () => {
  const { toast } = useToast();
  const {
    rawText,
    setRawText,
    businessWebsite,
    setBusinessWebsite,
    businessContext,
    setBusinessContext,
    setThemes,
    setSelectedTemplate,
    setNarrative,
    setCurrentStep,
    setIsLoading,
    setLoadingMessage,
  } = useNarrativeStore();

  const [isScrapingContext, setIsScrapingContext] = useState(false);

  // Voice recorder
  const handleTranscript = useCallback(
    (text: string) => {
      setRawText(rawText ? `${rawText} ${text}` : text);
    },
    [rawText, setRawText]
  );

  const handleVoiceError = useCallback(
    (error: string) => {
      toast({
        title: "Voice error",
        description: error,
        variant: "destructive",
      });
    },
    [toast]
  );

  const { isRecording, isSupported, toggleRecording } = useVoiceRecorder({
    onTranscript: handleTranscript,
    onError: handleVoiceError,
  });

  // Handle website URL blur to auto-scrape
  const handleWebsiteChange = async (url: string) => {
    setBusinessWebsite(url);
    
    // Auto-scrape when URL looks valid
    if (url && url.includes(".") && !isScrapingContext) {
      setIsScrapingContext(true);
      try {
        const result = await scrapeBusinessContext(url);
        if (result.context) {
          setBusinessContext(result.context);
        }
      } catch (error) {
        console.error("Failed to scrape context:", error);
      } finally {
        setIsScrapingContext(false);
      }
    }
  };

  const handleClearContext = () => {
    setBusinessWebsite("");
    setBusinessContext(null);
  };

  // Build the narrative
  const handleBuild = async () => {
    if (!rawText.trim()) {
      toast({
        title: "Nothing to analyze",
        description: "Please speak or paste your research first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Smart loading messages based on input size
      const charCount = rawText.length;
      if (charCount > 15000) {
        setLoadingMessage("Processing large document...");
      } else if (businessContext) {
        setLoadingMessage(`Tailoring for ${businessContext.companyName}...`);
      } else {
        setLoadingMessage("Building your story...");
      }

      const result = await buildNarrative(rawText, businessContext);

      if (result.error) {
        toast({
          title: "Build failed",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      if (result.themes) {
        setThemes(result.themes);
      }
      if (result.recommendedTemplate) {
        setSelectedTemplate(result.recommendedTemplate);
      }
      if (result.narrative) {
        setNarrative(result.narrative);
      }

      setCurrentStep("preview");
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const charCount = rawText.length;
  const isLongInput = charCount > 15000;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl space-y-8"
      >
        {/* Voice Input */}
        <div className="flex justify-center">
          <VoiceRecorder
            isRecording={isRecording}
            isSupported={isSupported}
            onToggle={toggleRecording}
          />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-border/50" />
          <span className="text-xs text-muted-foreground">or paste</span>
          <div className="flex-1 h-px bg-border/50" />
        </div>

        {/* Text Input */}
        <div className="space-y-2">
          <Textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste your research, notes, or findings..."
            className="min-h-[200px] bg-card border-border/50 resize-none text-sm"
          />
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>{charCount.toLocaleString()}</span>
            {isLongInput && (
              <span className="text-shimmer-start">
                Large document detected — will process in chunks
              </span>
            )}
          </div>
        </div>

        {/* Business Context */}
        <BusinessContextInput
          value={businessWebsite}
          onChange={handleWebsiteChange}
          context={businessContext}
          isLoading={isScrapingContext}
          onClear={handleClearContext}
        />

        {/* Build Button */}
        <div className="flex justify-center pt-4">
          <Button
            variant="shimmer"
            size="xl"
            onClick={handleBuild}
            disabled={!rawText.trim()}
            className="min-w-[200px]"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Build Story
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

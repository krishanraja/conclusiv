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
import { ErrorRecovery, parseAPIError } from "@/components/ui/error-recovery";
import type { ErrorCode } from "@/components/ui/error-recovery";
import { Sparkles, AlertCircle } from "lucide-react";
import { AnimatePresence } from "framer-motion";

const MIN_CHARS = 50;
const MAX_CHARS_WARNING = 50000;

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
    setLoadingStage,
    setLoadingProgress,
  } = useNarrativeStore();

  const [isScrapingContext, setIsScrapingContext] = useState(false);
  const [error, setError] = useState<{ code: ErrorCode; message: string; retryable: boolean } | null>(null);

  // Voice recorder
  const handleTranscript = useCallback(
    (text: string) => {
      setRawText(rawText ? `${rawText} ${text}` : text);
    },
    [rawText, setRawText]
  );

  const handleVoiceError = useCallback(
    (errorMsg: string) => {
      toast({
        title: "Voice error",
        description: errorMsg,
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
      } catch (err) {
        console.error("Failed to scrape context:", err);
      } finally {
        setIsScrapingContext(false);
      }
    }
  };

  const handleClearContext = () => {
    setBusinessWebsite("");
    setBusinessContext(null);
  };

  // Simplify input (for error recovery)
  const handleSimplify = () => {
    const simplified = rawText.slice(0, Math.floor(rawText.length / 2));
    setRawText(simplified);
    setError(null);
    toast({
      title: "Input simplified",
      description: `Reduced to ${simplified.length.toLocaleString()} characters`,
    });
  };

  // Build the narrative
  const handleBuild = async () => {
    const trimmedText = rawText.trim();
    
    // Validation
    if (!trimmedText) {
      toast({
        title: "Nothing to analyze",
        description: "Please speak or paste your research first",
        variant: "destructive",
      });
      return;
    }

    if (trimmedText.length < MIN_CHARS) {
      toast({
        title: "Input too short",
        description: `Please provide at least ${MIN_CHARS} characters for meaningful analysis`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingStage(0);
    setLoadingProgress(0);
    
    try {
      // Smart loading messages based on input size
      const charCount = trimmedText.length;
      if (charCount > 15000) {
        setLoadingMessage("Processing large document...");
      } else if (businessContext) {
        setLoadingMessage(`Tailoring for ${businessContext.companyName}...`);
      } else {
        setLoadingMessage("Building your story...");
      }

      // Progress callback
      const handleProgress = (stage: number, progress: number) => {
        setLoadingStage(stage);
        setLoadingProgress(progress);
      };

      const result = await buildNarrative(trimmedText, businessContext, handleProgress);

      if (result.error) {
        const apiError = parseAPIError({ 
          message: result.error, 
          code: result.errorCode 
        });
        setError(apiError);
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
    } catch (err) {
      const apiError = parseAPIError(err);
      setError(apiError);
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
      setLoadingStage(0);
      setLoadingProgress(0);
    }
  };

  const charCount = rawText.length;
  const isLongInput = charCount > 15000;
  const isVeryLongInput = charCount > MAX_CHARS_WARNING;
  const isTooShort = charCount > 0 && charCount < MIN_CHARS;

  return (
    <>
      {/* Error Recovery Modal */}
      <AnimatePresence>
        {error && (
          <ErrorRecovery
            error={error}
            onRetry={handleBuild}
            onSimplify={charCount > 10000 ? handleSimplify : undefined}
            onDismiss={() => setError(null)}
            inputLength={charCount}
          />
        )}
      </AnimatePresence>

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
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <span className={isTooShort ? "text-amber-500" : "text-muted-foreground"}>
                  {charCount.toLocaleString()} characters
                </span>
                {isTooShort && (
                  <span className="text-amber-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Min {MIN_CHARS} required
                  </span>
                )}
              </div>
              {isLongInput && (
                <span className={isVeryLongInput ? "text-amber-500" : "text-shimmer-start"}>
                  {isVeryLongInput 
                    ? "Very large — may take longer" 
                    : "Large document — will process in chunks"}
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
              disabled={!rawText.trim() || isTooShort}
              className="min-w-[200px]"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Build Story
            </Button>
          </div>
        </motion.div>
      </div>
    </>
  );
};

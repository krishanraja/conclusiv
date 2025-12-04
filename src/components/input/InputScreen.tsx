import { useState } from "react";
import { motion } from "framer-motion";
import { useNarrativeStore } from "@/store/narrativeStore";
import { useToast } from "@/hooks/use-toast";
import { scrapeBusinessContext } from "@/lib/api";
import { BusinessContextInput } from "./BusinessContextInput";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, AlertCircle } from "lucide-react";
import conclusivIcon from "@/assets/conclusiv-icon.png";
import conclusivLogo from "@/assets/conclusiv-logo.png";

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
    setCurrentStep,
  } = useNarrativeStore();

  const [isScrapingContext, setIsScrapingContext] = useState(false);

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

  // Move to refine step
  const handleContinue = () => {
    const trimmedText = rawText.trim();
    
    // Validation
    if (!trimmedText) {
      toast({
        title: "Nothing to analyze",
        description: "Please paste your research first",
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

    setCurrentStep("refine");
  };

  const charCount = rawText.length;
  const isLongInput = charCount > 15000;
  const isVeryLongInput = charCount > MAX_CHARS_WARNING;
  const isTooShort = charCount > 0 && charCount < MIN_CHARS;

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-6 pt-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl space-y-10"
      >
        {/* Large Brand Logo */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center gap-4"
        >
          <img 
            src={conclusivIcon} 
            alt="conclusiv" 
            className="h-12 md:h-16 lg:h-[72px] w-auto"
            style={{ aspectRatio: 'auto' }}
          />
          <img 
            src={conclusivLogo} 
            alt="conclusiv" 
            className="h-12 md:h-16 lg:h-[72px] w-auto"
            style={{ aspectRatio: 'auto' }}
          />
        </motion.div>

        {/* Hero Section */}
        <div className="text-center space-y-6">
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight"
          >
            Go from complex info to a business plan in seconds
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            AI enables you to produce detailed research and strategy. conclusiv turns that in to ordered, business-enriched, clear and visually stunning mini-interactive presos which speed up business communication by 10X.
          </motion.p>
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

        {/* Continue Button */}
        <div className="flex justify-center pt-4">
          <Button
            variant="shimmer"
            size="xl"
            onClick={handleContinue}
            disabled={!rawText.trim() || isTooShort}
            className="min-w-[200px]"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Continue
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
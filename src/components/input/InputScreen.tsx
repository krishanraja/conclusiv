import { useState } from "react";
import { motion } from "framer-motion";
import { useNarrativeStore } from "@/store/narrativeStore";
import { useToast } from "@/hooks/use-toast";
import { scrapeBusinessContext, parseDocument } from "@/lib/api";
import { BusinessContextInput } from "./BusinessContextInput";
import { DocumentUploadInput } from "./DocumentUploadInput";
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
  const [isParsingDocument, setIsParsingDocument] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isDocumentExpanded, setIsDocumentExpanded] = useState(false);
  const [isContextExpanded, setIsContextExpanded] = useState(false);

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

  // Handle file upload
  const handleFileSelect = async (file: File) => {
    // Validate file type
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or Word document (.pdf, .docx)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 20MB",
        variant: "destructive",
      });
      return;
    }

    setIsParsingDocument(true);
    try {
      const result = await parseDocument(file);
      
      if (result.error) {
        throw new Error(result.error);
      }

      if (result.text) {
        setRawText(result.text);
        setUploadedFileName(file.name);
        toast({
          title: "Document parsed",
          description: `Extracted ${result.text.length.toLocaleString()} characters from ${file.name}`,
        });
      }
    } catch (err) {
      console.error("Failed to parse document:", err);
      toast({
        title: "Failed to parse document",
        description: err instanceof Error ? err.message : "Please try pasting the text instead",
        variant: "destructive",
      });
    } finally {
      setIsParsingDocument(false);
    }
  };

  const handleClearDocument = () => {
    setUploadedFileName(null);
    setRawText("");
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
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-4 md:py-6 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl space-y-4 md:space-y-5"
      >
        {/* Brand Logo - matched heights */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center gap-2"
        >
          <img 
            src={conclusivIcon} 
            alt="conclusiv" 
            className="h-6 md:h-7 w-auto"
            style={{ aspectRatio: 'auto' }}
          />
          <img 
            src={conclusivLogo} 
            alt="conclusiv" 
            className="h-6 md:h-7 w-auto"
            style={{ aspectRatio: 'auto' }}
          />
        </motion.div>

        {/* Hero Section - Updated text, 1.5X larger, bold */}
        <div className="text-center">
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl lg:text-2xl font-semibold text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Load your business plan, AI research output or strategy document below - and watch it become a stunning, clear interactive and shareable demo that turns hours of pitching in to minutes.
          </motion.p>
        </div>

        {/* Text Input with shimmer border */}
        <div className="space-y-1">
          <div className="shimmer-border shimmer-border-subtle shimmer-glow rounded-lg">
            <Textarea
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                if (uploadedFileName) setUploadedFileName(null);
              }}
              placeholder="Paste your research, notes, or findings..."
              className="min-h-[100px] md:min-h-[120px] bg-card border-0 resize-none text-sm rounded-lg"
              disabled={isParsingDocument}
            />
          </div>
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

        {/* Optional Features - Compact */}
        <div className="space-y-2">
          <DocumentUploadInput
            isExpanded={isDocumentExpanded}
            onToggle={() => setIsDocumentExpanded(!isDocumentExpanded)}
            isLoading={isParsingDocument}
            fileName={uploadedFileName}
            onFileSelect={handleFileSelect}
            onClear={handleClearDocument}
          />

          <BusinessContextInput
            value={businessWebsite}
            onChange={handleWebsiteChange}
            context={businessContext}
            isLoading={isScrapingContext}
            onClear={handleClearContext}
            isExpanded={isContextExpanded}
            onToggle={() => setIsContextExpanded(!isContextExpanded)}
          />
        </div>

        {/* Continue Button */}
        <div className="flex justify-center pt-2">
          <Button
            variant="shimmer"
            size="xl"
            onClick={handleContinue}
            disabled={!rawText.trim() || isTooShort || isParsingDocument}
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

import { useState, useEffect, useRef, DragEvent } from "react";
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

const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
];

const getFileTypeLabel = (type: string): string => {
  if (type === 'application/pdf') return 'PDF';
  if (type.includes('wordprocessing')) return 'Word';
  if (type.includes('presentation')) return 'PowerPoint';
  return 'document';
};

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
  const [isDraggingOnTextarea, setIsDraggingOnTextarea] = useState(false);
  
  // Debounced URL scraping
  const [pendingUrl, setPendingUrl] = useState("");
  const lastScrapedUrl = useRef("");

  // Debounce URL scraping - only fire 800ms after user stops typing
  useEffect(() => {
    if (!pendingUrl || !pendingUrl.includes(".") || pendingUrl === lastScrapedUrl.current) {
      return;
    }

    const timer = setTimeout(async () => {
      if (isScrapingContext) return;
      
      lastScrapedUrl.current = pendingUrl;
      setIsScrapingContext(true);
      try {
        const result = await scrapeBusinessContext(pendingUrl);
        if (result.context) {
          setBusinessContext(result.context);
        }
      } catch (err) {
        console.error("Failed to scrape context:", err);
      } finally {
        setIsScrapingContext(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [pendingUrl, isScrapingContext, setBusinessContext]);

  // Handle website URL change - just update state, debounce handles scraping
  const handleWebsiteChange = (url: string) => {
    setBusinessWebsite(url);
    setPendingUrl(url);
  };

  const handleClearContext = () => {
    setBusinessWebsite("");
    setPendingUrl("");
    lastScrapedUrl.current = "";
    setBusinessContext(null);
  };

  // Handle file upload - PDF, DOCX, PPTX
  const handleFileSelect = async (file: File) => {
    // Validate file type
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      toast({
        title: "Unsupported file type",
        description: "Please upload a PDF, Word (.docx), or PowerPoint (.pptx) document.",
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
        const fileType = getFileTypeLabel(file.type);
        toast({
          title: `${fileType} parsed`,
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

  // Drag handlers for textarea
  const handleTextareaDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOnTextarea(true);
  };

  const handleTextareaDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOnTextarea(true);
  };

  const handleTextareaDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDraggingOnTextarea(false);
    }
  };

  const handleTextareaDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOnTextarea(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
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
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/8 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl space-y-4 md:space-y-5 relative"
      >
        {/* Brand Logo with glow effect */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center gap-3 relative"
        >
          {/* Glow behind logo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-12 bg-primary/20 blur-2xl rounded-full" />
          </div>
          <img 
            src={conclusivIcon} 
            alt="conclusiv" 
            className="h-8 md:h-10 w-auto relative z-10"
            style={{ aspectRatio: 'auto' }}
          />
          <img 
            src={conclusivLogo} 
            alt="conclusiv" 
            className="h-8 md:h-10 w-auto relative z-10"
            style={{ aspectRatio: 'auto' }}
          />
        </motion.div>

        {/* Hero Section */}
        <div className="text-center">
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl lg:text-2xl font-semibold text-foreground/90 max-w-2xl mx-auto leading-relaxed"
          >
            Load your business plan, AI research output or strategy document below - and watch it become a{" "}
            <span className="gradient-text">stunning, clear interactive</span> and shareable demo that turns hours of pitching into minutes.
          </motion.p>
        </div>

        {/* Main Input Card with glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-strong rounded-xl p-4 md:p-5 space-y-3"
        >
          {/* Text Input with drag & drop support */}
          <div className="space-y-1">
            <div 
              className={`shimmer-border shimmer-glow rounded-lg relative transition-all duration-300 ${
                isDraggingOnTextarea ? 'ring-2 ring-shimmer-start scale-[1.01]' : ''
              }`}
              onDragEnter={handleTextareaDragEnter}
              onDragOver={handleTextareaDragOver}
              onDragLeave={handleTextareaDragLeave}
              onDrop={handleTextareaDrop}
            >
              <Textarea
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.value);
                  if (uploadedFileName) setUploadedFileName(null);
                }}
                placeholder="Paste your research, strategy document, or business plan... or drag & drop a file"
                className="min-h-[100px] md:min-h-[120px] bg-background/50 border-0 resize-none text-sm rounded-lg focus:ring-primary/50"
                disabled={isParsingDocument}
              />
              {/* Drag overlay for textarea */}
              {isDraggingOnTextarea && (
                <div className="absolute inset-0 flex items-center justify-center bg-shimmer-start/10 rounded-lg pointer-events-none">
                  <p className="text-shimmer-start font-medium">Drop file here</p>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center text-xs px-1">
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
          <div className="space-y-2 pt-1">
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
        </motion.div>

        {/* Continue Button with enhanced styling */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center pt-1"
        >
          <Button
            variant="shimmer"
            size="xl"
            onClick={handleContinue}
            disabled={!rawText.trim() || isTooShort || isParsingDocument}
            className="min-w-[200px] shadow-lg shadow-primary/20"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Continue
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

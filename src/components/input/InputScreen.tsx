import { useState, useEffect, useRef, useCallback, DragEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNarrativeStore } from "@/store/narrativeStore";
import { useToast } from "@/hooks/use-toast";
import { scrapeBusinessContext, parseDocument } from "@/lib/api";
import { BusinessContextInput } from "./BusinessContextInput";
import { DocumentUploadInput } from "./DocumentUploadInput";
import { ArchetypeSelector } from "./ArchetypeSelector";
import { AmbientDemo } from "./AmbientDemo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, AlertCircle, Crown, Check } from "lucide-react";
import { useFeatureGate } from "@/components/subscription/FeatureGate";
import { useSubscription } from "@/hooks/useSubscription";
import conclusivLogo from "@/assets/conclusiv-logo.png";

const MIN_CHARS = 50;
const MAX_CHARS_WARNING = 50000;
const FREE_MAX_CHARS = 15000;

const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
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

  const { requireFeature, UpgradePromptComponent } = useFeatureGate();
  const { incrementBuildCount, usage, limits, canBuild, isPro, isFirstBuild } = useSubscription();

  const [isScrapingContext, setIsScrapingContext] = useState(false);
  const [isParsingDocument, setIsParsingDocument] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isDocumentExpanded, setIsDocumentExpanded] = useState(false);
  const [isContextExpanded, setIsContextExpanded] = useState(false);
  const [isDraggingOnTextarea, setIsDraggingOnTextarea] = useState(false);
  const [showSuccessFlash, setShowSuccessFlash] = useState(false);
  
  const [pendingUrl, setPendingUrl] = useState("");
  const lastScrapedUrl = useRef("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-collapse document section after successful upload + show success flash
  useEffect(() => {
    if (uploadedFileName && rawText.trim()) {
      setIsDocumentExpanded(false);
      setShowSuccessFlash(true);
      const timer = setTimeout(() => setShowSuccessFlash(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [uploadedFileName, rawText]);

  // Auto-collapse context section after successful scrape
  useEffect(() => {
    if (businessContext) {
      setIsContextExpanded(false);
    }
  }, [businessContext]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to Continue
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (rawText.trim() && rawText.trim().length >= MIN_CHARS && !isParsingDocument && canBuild) {
          handleContinue();
        }
      }
      // Ctrl/Cmd + U to Upload
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        fileInputRef.current?.click();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rawText, isParsingDocument, canBuild]);

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

  const handleFileSelect = async (file: File) => {
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      toast({
        title: "Unsupported file type",
        description: "Please upload a PDF, Word (.docx), or PowerPoint (.pptx) document.",
        variant: "destructive",
      });
      return;
    }

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

  const handleContinue = useCallback(async () => {
    const trimmedText = rawText.trim();
    
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

    // Check build limit
    if (!requireFeature('build_limit')) {
      return;
    }

    // Increment build count
    await incrementBuildCount();
    
    setCurrentStep("refine");
  }, [rawText, toast, requireFeature, incrementBuildCount, setCurrentStep]);

  const charCount = rawText.length;
  const hasContent = charCount > 0;
  const isLongInput = charCount > 15000;
  const isVeryLongInput = charCount > MAX_CHARS_WARNING;
  const isTooShort = charCount > 0 && charCount < MIN_CHARS;
  // Only show free limit warning after first build is completed
  const showLargeDocWarning = !isPro && !isFirstBuild && charCount > FREE_MAX_CHARS;
  const buildsRemaining = isPro ? '∞' : (isFirstBuild ? 1 : Math.max(0, limits.buildsPerWeek - usage.buildsThisWeek));

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-4 md:py-6 relative z-10">
      {UpgradePromptComponent}
      
      {/* Hidden file input for keyboard shortcut */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
          e.target.value = '';
        }}
        className="hidden"
      />
      
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/8 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl space-y-4 relative"
      >
        {/* Brand Logo with glow effect */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center relative"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-12 bg-primary/20 blur-2xl rounded-full" />
          </div>
          <img 
            src={conclusivLogo} 
            alt="conclusiv" 
            className="h-8 md:h-10 w-auto relative z-10"
            style={{ aspectRatio: 'auto' }}
          />
        </motion.div>

        {/* Hero Section - Condensed when content exists */}
        <div className="text-center">
          <AnimatePresence mode="wait">
            <motion.p 
              key={hasContent ? 'loaded' : 'empty'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className={`font-semibold text-foreground/90 max-w-2xl mx-auto leading-relaxed transition-all ${
                hasContent ? 'text-base md:text-lg' : 'text-lg md:text-xl lg:text-2xl'
              }`}
            >
              {hasContent ? (
                <span className="flex items-center justify-center gap-2">
                  <AnimatePresence>
                    {showSuccessFlash && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-shimmer-start/20"
                      >
                        <Check className="w-3 h-3 text-shimmer-start" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                  Content loaded — customize below or <span className="gradient-text ml-1">continue</span>
                </span>
              ) : (
                <>
                  Load your business plan, AI research output or strategy document below - and watch it become a{" "}
                  <span className="gradient-text">stunning, clear interactive</span> and shareable demo that turns hours of pitching into minutes.
                </>
              )}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Main Input Card with glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`glass-strong rounded-xl p-4 space-y-3 transition-all duration-500 ${
            showSuccessFlash ? 'ring-2 ring-shimmer-start/30' : ''
          }`}
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
                className={`bg-background/50 border-0 resize-none text-sm rounded-lg focus:ring-primary/50 transition-all ${
                  hasContent ? 'min-h-[80px]' : 'min-h-[100px] md:min-h-[120px]'
                }`}
                disabled={isParsingDocument}
              />
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
                {showLargeDocWarning && (
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Crown className="w-3 h-3 text-primary" />
                    Upgrade for unlimited size
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {!isPro && !isFirstBuild && (
                  <span className={!canBuild ? "text-amber-500 font-medium" : "text-muted-foreground"}>
                    {!canBuild ? "Build limit reached" : `${buildsRemaining} build${buildsRemaining !== 1 ? 's' : ''} left`}
                  </span>
                )}
                {isLongInput && (
                  <span className={isVeryLongInput ? "text-muted-foreground" : "text-shimmer-start"}>
                    {isVeryLongInput 
                      ? "Large document — we'll extract key insights" 
                      : "Processing in smart chunks"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Optional Features - Unified Compact Style */}
          <div className="space-y-2 pt-1 border-t border-border/30">
            <DocumentUploadInput
              isExpanded={isDocumentExpanded}
              onToggle={() => setIsDocumentExpanded(!isDocumentExpanded)}
              isLoading={isParsingDocument}
              fileName={uploadedFileName}
              onFileSelect={handleFileSelect}
              onClear={handleClearDocument}
              hasContent={hasContent}
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

            <ArchetypeSelector />
          </div>
        </motion.div>

        {/* Continue Button - Always visible */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center gap-2"
        >
          <Button
            variant="shimmer"
            size="xl"
            onClick={handleContinue}
            disabled={!rawText.trim() || isTooShort || isParsingDocument}
            className="min-w-[200px] shadow-lg shadow-primary/20"
          >
            {!canBuild ? (
              <>
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Continue
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Continue
              </>
            )}
          </Button>
          {/* Keyboard shortcuts hint */}
          <p className="text-[10px] text-muted-foreground/50 hidden md:block">
            <kbd className="px-1 py-0.5 rounded bg-muted/30 text-muted-foreground/70 font-mono">⌘</kbd>
            <span className="mx-0.5">+</span>
            <kbd className="px-1 py-0.5 rounded bg-muted/30 text-muted-foreground/70 font-mono">Enter</kbd>
            <span className="mx-1.5">to continue</span>
            <span className="text-muted-foreground/30 mx-1">|</span>
            <kbd className="px-1 py-0.5 rounded bg-muted/30 text-muted-foreground/70 font-mono">⌘</kbd>
            <span className="mx-0.5">+</span>
            <kbd className="px-1 py-0.5 rounded bg-muted/30 text-muted-foreground/70 font-mono">U</kbd>
            <span className="mx-1.5">to upload</span>
          </p>
        </motion.div>
      </motion.div>
      
      {/* Ambient Demo - fixed position outside main content */}
      <AmbientDemo />
    </div>
  );
};

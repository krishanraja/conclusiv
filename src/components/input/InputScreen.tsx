import { useState, useEffect, useRef, useCallback, DragEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNarrativeStore } from "@/store/narrativeStore";
import { useToast } from "@/hooks/use-toast";
import { parseDocument, parseGoogleDoc } from "@/lib/api";

import { AmbientDemo } from "./AmbientDemo";
import { ResearchAssistant } from "./ResearchAssistant";
import { ResearchHistory } from "./ResearchHistory";
import { SeeExampleButton } from "./SeeExampleButton";
import { MobileInputFlow } from "./MobileInputFlow";
import { SetupSheet, useSetupSheet } from "./SetupSheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, AlertCircle, Crown, Check, Search, Settings2, Upload, FileText, Link, X, Loader2, Mic, MicOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useFeatureGate } from "@/components/subscription/FeatureGate";
import { useSubscription } from "@/hooks/useSubscription";
import { useIsMobile } from "@/hooks/use-mobile";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { criticalImages, isImageReady, onImageReady } from "@/lib/imagePreloader";

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
    businessContext,
    setCurrentStep,
  } = useNarrativeStore();

  const { requireFeature, UpgradePromptComponent } = useFeatureGate();
  const { incrementBuildCount, isPro, isFirstBuild, canBuild } = useSubscription();
  const isMobile = useIsMobile();
  
  // Logo preload state
  const [logoReady, setLogoReady] = useState(() => isImageReady("conclusivLogo"));

  useEffect(() => {
    if (logoReady) return;
    return onImageReady("conclusivLogo", () => setLogoReady(true));
  }, [logoReady]);
  
  // Auto-open setup sheet for first-time users
  const { shouldAutoOpen, hasChecked, markSetupComplete } = useSetupSheet();
  const [showSetupSheet, setShowSetupSheet] = useState(false);

  const [isParsingDocument, setIsParsingDocument] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isDocumentExpanded, setIsDocumentExpanded] = useState(false);
  const [isDraggingOnTextarea, setIsDraggingOnTextarea] = useState(false);
  const [showSuccessFlash, setShowSuccessFlash] = useState(false);
  const [showResearchAssistant, setShowResearchAssistant] = useState(false);
  const [showPostSetupGuidance, setShowPostSetupGuidance] = useState(false);
  const [showGoogleDocInput, setShowGoogleDocInput] = useState(false);
  const [googleDocUrl, setGoogleDocUrl] = useState("");
  const [isParsingGoogleDoc, setIsParsingGoogleDoc] = useState(false);
  
  // Voice recording integration
  const { isRecording, isSupported: isVoiceSupported, toggleRecording } = useVoiceRecorder({
    onTranscript: (text) => {
      setRawText((prev) => prev ? `${prev} ${text}` : text);
    },
    onError: (error) => {
      toast({
        title: "Voice error",
        description: error,
        variant: "destructive",
      });
    },
  });

  // Derived state - must be defined before hooks that reference them
  const charCount = rawText.length;
  const hasContent = charCount > 0;
  
  // Auto-open setup sheet on first visit
  useEffect(() => {
    if (hasChecked && shouldAutoOpen) {
      setShowSetupSheet(true);
    }
  }, [hasChecked, shouldAutoOpen]);

  // Handle setup completion - show post-setup guidance
  const handleSetupComplete = () => {
    markSetupComplete();
    // Show post-setup guidance if no content loaded yet
    if (!hasContent) {
      setShowPostSetupGuidance(true);
    }
  };

  // Auto-dismiss post-setup guidance after 5 seconds
  useEffect(() => {
    if (showPostSetupGuidance) {
      const timer = setTimeout(() => setShowPostSetupGuidance(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showPostSetupGuidance]);

  // Dismiss guidance when content is added
  useEffect(() => {
    if (hasContent && showPostSetupGuidance) {
      setShowPostSetupGuidance(false);
    }
  }, [hasContent, showPostSetupGuidance]);

  // Handle continue - must be defined before useEffect that references it
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
  }, [rawText, isParsingDocument, canBuild, handleContinue]);

  const handleResearchComplete = (content: string) => {
    setRawText(content);
    // Success indicated by content appearing - no toast needed
  };

  const handleGoogleDocSubmit = async () => {
    if (!googleDocUrl.trim()) return;

    setIsParsingGoogleDoc(true);
    try {
      const result = await parseGoogleDoc(googleDocUrl.trim());
      
      if (result.error) {
        toast({
          title: "Failed to load Google Doc",
          description: result.suggestion || result.error,
          variant: "destructive",
        });
        return;
      }

      if (result.text) {
        setRawText(result.text);
        setUploadedFileName("Google Doc");
        setShowGoogleDocInput(false);
        setGoogleDocUrl("");
      }
    } catch (err) {
      console.error("Failed to parse Google Doc:", err);
      toast({
        title: "Failed to load Google Doc",
        description: err instanceof Error ? err.message : "Please check the URL and try again",
        variant: "destructive",
      });
    } finally {
      setIsParsingGoogleDoc(false);
    }
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
        // Success indicated by file badge appearing - no toast needed
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

  const isLongInput = charCount > 15000;
  const isVeryLongInput = charCount > MAX_CHARS_WARNING;
  const isTooShort = charCount > 0 && charCount < MIN_CHARS;
  // Only show free limit warning after first build is completed
  const showLargeDocWarning = !isPro && !isFirstBuild && charCount > FREE_MAX_CHARS;

  // Mobile-first: Use dedicated mobile flow
  if (isMobile) {
    return (
      <>
        {UpgradePromptComponent}
        <MobileInputFlow 
          onContinue={handleContinue} 
          canBuild={canBuild} 
        />
      </>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col md:items-center md:justify-center px-4 pt-16 md:pt-20 pb-28 md:pb-8 relative z-10 overflow-y-auto overflow-x-hidden" data-onboarding="welcome">
      {UpgradePromptComponent}
      
      {/* Setup Sheet - Auto-opens on first visit */}
      <SetupSheet
        isOpen={showSetupSheet}
        onOpenChange={setShowSetupSheet}
        onComplete={handleSetupComplete}
      />
      
      {/* Research Assistant */}
      <ResearchAssistant
        isOpen={showResearchAssistant}
        onClose={() => setShowResearchAssistant(false)}
        onComplete={handleResearchComplete}
      />
      
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
        className="w-full max-w-3xl space-y-3 md:space-y-4 relative my-auto"
      >
        {/* Brand Logo with glow effect */}
        <div className="flex items-center justify-center relative h-8 md:h-10">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-12 bg-primary/20 blur-2xl rounded-full" />
          </div>
          <motion.img 
            src={criticalImages.conclusivLogo} 
            alt="conclusiv" 
            className="h-8 md:h-10 w-auto relative z-10"
            style={{ aspectRatio: 'auto' }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: logoReady ? 1 : 0, scale: logoReady ? 1 : 0.95 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>

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

        {/* Post-Setup Guidance - appears after personalization completes */}
        <AnimatePresence>
          {showPostSetupGuidance && !hasContent && (
            <motion.div
              initial={{ opacity: 0, y: 8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="flex items-center justify-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <Check className="w-3.5 h-3.5 text-primary" />
                <span className="text-sm font-medium gradient-text">
                  Ready. Add your content below.
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Primary Action Cards - Upload, Google Doc, Generate & Voice */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={`grid gap-3 ${isVoiceSupported ? 'grid-cols-4' : 'grid-cols-3'}`}
        >
          {/* Voice Input Card - Voice-First when supported */}
          {isVoiceSupported && (
            <button
              type="button"
              onClick={toggleRecording}
              disabled={isParsingDocument || isParsingGoogleDoc}
              className={`flex items-center gap-3 px-4 py-4 rounded-xl border transition-all group bg-card/50 backdrop-blur-sm text-left disabled:opacity-50 ${
                isRecording 
                  ? 'border-red-400/50 bg-red-500/10' 
                  : 'border-primary/50 hover:border-primary bg-primary/5'
              }`}
            >
              <div className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors relative ${
                isRecording ? 'bg-red-500/20' : 'bg-primary/20 group-hover:bg-primary/30'
              }`}>
                {isRecording ? (
                  <MicOff className="w-5 h-5 text-red-400" />
                ) : (
                  <Mic className="w-5 h-5 text-primary" />
                )}
                {isRecording && (
                  <motion.span 
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-400"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className={`text-sm font-medium block ${isRecording ? 'text-red-400' : 'text-foreground'}`}>
                  {isRecording ? 'Listening...' : 'Speak'}
                </span>
                <p className="text-xs text-muted-foreground truncate">
                  {isRecording ? 'Tap to stop' : 'Voice input'}
                </p>
              </div>
            </button>
          )}
          
          {/* Upload Document Card */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isParsingDocument || isParsingGoogleDoc || isRecording}
            className="flex items-center gap-3 px-4 py-4 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all group bg-card/50 backdrop-blur-sm text-left disabled:opacity-50"
            data-onboarding="document-upload"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-foreground block">Upload</span>
              <p className="text-xs text-muted-foreground truncate">PDF, Word, PPTX</p>
            </div>
          </button>

          {/* Google Doc Card */}
          <button
            type="button"
            onClick={() => setShowGoogleDocInput(!showGoogleDocInput)}
            disabled={isParsingDocument || isParsingGoogleDoc || isRecording}
            className={`flex items-center gap-3 px-4 py-4 rounded-xl border transition-all group bg-card/50 backdrop-blur-sm text-left disabled:opacity-50 ${
              showGoogleDocInput 
                ? 'border-primary/50 bg-primary/5' 
                : 'border-border/50 hover:border-primary/30 hover:bg-primary/5'
            }`}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Link className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-foreground block">Google Doc</span>
              <p className="text-xs text-muted-foreground truncate">Public link</p>
            </div>
          </button>

          {/* Generate with AI Card */}
          <button
            type="button"
            onClick={() => setShowResearchAssistant(true)}
            disabled={isParsingDocument || isParsingGoogleDoc || isRecording}
            className="flex items-center gap-3 px-4 py-4 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all group bg-card/50 backdrop-blur-sm text-left disabled:opacity-50"
            data-onboarding="research-assistant"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors relative">
              <Search className="w-5 h-5 text-primary" />
              <Sparkles className="w-3 h-3 text-shimmer-start absolute -top-1 -right-1" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-foreground block">Generate</span>
              <p className="text-xs text-muted-foreground truncate">AI assistant</p>
            </div>
          </button>
        </motion.div>

        {/* Google Doc URL Input */}
        <AnimatePresence>
          {showGoogleDocInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="glass-strong rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Enter Google Docs URL</span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowGoogleDocInput(false);
                      setGoogleDocUrl("");
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={googleDocUrl}
                    onChange={(e) => setGoogleDocUrl(e.target.value)}
                    placeholder="https://docs.google.com/document/d/..."
                    className="flex-1 bg-background/50"
                    disabled={isParsingGoogleDoc}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && googleDocUrl.trim()) {
                        handleGoogleDocSubmit();
                      }
                    }}
                  />
                  <Button
                    onClick={handleGoogleDocSubmit}
                    disabled={!googleDocUrl.trim() || isParsingGoogleDoc}
                    size="default"
                  >
                    {isParsingGoogleDoc ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Load"
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Make sure the document is set to "Anyone with the link can view"
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Secondary: Text Area (Output/Paste) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`glass-strong rounded-xl p-4 space-y-3 transition-all duration-500 ${
            showSuccessFlash ? 'ring-2 ring-shimmer-start/30' : ''
          }`}
        >
          {/* Label for the text area */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {uploadedFileName ? (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-shimmer-start" />
                  <span className="text-foreground font-medium">{uploadedFileName}</span>
                  <button
                    type="button"
                    onClick={handleClearDocument}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">Or paste your content directly</span>
              )}
            </div>
            <SeeExampleButton />
          </div>

          {/* Text Input with drag & drop support */}
          <div 
            className={`rounded-lg relative transition-all duration-300 border border-border/30 ${
              isDraggingOnTextarea ? 'ring-2 ring-shimmer-start scale-[1.01] border-shimmer-start' : 'hover:border-border/50'
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
              placeholder="Content from uploads or AI generation will appear here..."
              className={`bg-background/30 border-0 resize-none text-sm rounded-lg focus:ring-primary/50 transition-all ${
                hasContent ? 'min-h-[100px]' : 'min-h-[80px]'
              }`}
              disabled={isParsingDocument || isParsingGoogleDoc}
            />
            {isDraggingOnTextarea && (
              <div className="absolute inset-0 flex items-center justify-center bg-shimmer-start/10 rounded-lg pointer-events-none">
                <p className="text-shimmer-start font-medium">Drop file here</p>
              </div>
            )}
            {isParsingDocument && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>Parsing document...</span>
                </div>
              </div>
            )}
          </div>

          {/* Character count and warnings */}
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
              {isLongInput && (
                <span className={isVeryLongInput ? "text-muted-foreground" : "text-shimmer-start"}>
                  {isVeryLongInput 
                    ? "Large document — we'll extract key insights" 
                    : "Processing in smart chunks"}
                </span>
              )}
            </div>
          </div>

          {/* Research History */}
          <ResearchHistory
            onContinueResearch={(query) => {
              setShowResearchAssistant(true);
            }}
            onUseResults={(content) => {
              const current = rawText;
              setRawText(current ? `${current}\n\n---\n\n${content}` : content);
            }}
          />
        </motion.div>

        {/* Personalize Settings Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <button
            type="button"
            onClick={() => setShowSetupSheet(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all group bg-card/50 backdrop-blur-sm"
            data-onboarding="business-context"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors relative">
              <Settings2 className="w-5 h-5 text-primary" />
              {!businessContext && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-shimmer-start rounded-full animate-pulse" />
              )}
            </div>
            <div className="flex-1 text-left">
              <span className="text-sm font-medium text-foreground">
                {businessContext ? `${businessContext.companyName || 'Business'} Settings` : 'Personalize Your Presentation'}
              </span>
              <p className="text-xs text-muted-foreground">
                {businessContext ? 'Edit business context & story type' : 'Add your logo, brand colors & story type'}
              </p>
            </div>
          </button>
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
            data-onboarding="continue-button"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Continue
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

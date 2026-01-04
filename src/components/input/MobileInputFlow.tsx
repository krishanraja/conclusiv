import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Upload, 
  Building2, 
  FileText,
  Check,
  AlertCircle,
  Crown,
  Settings,
  Mic,
  MicOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useNarrativeStore } from "@/store/narrativeStore";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { parseDocument } from "@/lib/api";
import { ResearchAssistant } from "./ResearchAssistant";
import { SeeExampleButton } from "./SeeExampleButton";
import { SetupSheet, useSetupSheet } from "./SetupSheet";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import conclusivLogo from "@/assets/conclusiv-logo.png";

const MIN_CHARS = 50;
const FREE_MAX_CHARS = 15000;

const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

interface MobileInputFlowProps {
  onContinue: () => void;
  canBuild: boolean;
}

export const MobileInputFlow = ({ onContinue, canBuild }: MobileInputFlowProps) => {
  const { toast } = useToast();
  const {
    rawText,
    setRawText,
    businessContext,
  } = useNarrativeStore();
  
  const { isPro, isFirstBuild } = useSubscription();
  
  // Auto-open setup sheet for first-time users
  const { shouldAutoOpen, hasChecked, markSetupComplete } = useSetupSheet();
  const [showSetupSheet, setShowSetupSheet] = useState(false);
  
  const [isParsingDocument, setIsParsingDocument] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [showResearchAssistant, setShowResearchAssistant] = useState(false);
  const [showPostSetupGuidance, setShowPostSetupGuidance] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
  
  const charCount = rawText.length;
  const hasContent = charCount > 0;
  const isTooShort = charCount > 0 && charCount < MIN_CHARS;
  const showLargeDocWarning = !isPro && !isFirstBuild && charCount > FREE_MAX_CHARS;

  // Auto-open setup sheet on first visit
  useEffect(() => {
    if (hasChecked && shouldAutoOpen) {
      setShowSetupSheet(true);
    }
  }, [hasChecked, shouldAutoOpen]);

  const handleFileSelect = async (file: File) => {
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      toast({
        title: "Unsupported file type",
        description: "Please upload a PDF, Word, or PowerPoint document.",
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
      if (result.error) throw new Error(result.error);
      if (result.text) {
        setRawText(result.text);
        setUploadedFileName(file.name);
        // Success indicated by UI state change - no toast needed
      }
    } catch (err) {
      toast({
        title: "Failed to parse document",
        description: err instanceof Error ? err.message : "Please try pasting the text instead",
        variant: "destructive",
      });
    } finally {
      setIsParsingDocument(false);
    }
  };

  const handleResearchComplete = (content: string) => {
    setRawText(content);
    setShowResearchAssistant(false);
    // Success indicated by content appearing in textarea - no toast needed
  };

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

  return (
    <div className="flex flex-col h-[calc(100dvh-8rem)] overflow-hidden">
      {/* Setup Sheet - Auto-opens on first visit */}
      <SetupSheet
        isOpen={showSetupSheet}
        onOpenChange={setShowSetupSheet}
        onComplete={handleSetupComplete}
      />
      
      {/* Research Assistant Modal */}
      <ResearchAssistant
        isOpen={showResearchAssistant}
        onClose={() => setShowResearchAssistant(false)}
        onComplete={handleResearchComplete}
      />
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.pptx"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
          e.target.value = '';
        }}
        className="hidden"
      />

      {/* Hero Section with Logo */}
      <div className="flex-shrink-0 px-6 pt-6 pb-6 text-center">
        <motion.img 
          src={conclusivLogo}
          alt="conclusiv" 
          className="h-5 w-auto mx-auto mb-6"
          style={{ aspectRatio: 'auto' }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          fetchPriority="high"
          decoding="async"
        />
        <h1 className="text-2xl font-bold text-foreground leading-tight">
          Turn your business case into a{" "}
          <span className="gradient-text">demo</span>
          {" "}in 2 minutes.
        </h1>
        <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
          Upload, generate or paste your business plan.
        </p>
      </div>

      {/* Voice-First Hero Button */}
      {isVoiceSupported && (
        <div className="flex-shrink-0 flex justify-center pb-4">
          <motion.button
            onClick={toggleRecording}
            className={cn(
              "relative w-20 h-20 rounded-full flex items-center justify-center transition-all",
              isRecording 
                ? "bg-red-500/20 text-red-400 border-2 border-red-400/50" 
                : "bg-gradient-to-br from-primary/20 to-primary/5 text-primary border-2 border-primary/30 hover:border-primary/50"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Pulse rings when recording */}
            <AnimatePresence>
              {isRecording && (
                <>
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-red-400/50"
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-red-400/30"
                    initial={{ scale: 1, opacity: 0.3 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                  />
                </>
              )}
            </AnimatePresence>
            
            {isRecording ? (
              <MicOff className="w-8 h-8" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </motion.button>
        </div>
      )}
      
      {/* Voice status indicator */}
      <AnimatePresence>
        {isRecording && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-shrink-0 text-center pb-3"
          >
            <p className="text-sm text-red-400 font-medium flex items-center justify-center gap-2">
              <motion.span 
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-red-400"
              />
              Listening... Speak now
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Action Buttons - Upload, Generate & Voice */}
      <div className="flex-shrink-0 flex items-center justify-center gap-2 px-4 pb-3">
        <div className={cn(
          "flex-1 rounded-lg transition-all duration-300",
          businessContext && !hasContent && "shimmer-border"
        )}>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isParsingDocument || isRecording}
            className="w-full h-11 text-sm font-medium border-0 bg-card/50"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </div>
        <div className={cn(
          "flex-1 rounded-lg transition-all duration-300",
          businessContext && !hasContent && "shimmer-border"
        )}>
          <Button
            variant="outline"
            onClick={() => setShowResearchAssistant(true)}
            disabled={isRecording}
            className="w-full h-11 text-sm font-medium border-0 bg-card/50"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate
          </Button>
        </div>
      </div>

      {/* Example as subtle text link - clearly secondary */}
      <div className="flex-shrink-0 text-center pb-4">
        <SeeExampleButton variant="ghost" className="text-xs text-muted-foreground hover:text-primary h-auto py-1 px-2" />
      </div>

      {/* Status badges */}
      <AnimatePresence>
        {(uploadedFileName || businessContext || isParsingDocument) && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex-shrink-0 flex flex-wrap items-center justify-center gap-2 px-4 pb-3"
          >
            {isParsingDocument && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 rounded-full text-xs text-primary">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <FileText className="w-3 h-3" />
                </motion.div>
                Parsing...
              </span>
            )}
            {uploadedFileName && !isParsingDocument && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 rounded-full text-xs text-primary">
                <Check className="w-3 h-3" />
                {uploadedFileName.slice(0, 20)}
              </span>
            )}
            {businessContext && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent/20 rounded-full text-xs text-accent-foreground">
                <Building2 className="w-3 h-3" />
                {businessContext.companyName || 'Context loaded'}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Textarea - Shimmer only when no setup is done */}
      <div className="flex-1 px-4 pb-2 min-h-[20vh] max-h-[35vh]">
        <div className={cn(
          "h-full relative rounded-xl transition-all duration-300",
          !hasContent && !businessContext && "shimmer-border"
        )}>
          <Textarea
            value={rawText}
            onChange={(e) => {
              setRawText(e.target.value);
              if (uploadedFileName) setUploadedFileName(null);
            }}
            placeholder="Paste your research here..."
            className="h-full w-full bg-card/50 border-0 resize-none text-sm rounded-xl focus:ring-2 focus:ring-primary/50 p-4"
            disabled={isParsingDocument}
          />
          
          {/* Char count overlay */}
          <div className="absolute bottom-3 right-3 text-xs text-muted-foreground/60">
            {charCount > 0 && (
              <span className={isTooShort ? "text-amber-500" : ""}>
                {charCount.toLocaleString()}
                {isTooShort && (
                  <span className="ml-1">/ {MIN_CHARS} min</span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Contextual guidance - Dynamic based on state */}
      <div className="flex-shrink-0 px-4 pb-2 min-h-[24px]">
        <AnimatePresence mode="wait">
          {showPostSetupGuidance && !hasContent ? (
            <motion.div
              key="post-setup"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="text-center"
            >
              <p className="text-xs font-medium gradient-text inline-flex items-center gap-1.5">
                <Check className="w-3 h-3" />
                Ready. Add your content above.
              </p>
            </motion.div>
          ) : !businessContext && !hasContent ? (
            <motion.p 
              key="settings-hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-primary/70 text-center"
            >
              Tap settings to personalize before continuing.
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Bottom Bar - Simplified */}
      <div className="flex-shrink-0 bg-background/95 backdrop-blur-sm border-t border-border/30 px-4 py-3 pb-safe">
        {/* Warnings */}
        {(isTooShort || showLargeDocWarning) && (
          <div className="flex items-center justify-center gap-2 text-xs mb-2">
            {isTooShort && (
              <span className="text-amber-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Need {MIN_CHARS - charCount} more characters
              </span>
            )}
            {showLargeDocWarning && (
              <span className="text-muted-foreground flex items-center gap-1">
                <Crown className="w-3 h-3 text-primary" />
                Upgrade for unlimited
              </span>
            )}
          </div>
        )}

        {/* Settings Icon + Continue Button */}
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setShowSetupSheet(true)}
            className="flex-shrink-0 h-12 w-12 relative border-primary/20 hover:border-primary/40"
          >
            <Settings className="w-5 h-5" />
            {/* Subtle pulsing badge if no context */}
            {!businessContext && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
            )}
          </Button>
          
          <Button
            variant="shimmer"
            size="lg"
            onClick={onContinue}
            disabled={!rawText.trim() || isTooShort || isParsingDocument}
            className="flex-1 h-12 shadow-lg shadow-primary/20"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

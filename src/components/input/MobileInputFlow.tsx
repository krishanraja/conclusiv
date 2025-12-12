import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Upload, 
  Search, 
  Building2, 
  BookOpen, 
  Settings,
  Crown,
  FileText,
  X,
  Check,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { useNarrativeStore } from "@/store/narrativeStore";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { parseDocument, scrapeBusinessContext, fetchBrandData } from "@/lib/api";
import { ResearchAssistant } from "./ResearchAssistant";
import { SeeExampleButton } from "./SeeExampleButton";
import { ArchetypeSelector } from "./ArchetypeSelector";
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
    businessWebsite,
    setBusinessWebsite,
    businessContext,
    setBusinessContext,
  } = useNarrativeStore();
  
  const { isPro, isFirstBuild } = useSubscription();
  
  const [isParsingDocument, setIsParsingDocument] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [showResearchAssistant, setShowResearchAssistant] = useState(false);
  const [optionsDrawerOpen, setOptionsDrawerOpen] = useState(false);
  const [isScrapingContext, setIsScrapingContext] = useState(false);
  const [websiteInput, setWebsiteInput] = useState(businessWebsite);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const charCount = rawText.length;
  const hasContent = charCount > 0;
  const isTooShort = charCount > 0 && charCount < MIN_CHARS;
  const showLargeDocWarning = !isPro && !isFirstBuild && charCount > FREE_MAX_CHARS;

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
    setOptionsDrawerOpen(false);
    
    try {
      const result = await parseDocument(file);
      if (result.error) throw new Error(result.error);
      if (result.text) {
        setRawText(result.text);
        setUploadedFileName(file.name);
        toast({
          title: "Document parsed",
          description: `Extracted ${result.text.length.toLocaleString()} characters`,
        });
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

  const handleWebsiteSubmit = async () => {
    if (!websiteInput.includes(".")) return;
    
    setIsScrapingContext(true);
    setOptionsDrawerOpen(false);
    
    try {
      const [scrapeResult, brandResult] = await Promise.all([
        scrapeBusinessContext(websiteInput),
        fetchBrandData(websiteInput),
      ]);
      
      if (scrapeResult.context) {
        setBusinessWebsite(websiteInput);
        setBusinessContext({
          ...scrapeResult.context,
          logoUrl: brandResult.data?.logo?.url,
          logoVariants: brandResult.data?.logos || [],
          brandColors: brandResult.data?.colors,
          brandFonts: brandResult.data?.fonts,
          companyName: scrapeResult.context.companyName || brandResult.data?.companyName || '',
        });
        toast({
          title: "Business context loaded",
          description: scrapeResult.context.companyName || "Context added",
        });
      }
    } catch (err) {
      toast({
        title: "Failed to load context",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsScrapingContext(false);
    }
  };

  const handleResearchComplete = (content: string) => {
    setRawText(content);
    setShowResearchAssistant(false);
    toast({
      title: "Research loaded",
      description: "Your research has been added",
    });
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] overflow-hidden">
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
      <div className="flex-shrink-0 px-6 pt-8 pb-6 text-center">
        <motion.img 
          src={conclusivLogo} 
          alt="conclusiv" 
          className="h-14 w-auto mx-auto mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        />
        <h1 className="text-2xl font-bold text-foreground">
          Turn research into{" "}
          <span className="gradient-text">stories</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-3">
          Paste content or use our tools below
        </p>
      </div>

      {/* Action Buttons - THE HERO */}
      <div className="flex-shrink-0 flex items-center justify-center gap-3 px-4 pb-6">
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isParsingDocument}
          className="flex-1 h-12 text-sm font-medium"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowResearchAssistant(true)}
          className="flex-1 h-12 text-sm font-medium"
        >
          <Search className="w-4 h-4 mr-2" />
          Research
        </Button>
        <SeeExampleButton className="flex-1 text-sm font-medium" />
      </div>

      {/* Status badges */}
      <AnimatePresence>
        {(uploadedFileName || businessContext || isParsingDocument || isScrapingContext) && (
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
            {isScrapingContext && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent/20 rounded-full text-xs text-accent-foreground">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Building2 className="w-3 h-3" />
                </motion.div>
                Loading context...
              </span>
            )}
            {businessContext && !isScrapingContext && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent/20 rounded-full text-xs text-accent-foreground">
                <Building2 className="w-3 h-3" />
                {businessContext.companyName || 'Context loaded'}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Textarea with Shimmer Border - Constrained Height */}
      <div className="flex-[0.6] px-4 pb-3 min-h-0 max-h-[35vh]">
        <div className={cn(
          "h-full relative rounded-xl transition-all duration-300",
          !hasContent && "shimmer-border"
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
          <Drawer open={optionsDrawerOpen} onOpenChange={setOptionsDrawerOpen}>
            <DrawerTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="flex-shrink-0 h-12 w-12"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="max-h-[80vh]">
              <div className="p-6 space-y-6 overflow-y-auto">
                <h3 className="text-lg font-semibold text-center">Options</h3>
                
                {/* Business Context */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Add Business Context
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={websiteInput}
                      onChange={(e) => setWebsiteInput(e.target.value)}
                      placeholder="yourcompany.com"
                      className="flex-1 h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <Button 
                      size="sm" 
                      onClick={handleWebsiteSubmit}
                      disabled={!websiteInput.includes(".") || isScrapingContext}
                      className="h-10"
                    >
                      {isScrapingContext ? "..." : "Add"}
                    </Button>
                  </div>
                  {businessContext && (
                    <div className="flex items-center gap-2 text-xs text-primary">
                      <Check className="w-3 h-3" />
                      {businessContext.companyName || "Context loaded"}
                      <button 
                        onClick={() => {
                          setBusinessContext(null);
                          setBusinessWebsite("");
                          setWebsiteInput("");
                        }}
                        className="ml-auto text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Story Mode */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Story Mode
                  </label>
                  <ArchetypeSelector />
                </div>
                
                {/* Upload Document */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Document
                  </label>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      fileInputRef.current?.click();
                      setOptionsDrawerOpen(false);
                    }}
                    disabled={isParsingDocument}
                  >
                    {isParsingDocument ? "Parsing..." : "Choose PDF, Word, or PowerPoint"}
                  </Button>
                </div>
              </div>
            </DrawerContent>
          </Drawer>
          
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

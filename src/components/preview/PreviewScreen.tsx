import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion } from "framer-motion";
import { ArrowLeft, Play, BookOpen, Share2, Download, FileText, Presentation, Lock, Copy, Check, Sparkles, ExternalLink, Film, ChevronLeft, ChevronRight, BarChart3 } from "lucide-react";
import { useNarrativeStore } from "@/store/narrativeStore";
import { useToast } from "@/hooks/use-toast";
import { buildNarrative, extractTensions, generateAlternatives } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { NarrativePreview } from "./NarrativePreview";
import { QuickAdjustments } from "./QuickAdjustments";
import { AlternativesPanel } from "./AlternativesPanel";
import { MobileQuickSettings } from "./MobileQuickSettings";
import { MobileActionsDrawer } from "./MobileActionsDrawer";
import { MobilePreviewLayout } from "./MobilePreviewLayout";
import { PasswordProtectedShare } from "./PasswordProtectedShare";
import { ErrorRecovery, parseAPIError } from "@/components/ui/error-recovery";
import type { ErrorCode } from "@/components/ui/error-recovery";
import { cn } from "@/lib/utils";
import { AnimatePresence } from "framer-motion";
import { useFeatureGate } from "@/components/subscription/FeatureGate";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { exportToPDF } from "@/lib/exports/pdfExport";
import { exportToPPTX } from "@/lib/exports/pptxExport";
import { exportBrandedPDF, exportBrandedPPTX } from "@/lib/exports/brandedExport";
import { ViewMode } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
// New gamification imports
import { NarrativeQualityScore } from "@/components/intelligence/NarrativeQualityScore";
import { ExecutiveSummary } from "@/components/intelligence/ExecutiveSummary";
import { ImproveMyScore } from "@/components/intelligence/ImproveMyScore";
import { Confetti, MiniCelebration } from "@/components/celebration/Confetti";
import { AchievementToast } from "@/components/celebration/AchievementToast";
import { NarrativeRemix } from "@/components/power-user/NarrativeRemix";
import { MakingOfView, MakingOfTrigger } from "@/components/power-user/MakingOfView";
import { useCelebration } from "@/hooks/useCelebration";
import { AlternativeComparison } from "./AlternativeComparison";
import { PresentationAnalytics } from "@/components/analytics/PresentationAnalytics";
import { useBrandLogo } from "@/hooks/useBrandLogo";

// Brand Logo Overlay component - renders outside overflow-hidden containers
const BrandLogoOverlay = () => {
  const { logoUrl, showLogo, logoPosition, logoSize } = useBrandLogo();
  
  const logoPositionClasses: Record<string, string> = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-14 left-4',
    'bottom-right': 'bottom-14 right-4',
  };
  
  const logoSizeClasses: Record<string, string> = {
    'sm': 'h-5 max-w-[80px]',
    'md': 'h-6 max-w-[100px]',
    'lg': 'h-8 max-w-[120px]',
  };
  
  if (!showLogo || !logoUrl || logoPosition === 'none') return null;
  
  return (
    <div className={cn(
      "absolute z-20 opacity-60 hover:opacity-100 transition-opacity pointer-events-auto",
      logoPositionClasses[logoPosition]
    )}>
      <img 
        src={logoUrl} 
        alt="Logo" 
        className={cn(
          "w-auto object-contain",
          logoSizeClasses[logoSize]
        )}
        fetchPriority="high"
        decoding="async"
      />
    </div>
  );
};

export const PreviewScreen = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const {
    rawText,
    setCurrentStep,
    setCurrentSectionIndex,
    viewMode,
    setViewMode,
    businessContext,
    setThemes,
    setSelectedTemplate,
    setNarrative,
    narrative,
    setIsLoading,
    setLoadingMessage,
    setLoadingStage,
    setLoadingProgress,
    highlights,
    keyClaims,
    voiceFeedback,
    // New state
    audienceMode,
    selectedArchetype,
    duration,
    includeTensionSlide,
    setTensions,
    setAlternatives,
    alternatives,
    isGeneratingAlternatives,
    setIsGeneratingAlternatives,
  } = useNarrativeStore();

  const { requireFeature, UpgradePromptComponent, isPro, limits } = useFeatureGate();
  const celebration = useCelebration();
  const isMobile = useIsMobile();

  const [error, setError] = useState<{ code: ErrorCode; message: string; retryable: boolean } | null>(null);
  const [hasBuilt, setHasBuilt] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [sharePassword, setSharePassword] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [alternativesPanelOpen, setAlternativesPanelOpen] = useState(false);
  const [makingOfOpen, setMakingOfOpen] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [lastShareId, setLastShareId] = useState<string | null>(null);

  // Build narrative on mount if not already built
  useEffect(() => {
    if (!narrative && !hasBuilt) {
      handleBuild();
    }
  }, []);

  const handleBuild = async () => {
    setHasBuilt(true);
    setIsLoading(true);
    setError(null);
    setLoadingStage(0);
    setLoadingProgress(0);
    
    try {
      const charCount = rawText.length;
      if (charCount > 15000) {
        setLoadingMessage("Processing large document...");
      } else if (businessContext) {
        setLoadingMessage(`Tailoring for ${businessContext.companyName}...`);
      } else {
        setLoadingMessage("Building your story...");
      }

      const handleProgress = (stage: number, progress: number) => {
        setLoadingStage(stage);
        setLoadingProgress(progress);
      };

      const refinementContext = {
        highlights: highlights.map(h => h.text),
        approvedClaims: keyClaims.filter(c => c.approved === true).map(c => c.text),
        rejectedClaims: keyClaims.filter(c => c.approved === false).map(c => c.text),
        editedClaims: keyClaims.filter(c => c.edited).map(c => ({ title: c.title, text: c.text })),
        voiceFeedback,
      };

      // Build narrative with new parameters
      const result = await buildNarrative(
        rawText, 
        businessContext, 
        handleProgress,
        {
          audienceMode,
          archetype: selectedArchetype,
          duration,
          includeTensionSlide,
        }
      );

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
        // Limit sections for free users
        if (!isPro && result.narrative.sections.length > limits.maxSections) {
          result.narrative.sections = result.narrative.sections.slice(0, limits.maxSections);
          toast({
            title: "Narrative trimmed",
            description: `Free accounts are limited to ${limits.maxSections} sections. Upgrade to get the full story.`,
          });
        }
        setNarrative(result.narrative);
        
        // Trigger celebration on successful build
        celebration.triggerConfetti();
        celebration.triggerAchievement("Narrative created!", "star");
      }

      // Extract tensions in parallel (non-blocking)
      extractTensions(rawText).then((tensionResult) => {
        if (tensionResult.tensions && tensionResult.tensions.length > 0) {
          setTensions(tensionResult.tensions);
          toast({
            title: `${tensionResult.tensions.length} insight${tensionResult.tensions.length > 1 ? 's' : ''} detected`,
            description: "Review tensions and blind spots in the sidebar.",
          });
        } else if (tensionResult.error) {
          console.warn('[PreviewScreen] Failed to extract tensions:', tensionResult.error);
        }
      }).catch(console.error);

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

  const handleBack = () => {
    setCurrentStep("refine");
  };

  const handlePresent = () => {
    if (!narrative) {
      toast({
        title: "Cannot present",
        description: "Please build your narrative first.",
        variant: "destructive",
      });
      return;
    }
    
    if (narrative.sections.length === 0) {
      toast({
        title: "Cannot present",
        description: "Your narrative has no sections. Please build content first.",
        variant: "destructive",
      });
      return;
    }
    
    console.log('[PreviewScreen] Starting presentation with', narrative.sections.length, 'sections');
    setCurrentSectionIndex(0);
    setCurrentStep("present");
  };

  const handleExport = async (type: 'pdf' | 'pptx') => {
    // Allow free tier to export with watermark
    const allowWatermarkedExport = !isPro;
    
    if (!allowWatermarkedExport && !requireFeature('export')) {
      return;
    }
    
    if (!narrative) {
      toast({
        title: "No narrative",
        description: "Please build a narrative first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const title = businessContext?.companyName || 'Narrative';
      const exportOptions = { 
        watermark: !isPro,
        logoUrl: businessContext?.logoUrl || businessContext?.userUploadedLogoUrl,
        brandColors: businessContext?.brandColors,
        brandFonts: businessContext?.brandFonts,
      };
      
      // Use branded exports when brand context is available and user is Pro
      const useBranded = isPro && (businessContext?.logoUrl || businessContext?.brandColors);
      
      if (type === 'pdf') {
        if (useBranded) {
          await exportBrandedPDF(narrative, businessContext, title, exportOptions);
        } else {
          exportToPDF(narrative, businessContext, title, { watermark: !isPro });
        }
        toast({
          title: "PDF Downloaded",
          description: isPro 
            ? useBranded 
              ? "Your branded narrative has been exported as a PDF."
              : "Your narrative has been exported as a PDF."
            : "PDF exported with Conclusiv watermark. Upgrade for clean exports.",
        });
      } else {
        if (useBranded) {
          await exportBrandedPPTX(narrative, businessContext, title, exportOptions);
        } else {
          exportToPPTX(narrative, businessContext, title);
        }
        toast({
          title: "PowerPoint Downloaded",
          description: isPro
            ? useBranded
              ? "Your branded presentation has been exported."
              : "Your narrative has been exported as a presentation."
            : "Exported with Conclusiv branding. Upgrade for clean exports.",
        });
      }
    } catch (err) {
      toast({
        title: "Export failed",
        description: "There was an error exporting your narrative.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (!requireFeature('export')) {
      return;
    }

    if (!narrative) {
      toast({
        title: "No narrative",
        description: "Please build a narrative first.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to create shareable links.",
        variant: "destructive",
      });
      return;
    }

    setIsSharing(true);
    
    try {
      // Generate unique share ID
      const shareId = crypto.randomUUID().slice(0, 8);
      const title = businessContext?.companyName || 'Shared Narrative';

      // Save to database
      const { error: insertError } = await supabase
        .from("narratives")
        .insert([{
          user_id: user.id,
          narrative_data: JSON.parse(JSON.stringify(narrative)),
          title,
          share_id: shareId,
          is_public: true,
        }]);

      if (insertError) throw insertError;

      const url = `${window.location.origin}/share/${shareId}`;
      setShareUrl(url);
      setLastShareId(shareId);
      setShareDialogOpen(true);
    } catch (err) {
      toast({
        title: "Share failed",
        description: "There was an error creating your shareable link.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Link copied to clipboard.",
    });
  };

  const handleGenerateAlternatives = async () => {
    if (!narrative) return;
    
    setIsGeneratingAlternatives(true);
    setAlternativesPanelOpen(true);
    
    try {
      const result = await generateAlternatives(rawText, narrative, businessContext);
      if (result.alternatives) {
        setAlternatives(result.alternatives);
      }
    } catch (err) {
      toast({
        title: "Failed to generate alternatives",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAlternatives(false);
    }
  };

  // Mobile-first: Use dedicated mobile layout
  if (isMobile) {
    return (
      <>
        {UpgradePromptComponent}
        
        {/* Celebration components */}
        <Confetti isActive={celebration.confetti} />
        <MiniCelebration isActive={celebration.mini} />
        <AchievementToast 
          isVisible={celebration.achievement.show} 
          message={celebration.achievement.message}
          icon={celebration.achievement.icon}
        />
        
        {/* Error Recovery Modal */}
        <AnimatePresence>
          {error && (
            <ErrorRecovery
              error={error}
              onRetry={handleBuild}
              onDismiss={() => setError(null)}
              inputLength={rawText.length}
            />
          )}
        </AnimatePresence>
        
        {/* Share Dialog */}
        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Share your narrative</DialogTitle>
              <DialogDescription>
                Share your narrative with a secure link.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <PasswordProtectedShare
                shareUrl={shareUrl}
                onPasswordSet={setSharePassword}
                currentPassword={sharePassword}
              />
            </div>
          </DialogContent>
        </Dialog>
        
        <MobilePreviewLayout
          onBack={handleBack}
          onPresent={handlePresent}
          onShare={handleShare}
          onExport={() => handleExport('pdf')}
        />
      </>
    );
  }

  return (
    <>
      {UpgradePromptComponent}
      
      {/* Celebration components */}
      <Confetti isActive={celebration.confetti} />
      <MiniCelebration isActive={celebration.mini} />
      <AchievementToast 
        isVisible={celebration.achievement.show} 
        message={celebration.achievement.message}
        icon={celebration.achievement.icon}
      />
      
      {/* Making Of View */}
      <MakingOfView isOpen={makingOfOpen} onClose={() => setMakingOfOpen(false)} />
      
      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share your narrative</DialogTitle>
            <DialogDescription>
              Share your narrative with a secure link. Add password protection for extra security.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <PasswordProtectedShare
              shareUrl={shareUrl}
              onPasswordSet={setSharePassword}
              currentPassword={sharePassword}
            />
            {lastShareId && (
              <PresentationAnalytics 
                shareId={lastShareId} 
                sectionCount={narrative?.sections.length || 0}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Alternative Comparison */}
      <AlternativeComparison
        isOpen={comparisonOpen}
        onClose={() => setComparisonOpen(false)}
      />

      {/* Alternatives Panel */}
      <AlternativesPanel 
        isOpen={alternativesPanelOpen} 
        onClose={() => setAlternativesPanelOpen(false)}
      />

      {/* Error Recovery Modal */}
      <AnimatePresence>
        {error && (
          <ErrorRecovery
            error={error}
            onRetry={handleBuild}
            onDismiss={() => setError(null)}
            inputLength={rawText.length}
          />
        )}
      </AnimatePresence>

      <div className="min-h-[calc(100dvh-4rem)] flex flex-col pb-20 md:pb-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {businessContext && (
            <div className="text-xs text-muted-foreground">
              For <span className="text-shimmer-start">{businessContext.companyName}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {/* Power user features */}
            <NarrativeRemix onRemixComplete={() => celebration.triggerMini()} />
            <MakingOfTrigger onClick={() => setMakingOfOpen(true)} />
            
            {/* Alternatives button */}
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={handleGenerateAlternatives}
              disabled={!narrative || isGeneratingAlternatives}
            >
              <Sparkles className="w-4 h-4 mr-1" />
              {alternatives.length > 0 ? `Alternatives (${alternatives.length})` : "Alternatives"}
            </Button>

            {/* Export dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <Download className="w-4 h-4 mr-1" />
                  Export
                  {!isPro && <Lock className="w-3 h-3 ml-1 opacity-50" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                  <FileText className="w-4 h-4 mr-2" />
                  PDF Document
                  {!isPro && <Lock className="w-3 h-3 ml-auto opacity-50" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('pptx')}>
                  <Presentation className="w-4 h-4 mr-2" />
                  PowerPoint
                  {!isPro && <Lock className="w-3 h-3 ml-auto opacity-50" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={handleShare}
              disabled={isSharing}
            >
              <Share2 className="w-4 h-4 mr-1" />
              {isSharing ? "Creating..." : "Share"}
              {!isPro && <Lock className="w-3 h-3 ml-1 opacity-50" />}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Left Panel - Narrative Score (collapsible) */}
          <AnimatePresence mode="wait">
            {leftPanelOpen ? (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-r border-border/50 hidden lg:flex flex-col overflow-hidden"
              >
                <div className="p-4 overflow-y-auto flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <BarChart3 className="w-3.5 h-3.5" />
                      Narrative Score
                    </h3>
                    <button
                      onClick={() => setLeftPanelOpen(false)}
                      className="p-1 rounded hover:bg-muted transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                  
                  {/* Quality Score */}
                  {narrative && (
                    <div className="mb-6">
                      <NarrativeQualityScore />
                    </div>
                  )}
                  
                  {/* Improve My Score */}
                  {narrative && (
                    <div className="mb-6">
                      <ImproveMyScore />
                    </div>
                  )}
                  
                  {/* Executive Summary */}
                  {narrative && (
                    <ExecutiveSummary />
                  )}
                  
                  {/* Compare Alternatives */}
                  {alternatives.length > 0 && (
                    <button
                      onClick={() => setComparisonOpen(true)}
                      className="w-full mt-4 p-3 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors text-sm text-left"
                    >
                      <span className="font-medium">Compare Alternatives</span>
                      <span className="text-xs text-muted-foreground block mt-0.5">
                        {alternatives.length} alternative{alternatives.length > 1 ? 's' : ''} available
                      </span>
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hidden lg:flex flex-col items-center py-4 px-2 border-r border-border/50"
              >
                <button
                  onClick={() => setLeftPanelOpen(true)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors group"
                  title="Show narrative score"
                >
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                </button>
                {narrative && (
                  <div className="mt-4 writing-mode-vertical text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" />
                      Score
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Preview Area */}
          <div className="flex-1 flex flex-col">
            {/* Mode Toggle */}
            <div className="flex justify-center py-4">
              <div className="flex items-center gap-1 p-1 rounded-lg bg-card border border-border/50">
                <button
                  onClick={() => setViewMode("present")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors",
                    viewMode === "present"
                      ? "bg-shimmer-start/20 text-shimmer-start"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Play className="w-3 h-3" />
                  Present
                </button>
                <button
                  onClick={() => setViewMode("reader")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors",
                    viewMode === "reader"
                      ? "bg-shimmer-start/20 text-shimmer-start"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <BookOpen className="w-3 h-3" />
                  Read
                </button>
                <button
                  onClick={() => setViewMode("external")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors",
                    viewMode === "external"
                      ? "bg-shimmer-start/20 text-shimmer-start"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <ExternalLink className="w-3 h-3" />
                  External
                </button>
              </div>
            </div>

            {/* Preview Window - Logo rendered outside overflow-hidden to prevent clipping */}
            <div className="flex-1 mx-4 mb-4 relative min-h-[50vh] lg:min-h-0">
              {/* Brand Logo Overlay - positioned outside the clipped container */}
              <BrandLogoOverlay />
              
              {/* Actual preview container with overflow hidden */}
              <div className="h-full rounded-xl border border-border/50 bg-card/30 overflow-hidden">
                <NarrativePreview showLogo={false} />
              </div>
            </div>
            
            {/* Mobile Inline Score & Summary - only on mobile when narrative exists */}
            {isMobile && narrative && (
              <div className="mx-4 mb-4 p-4 rounded-xl bg-card/50 border border-border/50 space-y-4">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <BarChart3 className="w-3.5 h-3.5" />
                  Narrative Score
                </div>
                <NarrativeQualityScore />
                <ExecutiveSummary />
              </div>
            )}
          </div>

          {/* Right Sidebar - Editing Features Only */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-72 border-l border-border/50 p-4 hidden lg:block overflow-y-auto max-h-[calc(100vh-10rem)]"
          >
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
              Quick Adjustments
            </h3>
            <QuickAdjustments />
          </motion.div>
        </div>

        {/* Footer CTA */}
        <div className="flex justify-center p-4 border-t border-border/50">
          <Button variant="shimmer" size="lg" onClick={handlePresent} disabled={!narrative}>
            <Play className="w-4 h-4 mr-2" />
            Present
          </Button>
        </div>
      </div>
    </>
  );
};

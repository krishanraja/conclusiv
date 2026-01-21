import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNarrativeStore } from "@/store/narrativeStore";
import { useToast } from "@/hooks/use-toast";
import { extractKeyClaims, analyzeClaimAlignment } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HighlightableText } from "./HighlightableText";
import { ClaimCard } from "./ClaimCard";
import { NarrativeGoalCapture } from "./NarrativeGoalCapture";
import { GuidedVoiceFlow } from "./GuidedVoiceFlow";
import { ArrowLeft, ArrowRight, Highlighter, MessageCircleQuestion, Mic, Loader2, Sparkles, Check, Info, Target, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHaptics } from "@/hooks/useHaptics";
import { useIsMobile } from "@/hooks/use-mobile";
import type { ClaimAlignment } from "@/lib/types";

export const RefineScreen = () => {
  const { toast } = useToast();
  const haptics = useHaptics();
  const isMobile = useIsMobile();
  const {
    rawText,
    setCurrentStep,
    highlights,
    setHighlights,
    keyClaims,
    setKeyClaims,
    approveClaim,
    rejectClaim,
    updateClaim,
    swapClaimAlternative,
    voiceFeedback,
    setVoiceFeedback,
    // Narrative goal
    narrativeGoal,
    extractedNarrativeIntent,
    narrativeGoalConfirmed,
    setNarrativeGoalConfirmed,
  } = useNarrativeStore();

  const [activeTab, setActiveTab] = useState<string>("claims");
  const [isExtractingClaims, setIsExtractingClaims] = useState(false);
  const [claimsLoaded, setClaimsLoaded] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isAnalyzingAlignment, setIsAnalyzingAlignment] = useState(false);
  const [showGoalCapture, setShowGoalCapture] = useState(!narrativeGoalConfirmed);

  // Auto-hide hint after interaction or timeout
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 6000);
    return () => clearTimeout(timer);
  }, []);

  // Auto-hide onboarding after first tab interaction
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('conclusiv_refine_onboarding_seen');
    if (hasSeenOnboarding) {
      setShowOnboarding(false);
    }
  }, []);

  // Client-side filter for low-value claims (safety net)
  const filterLowValueClaims = (claims: typeof keyClaims) => {
    const lowValuePatterns = [
      /no\s+(direct\s+)?match(es)?\s+found/i,
      /no\s+results/i,
      /not\s+found/i,
      /unable\s+to\s+find/i,
      /could\s+not\s+(find|locate)/i,
      /no\s+specific/i,
      /no\s+evidence/i,
      /none\s+identified/i,
    ];
    
    return claims.filter(claim => {
      const combined = `${claim.title} ${claim.text}`.toLowerCase();
      return !lowValuePatterns.some(pattern => pattern.test(combined));
    });
  };

  // Analyze claim alignment with narrative goal
  const analyzeClaimsAlignment = async (claims: typeof keyClaims) => {
    if (!extractedNarrativeIntent?.coreMessage || claims.length === 0) return;
    
    setIsAnalyzingAlignment(true);
    try {
      const result = await analyzeClaimAlignment(
        claims.map(c => ({ id: c.id, title: c.title, text: c.text })),
        extractedNarrativeIntent.coreMessage
      );
      
      if (result.claims) {
        // Update claims with alignment data
        result.claims.forEach(alignedClaim => {
          updateClaim(alignedClaim.id, {
            ...keyClaims.find(c => c.id === alignedClaim.id),
            alignment: alignedClaim.alignment as ClaimAlignment,
            alignmentReason: alignedClaim.reason,
          } as any);
        });
      }
    } catch (err) {
      console.error("Failed to analyze claim alignment:", err);
    } finally {
      setIsAnalyzingAlignment(false);
    }
  };

  // Extract claims when switching to claims tab
  const handleTabChange = async (value: string) => {
    haptics.selection();
    setActiveTab(value);
    setShowHint(false); // Hide hint on any tab interaction
    
    // Dismiss onboarding on first interaction
    if (showOnboarding) {
      setShowOnboarding(false);
      localStorage.setItem('conclusiv_refine_onboarding_seen', 'true');
    }
    
    if (value === "claims" && !claimsLoaded && keyClaims.length === 0) {
      setIsExtractingClaims(true);
      try {
        const result = await extractKeyClaims(rawText);
        if (result.claims) {
          // Filter out any low-value claims that slipped through
          const filteredClaims = filterLowValueClaims(result.claims);
          setKeyClaims(filteredClaims);
          setClaimsLoaded(true);
          
          // Analyze alignment if we have a narrative goal
          if (extractedNarrativeIntent?.coreMessage) {
            await analyzeClaimsAlignment(filteredClaims);
          }
        } else if (result.error) {
          toast({
            title: "Couldn't extract claims",
            description: result.error,
            variant: "destructive",
          });
        }
      } catch (err) {
        console.error("Failed to extract claims:", err);
      } finally {
        setIsExtractingClaims(false);
      }
    }
  };

  // Load claims on mount if tab is claims
  useEffect(() => {
    if (activeTab === "claims" && !claimsLoaded && keyClaims.length === 0) {
      handleTabChange("claims");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claimsLoaded, keyClaims.length]);

  const handleBack = () => {
    haptics.light();
    setCurrentStep("input");
  };

  const handleContinue = () => {
    haptics.medium();
    setCurrentStep("preview");
  };

  // Stats
  const approvedCount = keyClaims.filter(c => c.approved === true).length;
  const rejectedCount = keyClaims.filter(c => c.approved === false).length;
  const editedCount = keyClaims.filter(c => c.edited).length;

  // Handle goal capture completion
  const handleGoalCaptureComplete = () => {
    setShowGoalCapture(false);
    // If we already have claims, analyze their alignment
    if (keyClaims.length > 0 && extractedNarrativeIntent?.coreMessage) {
      analyzeClaimsAlignment(keyClaims);
    }
  };

  // Tab descriptions - now context-aware
  const getTabDescription = () => {
    if (extractedNarrativeIntent?.coreMessage) {
      const descriptions: Record<string, string> = {
        claims: "Review claims aligned with your narrative goal",
        highlight: "Select passages that support your message",
        voice: "Add context with guided voice prompts",
      };
      return descriptions[activeTab];
    }
    return {
      claims: "Review AI-extracted claims and approve or edit",
      highlight: "Select key passages to emphasize",
      voice: "Record voice notes for additional context",
    }[activeTab];
  };

  // Show goal capture screen first if not confirmed
  if (showGoalCapture) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={handleBack} className="h-9 px-2 md:px-4">
            <ArrowLeft className="w-4 h-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Back</span>
          </Button>
        </div>
        
        <NarrativeGoalCapture
          onComplete={handleGoalCaptureComplete}
          onSkip={handleGoalCaptureComplete}
        />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col p-4 md:p-6 pt-4 md:pt-6">
      {/* Header - Compact on mobile, no extra gap */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <Button variant="ghost" size="sm" onClick={handleBack} className="h-9 px-2 md:px-4">
          <ArrowLeft className="w-4 h-4 mr-1 md:mr-2" />
          <span className="hidden sm:inline">Back</span>
        </Button>
        <Button variant="shimmer" size="sm" onClick={handleContinue} className="h-9 px-3 md:px-4">
          Continue
          <ArrowRight className="w-4 h-4 ml-1 md:ml-2" />
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 max-w-4xl mx-auto w-full space-y-4 md:space-y-6"
      >
        {/* Narrative Goal Banner - persistent reminder */}
        {extractedNarrativeIntent?.coreMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Target className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Your narrative goal</p>
                <p className="text-sm font-medium text-foreground truncate">
                  {extractedNarrativeIntent.coreMessage}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setNarrativeGoalConfirmed(false);
                setShowGoalCapture(true);
              }}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 shrink-0"
            >
              <Edit3 className="w-3 h-3" />
              Edit
            </button>
          </motion.div>
        )}

        {/* Title - Compact on mobile */}
        <div className="text-center space-y-1 md:space-y-2">
          <h1 className="text-xl md:text-3xl font-bold text-foreground">
            Fine-tune your research
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Make it yours before we build your story
          </p>
        </div>

        {/* Tabs - 3 options with better visual guidance */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          {/* Onboarding overlay for first-time users - shows the three options clearly */}
          <AnimatePresence>
            {showOnboarding && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="mb-4 p-4 rounded-xl bg-primary/5 border border-primary/20"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Info className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground mb-2">
                      Three ways to refine your story
                    </p>
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MessageCircleQuestion className="w-3.5 h-3.5 text-primary" />
                        <span><strong>Review</strong> — Approve or edit AI-extracted claims</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Highlighter className="w-3.5 h-3.5 text-primary" />
                        <span><strong>Highlight</strong> — Select key passages to emphasize</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mic className="w-3.5 h-3.5 text-primary" />
                        <span><strong>Voice</strong> — Record verbal notes for context</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowOnboarding(false);
                        localStorage.setItem('conclusiv_refine_onboarding_seen', 'true');
                      }}
                      className="mt-3 text-xs text-primary hover:underline"
                    >
                      Got it, don't show again
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Animated hint for returning users (shorter, simpler) */}
          <AnimatePresence>
            {showHint && !showOnboarding && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-center gap-2 mb-3 text-xs text-primary"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Choose how you'd like to refine your content</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tabs - Clear 3-option layout with visual distinction */}
          <TabsList className="grid w-full grid-cols-3 mb-4 h-auto p-1.5 bg-muted/50 rounded-xl">
            <TabsTrigger 
              value="claims" 
              className={cn(
                "flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg",
                "data-[state=active]:bg-card data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-primary/20",
                "transition-all duration-200"
              )}
            >
              <div className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center transition-colors",
                activeTab === "claims" ? "bg-primary/10" : "bg-transparent"
              )}>
                <MessageCircleQuestion className={cn(
                  "w-5 h-5 transition-colors",
                  activeTab === "claims" ? "text-primary" : "text-muted-foreground"
                )} />
              </div>
              <span className={cn(
                "text-xs font-medium transition-colors",
                activeTab === "claims" ? "text-foreground" : "text-muted-foreground"
              )}>Review</span>
            </TabsTrigger>
            <TabsTrigger 
              value="highlight" 
              className={cn(
                "flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg",
                "data-[state=active]:bg-card data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-primary/20",
                "transition-all duration-200"
              )}
            >
              <div className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center transition-colors",
                activeTab === "highlight" ? "bg-primary/10" : "bg-transparent"
              )}>
                <Highlighter className={cn(
                  "w-5 h-5 transition-colors",
                  activeTab === "highlight" ? "text-primary" : "text-muted-foreground"
                )} />
              </div>
              <span className={cn(
                "text-xs font-medium transition-colors",
                activeTab === "highlight" ? "text-foreground" : "text-muted-foreground"
              )}>Highlight</span>
            </TabsTrigger>
            <TabsTrigger 
              value="voice" 
              className={cn(
                "flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg",
                "data-[state=active]:bg-card data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-primary/20",
                "transition-all duration-200"
              )}
            >
              <div className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center transition-colors",
                activeTab === "voice" ? "bg-primary/10" : "bg-transparent"
              )}>
                <Mic className={cn(
                  "w-5 h-5 transition-colors",
                  activeTab === "voice" ? "text-primary" : "text-muted-foreground"
                )} />
              </div>
              <span className={cn(
                "text-xs font-medium transition-colors",
                activeTab === "voice" ? "text-foreground" : "text-muted-foreground"
              )}>Voice</span>
            </TabsTrigger>
          </TabsList>

          {/* Dynamic description based on active tab */}
          <motion.p
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm text-muted-foreground mb-4"
          >
            {getTabDescription()}
          </motion.p>

          {/* Claims Tab */}
          <TabsContent value="claims" className="space-y-4">
            {isExtractingClaims ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Extracting key claims...</p>
              </div>
            ) : keyClaims.length > 0 ? (
              <>
                {/* Verification Progress */}
                {(() => {
                  const verifiedCount = keyClaims.filter(c => c.verification).length;
                  const verifyingCount = keyClaims.filter(c => !c.verification).length;
                  const progressPercent = (verifiedCount / keyClaims.length) * 100;
                  const isVerifying = verifyingCount > 0;

                  return isVerifying ? (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mb-4 p-3 rounded-lg border border-primary/20 bg-primary/5"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          <span className="text-sm font-medium">Verifying claims...</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {verifiedCount} of {keyClaims.length} verified
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercent}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </motion.div>
                  ) : null;
                })()}

                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>Review {keyClaims.length} key claims</span>
                  <div className="flex gap-4">
                    <span className="text-green-500">{approvedCount} approved</span>
                    <span className="text-red-500">{rejectedCount} rejected</span>
                    {editedCount > 0 && (
                      <span className="text-blue-500">{editedCount} edited</span>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  {keyClaims.map((claim, index) => (
                    <ClaimCard
                      key={claim.id}
                      claim={claim}
                      index={index}
                      total={keyClaims.length}
                      onApprove={() => approveClaim(claim.id)}
                      onReject={() => rejectClaim(claim.id)}
                      onUpdate={(updates) => updateClaim(claim.id, updates)}
                      onSwapAlternative={(altIndex) => swapClaimAlternative(claim.id, altIndex)}
                      autoVerify
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <p>No claims to review yet</p>
              </div>
            )}
          </TabsContent>

          {/* Highlight Tab */}
          <TabsContent value="highlight">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select text you want to emphasize in your story
              </p>
              <HighlightableText
                text={rawText}
                highlights={highlights}
                onHighlight={(highlight) => setHighlights([...highlights, highlight])}
                onRemoveHighlight={(index) => 
                  setHighlights(highlights.filter((_, i) => i !== index))
                }
              />
              {highlights.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {highlights.length} selection{highlights.length !== 1 ? 's' : ''} highlighted
                </div>
              )}
            </div>
          </TabsContent>

          {/* Voice Tab - Now with guided prompts */}
          <TabsContent value="voice">
            <GuidedVoiceFlow />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};
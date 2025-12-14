import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNarrativeStore } from "@/store/narrativeStore";
import { useToast } from "@/hooks/use-toast";
import { extractKeyClaims } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HighlightableText } from "./HighlightableText";
import { ClaimCard } from "./ClaimCard";
import { VoiceRefinement } from "./VoiceRefinement";
import { ArrowLeft, ArrowRight, Highlighter, MessageCircleQuestion, Mic, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHaptics } from "@/hooks/useHaptics";

export const RefineScreen = () => {
  const { toast } = useToast();
  const haptics = useHaptics();
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
    voiceFeedback,
    setVoiceFeedback,
  } = useNarrativeStore();

  const [activeTab, setActiveTab] = useState<string>("claims");
  const [isExtractingClaims, setIsExtractingClaims] = useState(false);
  const [claimsLoaded, setClaimsLoaded] = useState(false);
  const [showHint, setShowHint] = useState(true);

  // Auto-hide hint after interaction or timeout
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 6000);
    return () => clearTimeout(timer);
  }, []);

  // Extract claims when switching to claims tab
  const handleTabChange = async (value: string) => {
    haptics.selection();
    setActiveTab(value);
    setShowHint(false); // Hide hint on any tab interaction
    
    if (value === "claims" && !claimsLoaded && keyClaims.length === 0) {
      setIsExtractingClaims(true);
      try {
        const result = await extractKeyClaims(rawText);
        if (result.claims) {
          setKeyClaims(result.claims);
          setClaimsLoaded(true);
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

  // Tab descriptions for better guidance
  const tabDescriptions: Record<string, string> = {
    claims: "Review AI-extracted claims and approve or edit",
    highlight: "Select key passages to emphasize",
    voice: "Record voice notes for additional context",
  };

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
          {/* Animated hint for first-time users */}
          <AnimatePresence>
            {showHint && (
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

          <TabsList className="grid w-full grid-cols-3 mb-4 h-auto p-1 bg-muted/50">
            <TabsTrigger 
              value="claims" 
              className={cn(
                "flex flex-col items-center gap-1.5 py-3 px-2 data-[state=active]:bg-card data-[state=active]:shadow-sm",
                "transition-all duration-200"
              )}
            >
              <MessageCircleQuestion className={cn(
                "w-5 h-5 transition-colors",
                activeTab === "claims" ? "text-primary" : "text-muted-foreground"
              )} />
              <span className="text-xs font-medium">Review</span>
            </TabsTrigger>
            <TabsTrigger 
              value="highlight" 
              className={cn(
                "flex flex-col items-center gap-1.5 py-3 px-2 data-[state=active]:bg-card data-[state=active]:shadow-sm",
                "transition-all duration-200"
              )}
            >
              <Highlighter className={cn(
                "w-5 h-5 transition-colors",
                activeTab === "highlight" ? "text-primary" : "text-muted-foreground"
              )} />
              <span className="text-xs font-medium">Highlight</span>
            </TabsTrigger>
            <TabsTrigger 
              value="voice" 
              className={cn(
                "flex flex-col items-center gap-1.5 py-3 px-2 data-[state=active]:bg-card data-[state=active]:shadow-sm",
                "transition-all duration-200"
              )}
            >
              <Mic className={cn(
                "w-5 h-5 transition-colors",
                activeTab === "voice" ? "text-primary" : "text-muted-foreground"
              )} />
              <span className="text-xs font-medium">Voice</span>
            </TabsTrigger>
          </TabsList>

          {/* Dynamic description based on active tab */}
          <motion.p
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm text-muted-foreground mb-4"
          >
            {tabDescriptions[activeTab]}
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

          {/* Voice Tab */}
          <TabsContent value="voice">
            <VoiceRefinement
              feedback={voiceFeedback}
              onFeedbackChange={setVoiceFeedback}
            />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNarrativeStore } from "@/store/narrativeStore";
import { useToast } from "@/hooks/use-toast";
import { extractKeyClaims } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HighlightableText } from "./HighlightableText";
import { ClaimCard } from "./ClaimCard";
import { VoiceRefinement } from "./VoiceRefinement";
import { ClaimToSlideMapping } from "./ClaimToSlideMapping";
import { ArrowLeft, ArrowRight, Highlighter, MessageCircleQuestion, Mic, Loader2, Presentation } from "lucide-react";

export const RefineScreen = () => {
  const { toast } = useToast();
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
    setIsLoading,
    narrative,
  } = useNarrativeStore();

  const [activeTab, setActiveTab] = useState<string>("claims");
  const [isExtractingClaims, setIsExtractingClaims] = useState(false);
  const [claimsLoaded, setClaimsLoaded] = useState(false);

  // Extract claims when switching to claims tab
  const handleTabChange = async (value: string) => {
    setActiveTab(value);
    
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
    setCurrentStep("input");
  };

  const handleContinue = () => {
    setCurrentStep("preview");
  };

  // Stats
  const approvedCount = keyClaims.filter(c => c.approved === true).length;
  const rejectedCount = keyClaims.filter(c => c.approved === false).length;
  const editedCount = keyClaims.filter(c => c.edited).length;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col p-6 pt-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button variant="shimmer" onClick={handleContinue}>
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 max-w-4xl mx-auto w-full space-y-8"
      >
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Fine-tune your research
          </h1>
          <p className="text-muted-foreground">
            Make it yours before we build your story
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="claims" className="flex items-center gap-2">
              <MessageCircleQuestion className="w-4 h-4" />
              <span className="hidden sm:inline">Quick Q's</span>
            </TabsTrigger>
            <TabsTrigger value="highlight" className="flex items-center gap-2">
              <Highlighter className="w-4 h-4" />
              <span className="hidden sm:inline">Highlight</span>
            </TabsTrigger>
            <TabsTrigger value="voice" className="flex items-center gap-2">
              <Mic className="w-4 h-4" />
              <span className="hidden sm:inline">Voice</span>
            </TabsTrigger>
            <TabsTrigger value="mapping" className="flex items-center gap-2" disabled={!narrative}>
              <Presentation className="w-4 h-4" />
              <span className="hidden sm:inline">Mapping</span>
            </TabsTrigger>
          </TabsList>

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

          {/* Mapping Tab */}
          <TabsContent value="mapping">
            <ClaimToSlideMapping />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};
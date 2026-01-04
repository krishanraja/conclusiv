import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, Loader2, ExternalLink, Mic, MicOff, CheckCircle2, Clock, RefreshCw, ChevronDown, ChevronUp, Edit3, Building2, Target, Users, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { formulateResearchQuery, executeResearch, structureVoiceInput, fetchBrandData } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWhisperRecorder } from "@/hooks/useWhisperRecorder";
import { useToast } from "@/hooks/use-toast";
import { useResearchJob, ResearchJob } from "@/hooks/useResearchJob";
import { useNarrativeStore } from "@/store/narrativeStore";
import type { NarrativeArchetype, AudienceMode } from "@/lib/types";
import conclusivIcon from "@/assets/conclusiv-icon.png";

interface ResearchAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (researchContent: string) => void;
}

// Map archetypes to research decision types
const archetypeToDecisionType: Record<NarrativeArchetype, { id: string; label: string }> = {
  strategy_brief: { id: "future", label: "Trend Analysis" },
  exec_decision_memo: { id: "invest", label: "Investment Decision" },
  investor_pitch: { id: "opportunity", label: "Opportunity Sizing" },
  gtm_plan: { id: "market", label: "Market Entry" },
  problem_framing: { id: "compete", label: "Competitive Analysis" },
  root_cause: { id: "compete", label: "Competitive Analysis" },
  workshop_outline: { id: "future", label: "Trend Analysis" },
  competitive_teardown: { id: "compete", label: "Competitive Analysis" },
};

// Map audience modes to research audience
const audienceModeToResearchAudience: Record<AudienceMode, string> = {
  exec: "execs",
  product: "team",
  investors: "investors",
  clients: "team",
  ops: "team",
  briefing: "execs",
};

// Decision type labels for display
const decisionLabels: Record<string, string> = {
  invest: "Investment Decision",
  market: "Market Entry",
  compete: "Competitive Analysis",
  future: "Trend Analysis",
  partner: "Due Diligence",
  opportunity: "Opportunity Sizing",
};

// Audience labels for display
const audienceLabels: Record<string, string> = {
  self: "Just me",
  team: "My team",
  execs: "Executives",
  investors: "Investors",
};

export const ResearchAssistant = ({ isOpen, onClose, onComplete }: ResearchAssistantProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Get existing data from narrative store
  const { 
    businessContext, 
    businessWebsite, 
    selectedArchetype, 
    audienceMode,
    setCurrentStep,
  } = useNarrativeStore();

  // Derive initial values from store
  const initialDecision = useMemo(() => {
    if (selectedArchetype && archetypeToDecisionType[selectedArchetype]) {
      return archetypeToDecisionType[selectedArchetype].id;
    }
    return "partner";
  }, [selectedArchetype]);

  const initialAudience = useMemo(() => {
    if (audienceMode && audienceModeToResearchAudience[audienceMode]) {
      return audienceModeToResearchAudience[audienceMode];
    }
    return "self";
  }, [audienceMode]);

  // Core state
  const [step, setStep] = useState<"input" | "research" | "results">("input");
  const [isLoading, setIsLoading] = useState(false);
  const [researchDepth, setResearchDepth] = useState<"quick" | "deep">("quick");
  const [researchError, setResearchError] = useState<string | null>(null);
  const [showContextEditor, setShowContextEditor] = useState(false);

  // Context fields - auto-populated from store
  const [companyName, setCompanyName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [industry, setIndustry] = useState("");
  const [decisionType, setDecisionType] = useState(initialDecision);
  const [audience, setAudience] = useState(initialAudience);

  // The main input field
  const [primaryQuestion, setPrimaryQuestion] = useState("");
  
  // AI-extracted fields (from voice input)
  const [aiExtractedContext, setAiExtractedContext] = useState<{
    concerns?: string;
    successCriteria?: string;
    redFlags?: string;
  } | null>(null);

  // Brand fetching
  const [isFetchingBrand, setIsFetchingBrand] = useState(false);
  const [brandFetched, setBrandFetched] = useState(false);

  // Voice input
  const [isStructuringVoice, setIsStructuringVoice] = useState(false);

  // Results
  const [results, setResults] = useState<{
    summary: string;
    keyFindings: string[];
    citations: { url: string; title: string }[];
    rawContent: string;
  } | null>(null);

  // Auto-populate from store when opening - ALWAYS sync, don't guard with existing values
  useEffect(() => {
    if (isOpen) {
      // Always sync from store to ensure latest data
      if (businessContext?.companyName) {
        setCompanyName(businessContext.companyName);
      }
      if (businessContext?.industry) {
        setIndustry(businessContext.industry);
      }
      if (businessWebsite) {
        setWebsiteUrl(businessWebsite);
        setBrandFetched(true);
      }
      setDecisionType(initialDecision);
      setAudience(initialAudience);
    }
  }, [isOpen, businessContext, businessWebsite, initialDecision, initialAudience]);

  // Background job hook
  const handleJobComplete = useCallback((job: ResearchJob) => {
    if (job.results) {
      setResults(job.results);
      setStep("results");
      setIsLoading(false);
      
      if (user) {
        supabase.from("research_history").insert({
          user_id: user.id,
          query: job.query,
          subject: job.subject,
          decision_type: job.decision_type,
          audience: job.audience,
          results: job.results,
        }).then(({ error }) => {
          if (error) console.error('Failed to save research history:', error);
        });
      }
    }
  }, [user]);

  const handleJobError = useCallback((error: string) => {
    setResearchError(error);
    setIsLoading(false);
    toast({
      title: "Research failed",
      description: error,
      variant: "destructive",
    });
  }, [toast]);

  const { 
    currentJob, 
    isPolling, 
    formattedElapsedTime, 
    createJob,
    checkExistingJobs,
    cancelPolling,
  } = useResearchJob({
    onComplete: handleJobComplete,
    onError: handleJobError,
  });

  // Check for existing jobs when opening
  useEffect(() => {
    if (isOpen && user) {
      checkExistingJobs().then((job) => {
        if (job) {
          setStep("research");
          setIsLoading(true);
          // Silently resume - UI shows progress
        }
      });
    }
  }, [isOpen, user, checkExistingJobs, toast]);

  // Voice recorder with AI structuring
  const handleTranscript = useCallback(async (transcript: string) => {
    setPrimaryQuestion(prev => prev ? prev + " " + transcript : transcript);
    
    // Structure the voice input with AI
    if (transcript.length > 20) {
      setIsStructuringVoice(true);
      try {
        const result = await structureVoiceInput(transcript, decisionLabels[decisionType] || "analysis");
        if (result.structured) {
          // Auto-fill company if extracted and we don't have one
          if (result.structured.companyName && !companyName) {
            setCompanyName(result.structured.companyName);
          }
          if (result.structured.industry && !industry) {
            setIndustry(result.structured.industry);
          }
          // Store AI-extracted context
          if (result.structured.knownConcerns || result.structured.successCriteria || result.structured.redFlags) {
            setAiExtractedContext({
              concerns: result.structured.knownConcerns,
              successCriteria: result.structured.successCriteria,
              redFlags: result.structured.redFlags,
            });
          }
          // Silently extracted - no toast needed
        }
      } catch (err) {
        console.error("Voice structuring error:", err);
      } finally {
        setIsStructuringVoice(false);
      }
    }
  }, [companyName, industry, decisionType]);

  const handleVoiceError = useCallback((error: string) => {
    toast({
      title: "Voice input error",
      description: error,
      variant: "destructive",
    });
  }, [toast]);

  const { isRecording, isTranscribing, isSupported, toggleRecording, recordingDuration } = useWhisperRecorder({
    onTranscript: handleTranscript,
    onError: handleVoiceError,
    maxDuration: 60000,
  });

  // URL auto-fetch
  useEffect(() => {
    const url = websiteUrl.trim();
    if (!url || brandFetched) return;
    
    const isValidUrl = (u: string) => {
      const domainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]\.[a-zA-Z]{2,}/;
      const urlPattern = /^https?:\/\/.+/;
      return domainPattern.test(u) || urlPattern.test(u);
    };

    if (!isValidUrl(url)) return;
    const cleanUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (cleanUrl.length < 4) return;

    const timeoutId = setTimeout(async () => {
      setIsFetchingBrand(true);
      try {
        const result = await fetchBrandData(cleanUrl);
        if (result.data?.companyName && !companyName) {
          setCompanyName(result.data.companyName);
        }
        setBrandFetched(true);
      } catch (err) {
        console.error("Brand fetch error:", err);
      } finally {
        setIsFetchingBrand(false);
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [websiteUrl, brandFetched, companyName]);

  useEffect(() => {
    setBrandFetched(false);
  }, [websiteUrl]);

  const formatDuration = (ms: number) => `${Math.floor(ms / 1000)}s`;

  const canStartResearch = primaryQuestion.trim().length >= 5 && companyName.trim().length >= 2;

  const handleStartResearch = async () => {
    if (!canStartResearch) return;

    setStep("research");
    setIsLoading(true);
    setResearchError(null);

    try {
      const formResult = await formulateResearchQuery({
        decisionType: decisionLabels[decisionType] || "analysis",
        companyName,
        websiteUrl,
        industry,
        primaryQuestion,
        knownConcerns: aiExtractedContext?.concerns || "",
        successCriteria: aiExtractedContext?.successCriteria || "",
        redFlags: aiExtractedContext?.redFlags || "",
        audience: audience || undefined,
      });

      const query = formResult.suggestedQuery || primaryQuestion;

      if (researchDepth === "deep" && user) {
        const job = await createJob({
          query,
          depth: researchDepth,
          subject: companyName,
          decisionType,
          audience: audience || undefined,
        });

        if (!job) {
          setStep("input");
          setIsLoading(false);
        }
      } else {
        const result = await executeResearch(query, researchDepth);
        if (result.error) {
          setResearchError(result.error);
          toast({
            title: "Research error",
            description: result.error,
            variant: "destructive",
          });
          setStep("input");
        } else {
          const researchResults = {
            summary: result.summary || "",
            keyFindings: result.keyFindings || [],
            citations: result.citations || [],
            rawContent: result.rawContent || "",
          };
          setResults(researchResults);
          setStep("results");
          
          if (user) {
            try {
              const { error } = await supabase.from("research_history").insert({
                user_id: user.id,
                query,
                subject: companyName,
                decision_type: decisionType,
                audience,
                results: researchResults,
              });
              
              if (error) {
                console.error("Failed to save research history:", error);
              }
            } catch (err) {
              console.error("Failed to save research history (exception):", err);
            }
          }
        }
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Research error:", err);
      setResearchError(err instanceof Error ? err.message : "Research failed");
      setStep("input");
      setIsLoading(false);
    }
  };

  const handleUseResearch = () => {
    if (results?.rawContent) {
      const citationText = results.citations.length > 0
        ? `\n\n---\nSources:\n${results.citations.map((c, i) => `[${i + 1}] ${c.title}: ${c.url}`).join('\n')}`
        : '';
      
      // Check if user already has brand context and story type configured
      const hasFullContext = businessContext?.companyName && selectedArchetype;
      
      onComplete(results.rawContent + citationText);
      onClose();
      resetState();
      
      // If context is complete, auto-skip to refine step
      if (hasFullContext) {
        // Small delay to let state updates settle
        setTimeout(() => {
          setCurrentStep("refine");
        }, 100);
      }
    }
  };

  const resetState = () => {
    cancelPolling();
    setStep("input");
    setPrimaryQuestion("");
    setResults(null);
    setResearchError(null);
    setIsLoading(false);
    setShowContextEditor(false);
    setAiExtractedContext(null);
  };

  // Check if we have pre-populated context
  const hasContext = companyName || industry || websiteUrl;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); resetState(); } }}>
      <SheetContent side="left" className="w-full sm:max-w-md h-[100dvh] flex flex-col overflow-hidden border-r border-primary/20 px-4 sm:px-6">
        <SheetHeader className="mb-2">
          <SheetTitle className="flex items-center gap-2 justify-center">
            <div className="relative p-2 rounded-lg bg-primary/10">
              <img 
                src={conclusivIcon} 
                alt="" 
                className="w-5 h-5 object-contain"
              />
              <motion.div
                className="absolute inset-0 rounded-lg bg-primary/20"
                animate={{ 
                  opacity: [0.2, 0.5, 0.2],
                  scale: [1, 1.15, 1],
                }}
                transition={{ 
                  duration: 2.5, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>
            Research Assistant
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* Input Step - Voice-First Design */}
            {step === "input" && (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Compact Context Card - Read-Only by Default */}
                {hasContext && !showContextEditor && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg border border-border/50 bg-muted/30"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground">Research Context</span>
                      <button
                        onClick={() => setShowContextEditor(true)}
                        className="p-1 rounded hover:bg-muted transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {companyName && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Building2 className="w-3 h-3" />
                          {companyName}
                        </Badge>
                      )}
                      {industry && (
                        <Badge variant="outline" className="text-xs">
                          {industry}
                        </Badge>
                      )}
                      {decisionType && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Target className="w-3 h-3" />
                          {decisionLabels[decisionType] || decisionType}
                        </Badge>
                      )}
                      {audience && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Users className="w-3 h-3" />
                          {audienceLabels[audience] || audience}
                        </Badge>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Context Editor (Collapsible) */}
                <Collapsible open={showContextEditor || !hasContext} onOpenChange={setShowContextEditor}>
                  {hasContext && (
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-between text-xs text-muted-foreground h-8">
                        {showContextEditor ? "Hide context editor" : "Edit research context"}
                        {showContextEditor ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </CollapsibleTrigger>
                  )}
                  <CollapsibleContent className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Company</label>
                        <Input
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="Company name"
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Website</label>
                        <div className="relative">
                          <Input
                            value={websiteUrl}
                            onChange={(e) => setWebsiteUrl(e.target.value)}
                            placeholder="example.com"
                            className="h-9 text-sm pr-8"
                          />
                          {isFetchingBrand && (
                            <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
                          )}
                          {brandFetched && !isFetchingBrand && (
                            <CheckCircle2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Industry</label>
                      <Input
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        placeholder="e.g., Technology, Healthcare"
                        className="h-9 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Research Type</label>
                        <select
                          value={decisionType}
                          onChange={(e) => setDecisionType(e.target.value)}
                          className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                        >
                          <option value="partner">Due Diligence</option>
                          <option value="invest">Investment</option>
                          <option value="market">Market Entry</option>
                          <option value="compete">Competitive</option>
                          <option value="future">Trends</option>
                          <option value="opportunity">Opportunity</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Audience</label>
                        <select
                          value={audience}
                          onChange={(e) => setAudience(e.target.value)}
                          className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                        >
                          <option value="self">Just me</option>
                          <option value="team">My team</option>
                          <option value="execs">Executives</option>
                          <option value="investors">Investors</option>
                        </select>
                      </div>
                    </div>

                    {hasContext && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-2"
                        onClick={() => setShowContextEditor(false)}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Done
                      </Button>
                    )}
                  </CollapsibleContent>
                </Collapsible>

                {/* VOICE-FIRST: Big Voice Button */}
                <div className="flex flex-col items-center py-6">
                  <motion.button
                    onClick={toggleRecording}
                    disabled={isTranscribing || isStructuringVoice || !isSupported}
                    className={cn(
                      "w-24 h-24 rounded-full flex items-center justify-center transition-all relative",
                      !isSupported && "opacity-50 cursor-not-allowed",
                      isTranscribing || isStructuringVoice 
                        ? "bg-muted" 
                        : isRecording 
                          ? "bg-red-500/20 shadow-lg shadow-red-500/20" 
                          : "bg-primary/10 hover:bg-primary/20 hover:shadow-lg hover:shadow-primary/10"
                    )}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    {isTranscribing || isStructuringVoice ? (
                      <Loader2 className="w-10 h-10 text-muted-foreground animate-spin" />
                    ) : isRecording ? (
                      <>
                        <MicOff className="w-10 h-10 text-red-400" />
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-red-400/50"
                          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                      </>
                    ) : (
                      <Mic className="w-10 h-10 text-primary" />
                    )}
                  </motion.button>
                  
                  <p className="mt-3 text-sm text-muted-foreground text-center">
                    {!isSupported 
                      ? "Voice not supported in this browser"
                      : isTranscribing 
                        ? "Transcribing..."
                        : isStructuringVoice
                          ? "Understanding your request..."
                          : isRecording 
                            ? `Recording ${formatDuration(recordingDuration)}...`
                            : "Tap to speak your research question"
                    }
                  </p>
                </div>

                {/* AI Extracted Context Preview */}
                {aiExtractedContext && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-primary/5 border border-primary/20"
                  >
                    <p className="text-xs font-medium text-primary mb-2 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      AI understood from your input:
                    </p>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {aiExtractedContext.concerns && (
                        <p>• <span className="text-foreground">Looking for:</span> {aiExtractedContext.concerns}</p>
                      )}
                      {aiExtractedContext.successCriteria && (
                        <p>• <span className="text-foreground">Success:</span> {aiExtractedContext.successCriteria}</p>
                      )}
                      {aiExtractedContext.redFlags && (
                        <p>• <span className="text-foreground">Red flags:</span> {aiExtractedContext.redFlags}</p>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Text Input (Secondary) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-muted-foreground">Or type your question</label>
                    {primaryQuestion && (
                      <button
                        onClick={() => {
                          setPrimaryQuestion("");
                          setAiExtractedContext(null);
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                      >
                        <X className="w-3 h-3" />
                        Clear & retry
                      </button>
                    )}
                  </div>
                  <Textarea
                    value={primaryQuestion}
                    onChange={(e) => setPrimaryQuestion(e.target.value)}
                    placeholder="What do you want to find out about this company?"
                    className="min-h-[80px] resize-none text-sm"
                  />
                </div>

                {/* Error display */}
                {researchError && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                    <p className="text-sm text-destructive">{researchError}</p>
                  </div>
                )}

                {/* Research Buttons - Always Visible */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => { setResearchDepth("quick"); handleStartResearch(); }}
                    disabled={!canStartResearch || isLoading}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4 mr-2" />
                    )}
                    Quick Scan
                  </Button>
                  <Button
                    onClick={() => { setResearchDepth("deep"); handleStartResearch(); }}
                    disabled={!canStartResearch || isLoading || !user}
                    variant="outline"
                    className="flex-1"
                    title={!user ? "Sign in for deep research" : ""}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Deep
                  </Button>
                </div>
                
                {!user && (
                  <p className="text-xs text-muted-foreground text-center">
                    Sign in for deep analysis with auto-save
                  </p>
                )}
              </motion.div>
            )}

            {/* Research In Progress */}
            {step === "research" && (
              <motion.div
                key="research"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-12 space-y-6"
              >
                {/* Branded AI Loading: C icon center with Sparkles overlay - matches LoadingOverlay pattern */}
                <div className="relative flex items-center justify-center">
                  {/* Outer glow effect - same as LoadingOverlay */}
                  <motion.div
                    className="absolute w-28 h-28 rounded-full bg-shimmer-start/10 blur-xl"
                    initial={{ opacity: 0.3, scale: 0.95 }}
                    animate={{ opacity: [0.3, 0.4, 0.3], scale: [0.95, 1, 0.95] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  />
                  
                  {/* Progress ring - indeterminate spinner matching LoadingOverlay */}
                  <svg className="w-24 h-24" viewBox="0 0 96 96" style={{ transform: 'rotate(-90deg)' }}>
                    {/* Background circle */}
                    <circle
                      cx="48"
                      cy="48"
                      r="42"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      className="text-muted/20"
                    />
                    {/* Spinning arc */}
                    <motion.circle
                      cx="48"
                      cy="48"
                      r="42"
                      stroke="url(#research-gradient)"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray="66 264"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                      style={{ transformOrigin: "center" }}
                    />
                    <defs>
                      <linearGradient id="research-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="hsl(var(--shimmer-start))" />
                        <stop offset="100%" stopColor="hsl(var(--shimmer-end))" />
                      </linearGradient>
                    </defs>
                  </svg>
                  
                  {/* Center content: C logo with Sparkles overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {/* Semi-transparent Sparkles behind C logo */}
                    <motion.div
                      className="absolute"
                      animate={{ opacity: [0.3, 0.5, 0.3], scale: [0.9, 1, 0.9] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Sparkles className="w-12 h-12 text-shimmer-end/40" />
                    </motion.div>
                    
                    {/* Rotating C logo - same as LoadingOverlay */}
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="relative z-10"
                    >
                      {/* Subtle glow behind logo */}
                      <motion.div
                        className="absolute inset-0 w-10 h-10 bg-shimmer-start/20 rounded-full blur-lg"
                        style={{ transform: 'translate(-5px, -5px)' }}
                        animate={{ opacity: [0.4, 0.6, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                      {/* C logo */}
                      <img 
                        src={conclusivIcon} 
                        alt="" 
                        className="w-10 h-10 object-contain relative z-10"
                      />
                    </motion.div>
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <h3 className="font-semibold">
                    {researchDepth === "deep" ? "Deep Analysis" : "Researching..."}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-[280px]">
                    {researchDepth === "deep" 
                      ? "Analyzing multiple sources. This may take a few minutes."
                      : "Scanning sources for relevant information..."}
                  </p>
                </div>

                {isPolling && (
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <Clock className="w-4 h-4" />
                    <span>{formattedElapsedTime}</span>
                  </div>
                )}

                {researchDepth === "deep" && (
                  <p className="text-xs text-muted-foreground text-center max-w-[260px]">
                    Results are auto-saved. You can close this and come back later.
                  </p>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    cancelPolling();
                    setIsLoading(false);
                    setStep("input");
                  }}
                >
                  Cancel
                </Button>
              </motion.div>
            )}

            {/* Results */}
            {step === "results" && results && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Research Complete</h3>
                    <p className="text-xs text-muted-foreground">
                      {results.citations.length} sources analyzed
                    </p>
                  </div>
                </div>

                {/* Summary */}
                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <h4 className="text-sm font-medium mb-2">Summary</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {results.summary}
                  </p>
                </div>

                {/* Key Findings */}
                {results.keyFindings.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Key Findings</h4>
                    <ul className="space-y-1.5">
                      {results.keyFindings.slice(0, 5).map((finding, i) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <span className="text-primary shrink-0">•</span>
                          <span className="text-muted-foreground">{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Citations */}
                {results.citations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Sources</h4>
                    <div className="space-y-1">
                      {results.citations.slice(0, 5).map((citation, i) => (
                        <a
                          key={i}
                          href={citation.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          <span className="truncate">{citation.title || citation.url}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-border/50 space-y-2">
          {step === "results" && (
            <>
              <Button onClick={handleUseResearch} className="w-full">
                <ArrowRight className="w-4 h-4 mr-2" />
                Use This Research
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetState}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Start New Research
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

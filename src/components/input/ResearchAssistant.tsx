import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, ArrowRight, Loader2, ExternalLink, Mic, MicOff, Link2, HelpCircle, CheckCircle2, Clock, RefreshCw, ChevronDown, ChevronUp, Edit3, Building2, Target, Users } from "lucide-react";
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
  } = useNarrativeStore();

  // Derive initial values from store
  const initialDecision = useMemo(() => {
    if (selectedArchetype && archetypeToDecisionType[selectedArchetype]) {
      return archetypeToDecisionType[selectedArchetype].id;
    }
    return "partner"; // Default to due diligence
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
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Context fields - auto-populated from store
  const [companyName, setCompanyName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [industry, setIndustry] = useState("");
  const [decisionType, setDecisionType] = useState(initialDecision);
  const [audience, setAudience] = useState(initialAudience);

  // The main input field
  const [primaryQuestion, setPrimaryQuestion] = useState("");
  
  // Advanced optional fields
  const [knownConcerns, setKnownConcerns] = useState("");
  const [successCriteria, setSuccessCriteria] = useState("");
  const [redFlags, setRedFlags] = useState("");

  // Brand fetching
  const [isFetchingBrand, setIsFetchingBrand] = useState(false);
  const [brandFetched, setBrandFetched] = useState(false);

  // Voice input
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [isStructuring, setIsStructuring] = useState(false);

  // Results
  const [results, setResults] = useState<{
    summary: string;
    keyFindings: string[];
    citations: { url: string; title: string }[];
    rawContent: string;
  } | null>(null);

  // Auto-populate from store when opening
  useEffect(() => {
    if (isOpen) {
      // Populate from businessContext
      if (businessContext) {
        if (businessContext.companyName && !companyName) {
          setCompanyName(businessContext.companyName);
        }
        if (businessContext.industry && !industry) {
          setIndustry(businessContext.industry);
        }
      }
      // Populate website
      if (businessWebsite && !websiteUrl) {
        setWebsiteUrl(businessWebsite);
        setBrandFetched(true); // Assume already fetched if in store
      }
      // Set decision type from archetype
      setDecisionType(initialDecision);
      // Set audience from store
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
          toast({
            title: "Resuming research",
            description: "Found an in-progress research job.",
          });
        }
      });
    }
  }, [isOpen, user, checkExistingJobs, toast]);

  // Voice recorder
  const handleTranscript = useCallback((transcript: string) => {
    setVoiceTranscript(prev => prev ? prev + " " + transcript : transcript);
    toast({
      title: "Voice captured",
      description: "We'll add this to your research question.",
    });
  }, [toast]);

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

  // Apply voice transcript to question
  useEffect(() => {
    if (voiceTranscript && !isRecording && !isTranscribing) {
      setPrimaryQuestion(prev => prev ? prev + " " + voiceTranscript : voiceTranscript);
      setVoiceTranscript("");
    }
  }, [voiceTranscript, isRecording, isTranscribing]);

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

  // Reset brand fetched when URL changes
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

    // Formulate query
    try {
      const formResult = await formulateResearchQuery({
        decisionType: decisionLabels[decisionType] || "analysis",
        companyName,
        websiteUrl,
        industry,
        primaryQuestion,
        knownConcerns,
        successCriteria,
        redFlags,
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
        // Direct call for quick research
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
              await supabase.from("research_history").insert({
                user_id: user.id,
                query,
                subject: companyName,
                decision_type: decisionType,
                audience,
                results: researchResults,
              });
            } catch (err) {
              console.error("Failed to save research history:", err);
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
      
      onComplete(results.rawContent + citationText);
      onClose();
      resetState();
    }
  };

  const resetState = () => {
    cancelPolling();
    setStep("input");
    setPrimaryQuestion("");
    setKnownConcerns("");
    setSuccessCriteria("");
    setRedFlags("");
    setResults(null);
    setVoiceTranscript("");
    setResearchError(null);
    setIsLoading(false);
    setShowAdvanced(false);
  };

  // Check if we have pre-populated context
  const hasContext = companyName || websiteUrl || industry;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); resetState(); } }}>
      <SheetContent side="left" className="w-full sm:max-w-md h-[100dvh] flex flex-col overflow-hidden border-r border-primary/20">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            Research Assistant
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            AI-powered research in seconds
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* Input Step - Single Screen */}
            {step === "input" && (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Context Summary Card - Shows pre-populated data */}
                {hasContext && (
                  <div className="p-3 rounded-lg border border-border/50 bg-muted/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Research Context</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs px-2"
                        onClick={() => setShowAdvanced(true)}
                      >
                        <Edit3 className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
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
                  </div>
                )}

                {/* Main Question Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-primary" />
                    What do you want to find out?
                  </label>
                  <div className="relative">
                    <Textarea
                      value={primaryQuestion}
                      onChange={(e) => setPrimaryQuestion(e.target.value)}
                      placeholder="e.g., Is this company financially stable? What are their growth prospects? Are there any regulatory risks?"
                      className="min-h-[100px] resize-none text-sm pr-12"
                      autoFocus
                    />
                    {isSupported && (
                      <button
                        onClick={toggleRecording}
                        disabled={isTranscribing}
                        className={cn(
                          "absolute right-2 bottom-2 p-2 rounded-full transition-all",
                          isTranscribing ? "bg-muted text-muted-foreground" :
                          isRecording 
                            ? "bg-red-500/20 text-red-400 animate-pulse" 
                            : "bg-primary/10 text-primary hover:bg-primary/20"
                        )}
                      >
                        {isTranscribing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isRecording ? (
                          <MicOff className="w-4 h-4" />
                        ) : (
                          <Mic className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                  {isRecording && (
                    <p className="text-xs text-primary animate-pulse">
                      Recording... {formatDuration(recordingDuration)}
                    </p>
                  )}
                </div>

                {/* Collapsible Context Editor */}
                <Collapsible open={showAdvanced || !hasContext} onOpenChange={setShowAdvanced}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-between text-xs text-muted-foreground">
                      {hasContext ? "Edit research context" : "Add research context"}
                      {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-3 pt-3">
                    {/* Company/Website */}
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

                    {/* Industry */}
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Industry</label>
                      <Input
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        placeholder="e.g., Technology, Healthcare, Finance"
                        className="h-9 text-sm"
                      />
                    </div>

                    {/* Decision Type & Audience Row */}
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

                    {/* Optional Advanced Fields */}
                    <div className="space-y-2 pt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground">Optional: Guide the research</p>
                      <Textarea
                        value={knownConcerns}
                        onChange={(e) => setKnownConcerns(e.target.value)}
                        placeholder="Known concerns or things to investigate..."
                        className="min-h-[50px] resize-none text-sm"
                      />
                      <Textarea
                        value={successCriteria}
                        onChange={(e) => setSuccessCriteria(e.target.value)}
                        placeholder="What would make you say YES?"
                        className="min-h-[50px] resize-none text-sm"
                      />
                      <Textarea
                        value={redFlags}
                        onChange={(e) => setRedFlags(e.target.value)}
                        placeholder="Red flags to watch for..."
                        className="min-h-[50px] resize-none text-sm"
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Error display */}
                {researchError && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                    <p className="text-sm text-destructive">{researchError}</p>
                  </div>
                )}

                {/* Research Buttons */}
                <div className="flex gap-2">
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
                    Deep Analysis
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
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                  </div>
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary/30"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>

                <div className="text-center space-y-2">
                  <h3 className="font-semibold">
                    {researchDepth === "deep" ? "Deep Analysis in Progress" : "Researching..."}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-[280px]">
                    {researchDepth === "deep" 
                      ? "Analyzing multiple sources with deep reasoning. This may take a few minutes."
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

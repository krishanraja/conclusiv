import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, ArrowRight, ArrowLeft, Loader2, ExternalLink, ChevronRight, Target, Globe, Swords, Lightbulb, Building2, TrendingUp, Mic, MicOff, Link2, HelpCircle, ShieldCheck, ShieldX, AlertTriangle, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { formulateResearchQuery, executeResearch, structureVoiceInput, fetchBrandData } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWhisperRecorder } from "@/hooks/useWhisperRecorder";
import { useToast } from "@/hooks/use-toast";
import { QuerySpecificityIndicator } from "./QuerySpecificityIndicator";
import { ResearchTemplateManager } from "./ResearchTemplateManager";
import { useResearchJob, ResearchJob } from "@/hooks/useResearchJob";

interface ResearchAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (researchContent: string) => void;
}

type Step = "decision" | "qualify" | "focus" | "audience" | "confirm" | "research" | "results";

// Decision archetypes - the core question types
const decisionTypes = [
  { 
    id: "invest", 
    icon: Target, 
    label: "Should we invest?", 
    description: "Evaluate a company, opportunity, or asset",
    contextLabel: "investment",
  },
  { 
    id: "market", 
    icon: Globe, 
    label: "Should we enter this market?", 
    description: "New geography, segment, or vertical",
    contextLabel: "market entry",
  },
  { 
    id: "compete", 
    icon: Swords, 
    label: "How do we compete?", 
    description: "Competitive analysis and positioning",
    contextLabel: "competitive analysis",
  },
  { 
    id: "future", 
    icon: Lightbulb, 
    label: "What's the future of...?", 
    description: "Trends, disruption, and forecasts",
    contextLabel: "trend analysis",
  },
  { 
    id: "partner", 
    icon: Building2, 
    label: "Is this the right partner?", 
    description: "Due diligence on a company or vendor",
    contextLabel: "due diligence",
  },
  { 
    id: "opportunity", 
    icon: TrendingUp, 
    label: "What's the opportunity size?", 
    description: "TAM, SAM, SOM analysis",
    contextLabel: "opportunity sizing",
  },
];

// Industry options
const industryOptions = [
  "Technology", "Healthcare", "Finance", "Manufacturing", "Retail", 
  "Energy", "Real Estate", "Transportation", "Media", "Telecommunications",
  "Consumer Goods", "Professional Services", "Other"
];

// Simplified audience options
const audienceOptions = [
  { id: "self", label: "Just me", description: "Exploratory research", icon: "🔍" },
  { id: "team", label: "My team", description: "Tactical decisions", icon: "👥" },
  { id: "execs", label: "Executives", description: "Strategic briefing", icon: "📊" },
  { id: "investors", label: "Investors", description: "Persuasive analysis", icon: "💰" },
];

// Structured input for research
interface QualificationData {
  companyName: string;
  websiteUrl: string;
  industry: string;
  primaryQuestion: string;
  knownConcerns: string;
  successCriteria: string;
  redFlags: string;
}

const initialQualificationData: QualificationData = {
  companyName: "",
  websiteUrl: "",
  industry: "",
  primaryQuestion: "",
  knownConcerns: "",
  successCriteria: "",
  redFlags: "",
};

export const ResearchAssistant = ({ isOpen, onClose, onComplete }: ResearchAssistantProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("decision");
  const [selectedDecision, setSelectedDecision] = useState<string | null>(null);
  const [qualification, setQualification] = useState<QualificationData>(initialQualificationData);
  const [audience, setAudience] = useState<string | null>(null);
  const [suggestedQuery, setSuggestedQuery] = useState("");
  const [editedQuery, setEditedQuery] = useState("");
  const [isEditingQuery, setIsEditingQuery] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isStructuring, setIsStructuring] = useState(false);
  const [isFetchingBrand, setIsFetchingBrand] = useState(false);
  const [brandFetched, setBrandFetched] = useState(false);
  const [researchDepth, setResearchDepth] = useState<"quick" | "deep">("quick"); // Default to quick now
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [researchError, setResearchError] = useState<string | null>(null);
  
  // Results
  const [results, setResults] = useState<{
    summary: string;
    keyFindings: string[];
    citations: { url: string; title: string }[];
    rawContent: string;
  } | null>(null);

  // Background job hook for deep research
  const handleJobComplete = useCallback((job: ResearchJob) => {
    if (job.results) {
      setResults(job.results);
      setStep("results");
      setIsLoading(false);
      
      // Save to research history
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

  // Whisper voice recorder
  const handleTranscript = useCallback((transcript: string) => {
    setVoiceTranscript(prev => prev ? prev + " " + transcript : transcript);
    toast({
      title: "Voice captured",
      description: "Click 'Structure my thoughts' to organize your input.",
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

  // URL auto-fetch effect
  useEffect(() => {
    const url = qualification.websiteUrl.trim();
    if (!url || !isValidUrl(url) || brandFetched) return;
    
    // Don't fetch if we already have company name from the same URL
    const cleanUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (cleanUrl.length < 4) return;

    const timeoutId = setTimeout(async () => {
      setIsFetchingBrand(true);
      try {
        const result = await fetchBrandData(cleanUrl);
        if (result.data) {
          const { companyName } = result.data;
          
          if (!qualification.companyName && companyName) {
            setQualification(prev => ({ ...prev, companyName }));
          }
          
          setBrandFetched(true);
          toast({
            title: "Company info found",
            description: `Identified: ${companyName || cleanUrl}`,
          });
        }
      } catch (err) {
        console.error("Brand fetch error:", err);
      } finally {
        setIsFetchingBrand(false);
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [qualification.websiteUrl, qualification.companyName, brandFetched, toast]);

  // Reset brand fetched flag when URL changes significantly
  useEffect(() => {
    setBrandFetched(false);
  }, [qualification.websiteUrl]);

  const getDecisionType = () => decisionTypes.find(d => d.id === selectedDecision);

  // Validate URL format
  const isValidUrl = (url: string): boolean => {
    if (!url) return true;
    const domainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]\.[a-zA-Z]{2,}/;
    const urlPattern = /^https?:\/\/.+/;
    return domainPattern.test(url) || urlPattern.test(url);
  };

  // Structure voice input with AI
  const handleStructureVoice = async () => {
    if (!voiceTranscript.trim()) return;
    
    setIsStructuring(true);
    try {
      const result = await structureVoiceInput(voiceTranscript, selectedDecision || "analysis");
      if (result.error) {
        toast({
          title: "Couldn't structure input",
          description: result.error,
          variant: "destructive",
        });
      } else if (result.structured) {
        setQualification(prev => ({
          ...prev,
          ...result.structured,
        }));
        setVoiceTranscript("");
        toast({
          title: "Input structured",
          description: "Your thoughts have been organized into the fields below.",
        });
      }
    } catch (err) {
      console.error("Structure error:", err);
    } finally {
      setIsStructuring(false);
    }
  };

  // Handle loading template
  const handleLoadTemplate = (template: Partial<QualificationData> & { audience?: string }) => {
    setQualification(prev => ({
      ...prev,
      industry: template.industry || prev.industry,
      primaryQuestion: template.primaryQuestion || prev.primaryQuestion,
      knownConcerns: template.knownConcerns || prev.knownConcerns,
      successCriteria: template.successCriteria || prev.successCriteria,
      redFlags: template.redFlags || prev.redFlags,
    }));
    if (template.audience) {
      setAudience(template.audience);
    }
  };

  // Retry research
  const handleRetry = async () => {
    setResearchError(null);
    handleNext();
  };

  const handleNext = async () => {
    if (step === "decision") {
      setStep("qualify");
    } else if (step === "qualify") {
      setStep("focus");
    } else if (step === "focus") {
      setStep("audience");
    } else if (step === "audience") {
      setIsLoading(true);
      try {
        const decisionType = getDecisionType();
        const result = await formulateResearchQuery({
          decisionType: decisionType?.contextLabel || "analysis",
          companyName: qualification.companyName,
          websiteUrl: qualification.websiteUrl,
          industry: qualification.industry,
          primaryQuestion: qualification.primaryQuestion,
          knownConcerns: qualification.knownConcerns,
          successCriteria: qualification.successCriteria,
          redFlags: qualification.redFlags,
          audience: audience || undefined,
        });
        if (result.suggestedQuery) {
          setSuggestedQuery(result.suggestedQuery);
          setEditedQuery(result.suggestedQuery);
        }
        setStep("confirm");
      } catch (err) {
        console.error("Formulation error:", err);
        toast({
          title: "Error formulating query",
          description: "Please try again",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    } else if (step === "confirm") {
      setStep("research");
      setIsLoading(true);
      setResearchError(null);

      const query = editedQuery || suggestedQuery;

      // Use background job for deep research, direct call for quick
      if (researchDepth === "deep" && user) {
        // Create a background job
        const job = await createJob({
          query,
          depth: researchDepth,
          subject: qualification.companyName,
          decisionType: selectedDecision || undefined,
          audience: audience || undefined,
        });

        if (!job) {
          setStep("confirm");
          setIsLoading(false);
        }
        // Job is now processing in background, polling will update status
      } else {
        // Direct synchronous call for quick research or unauthenticated users
        try {
          const result = await executeResearch(query, researchDepth);
          if (result.error) {
            console.error("Research error:", result.error);
            setResearchError(result.error);
            toast({
              title: "Research error",
              description: result.error,
              variant: "destructive",
            });
            setStep("confirm");
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
                  subject: qualification.companyName,
                  decision_type: selectedDecision,
                  audience,
                  results: researchResults,
                });
              } catch (err) {
                console.error("Failed to save research history:", err);
              }
            }
          }
        } catch (err) {
          console.error("Research error:", err);
          setResearchError(err instanceof Error ? err.message : "Research failed");
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  const handleBack = () => {
    if (step === "qualify") setStep("decision");
    else if (step === "focus") setStep("qualify");
    else if (step === "audience") setStep("focus");
    else if (step === "confirm") setStep("audience");
    else if (step === "results") setStep("confirm");
    else if (step === "research") {
      // Cancel any ongoing job polling
      cancelPolling();
      setIsLoading(false);
      setStep("confirm");
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
    setStep("decision");
    setSelectedDecision(null);
    setQualification(initialQualificationData);
    setAudience(null);
    setSuggestedQuery("");
    setEditedQuery("");
    setResults(null);
    setVoiceTranscript("");
    setBrandFetched(false);
    setResearchError(null);
    setIsLoading(false);
  };

  const canProceed = () => {
    if (step === "decision") return selectedDecision !== null;
    if (step === "qualify") return qualification.companyName.trim().length >= 2;
    if (step === "focus") return qualification.primaryQuestion.trim().length >= 5;
    if (step === "audience") return true;
    if (step === "confirm") return (editedQuery || suggestedQuery).trim().length > 0;
    return false;
  };

  const stepNumber = {
    decision: 1,
    qualify: 2,
    focus: 2,
    audience: 3,
    confirm: 4,
    research: 5,
    results: 6,
  };

  const updateField = (field: keyof QualificationData, value: string) => {
    setQualification(prev => ({ ...prev, [field]: value }));
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    return `${seconds}s`;
  };

  // Show floating indicator during input steps
  const showSpecificityIndicator = step === "qualify" || step === "focus";

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
            Let's find exactly what you need
          </p>
          <div className="flex items-center gap-1 mt-3">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-all duration-300",
                  n <= stepNumber[step] ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
        </SheetHeader>

        {/* Floating Query Specificity Indicator */}
        <AnimatePresence>
          {showSpecificityIndicator && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute bottom-24 right-4 z-10"
            >
              <QuerySpecificityIndicator qualification={qualification} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* Step 1: Decision Type */}
          {step === "decision" && (
            <motion.div
              key="decision"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-lg font-semibold mb-1">What decision are you trying to make?</h3>
                <p className="text-sm text-muted-foreground">
                  Pick the closest match - this helps focus the research.
                </p>
              </div>
              <div className="grid gap-2">
                {decisionTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedDecision(type.id)}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
                        selectedDecision === type.id
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-border hover:border-primary/50 hover:bg-muted/30"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg shrink-0 transition-colors",
                        selectedDecision === type.id ? "bg-primary/10" : "bg-muted"
                      )}>
                        <Icon className={cn(
                          "w-4 h-4",
                          selectedDecision === type.id ? "text-primary" : "text-muted-foreground"
                        )} />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Step 2a: Qualify - Company/Subject Identification */}
          {step === "qualify" && (
            <motion.div
              key="qualify"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-lg font-semibold mb-1">Who or what are we researching?</h3>
                <p className="text-sm text-muted-foreground">
                  Help us identify the exact target
                </p>
              </div>
              
              <div className="space-y-3">
                {/* Website URL - First for auto-fetch */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Link2 className="w-3 h-3" />
                    Website URL
                    <span className="text-primary/70">(auto-fills company info)</span>
                  </label>
                  <div className="relative">
                    <Input
                      value={qualification.websiteUrl}
                      onChange={(e) => updateField("websiteUrl", e.target.value)}
                      placeholder="e.g., lionair.com or https://example.com"
                      className={cn(
                        "h-11 pr-10",
                        qualification.websiteUrl && !isValidUrl(qualification.websiteUrl) && "border-destructive"
                      )}
                      autoFocus
                    />
                    {isFetchingBrand && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      </div>
                    )}
                    {brandFetched && !isFetchingBrand && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      </div>
                    )}
                  </div>
                  {qualification.websiteUrl && !isValidUrl(qualification.websiteUrl) && (
                    <p className="text-xs text-destructive">Please enter a valid URL or domain</p>
                  )}
                </div>

                {/* Company Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    Company / Subject Name *
                  </label>
                  <Input
                    value={qualification.companyName}
                    onChange={(e) => updateField("companyName", e.target.value)}
                    placeholder="e.g., Lion Air, Acme Corp, Tesla"
                    className="h-11"
                  />
                </div>

                {/* Industry */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Industry / Sector
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {industryOptions.map((ind) => (
                      <button
                        key={ind}
                        onClick={() => updateField("industry", qualification.industry === ind ? "" : ind)}
                        className={cn(
                          "px-2.5 py-1 text-xs rounded-full border transition-all",
                          qualification.industry === ind
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {ind}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* Step 2b: Focus - Research Questions */}
          {step === "focus" && (
            <motion.div
              key="focus"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-lg font-semibold mb-1">What do you want to know?</h3>
                <p className="text-sm text-muted-foreground">
                  Guide the research with specific questions
                </p>
              </div>

              {/* Voice Input Section - OpenAI Whisper */}
              {isSupported && (
                <div className="p-3 rounded-lg border border-dashed border-primary/30 bg-primary/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-primary">
                        {isRecording ? `Recording... ${formatDuration(recordingDuration)}` : 
                         isTranscribing ? "Transcribing with Whisper..." : "Speak your thoughts"}
                      </p>
                      {!isRecording && !isTranscribing && (
                        <p className="text-[10px] text-muted-foreground">
                          Up to 60 seconds of free-form input
                        </p>
                      )}
                    </div>
                    <button
                      onClick={toggleRecording}
                      disabled={isTranscribing}
                      className={cn(
                        "p-2.5 rounded-full transition-all",
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
                  </div>
                  {voiceTranscript && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground italic bg-background/50 p-2 rounded">
                        "{voiceTranscript.trim()}"
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleStructureVoice}
                        disabled={isStructuring}
                        className="w-full text-xs h-8"
                      >
                        {isStructuring ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Structuring...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 mr-1" />
                            Structure my thoughts
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
              
              <div className="space-y-3">
                {/* Primary Question */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <HelpCircle className="w-3 h-3" />
                    What's your #1 question about them? *
                  </label>
                  <Textarea
                    value={qualification.primaryQuestion}
                    onChange={(e) => updateField("primaryQuestion", e.target.value)}
                    placeholder="e.g., Are they financially stable enough for a long-term partnership?"
                    className="min-h-[60px] resize-none text-sm"
                  />
                </div>

                {/* Known Concerns */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    What do you already know that concerns you?
                  </label>
                  <Textarea
                    value={qualification.knownConcerns}
                    onChange={(e) => updateField("knownConcerns", e.target.value)}
                    placeholder="e.g., I heard they had layoffs last quarter, or their stock has been volatile"
                    className="min-h-[50px] resize-none text-sm"
                  />
                </div>

                {/* Success Criteria */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    What would make you say YES?
                  </label>
                  <Textarea
                    value={qualification.successCriteria}
                    onChange={(e) => updateField("successCriteria", e.target.value)}
                    placeholder="e.g., Growing revenue, strong leadership, good press coverage"
                    className="min-h-[50px] resize-none text-sm"
                  />
                </div>

                {/* Red Flags */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <ShieldX className="w-3 h-3" />
                    What would make you say NO?
                  </label>
                  <Textarea
                    value={qualification.redFlags}
                    onChange={(e) => updateField("redFlags", e.target.value)}
                    placeholder="e.g., Regulatory issues, declining revenue, bad customer reviews"
                    className="min-h-[50px] resize-none text-sm"
                  />
                </div>

              </div>
            </motion.div>
          )}

          {/* Step 3: Audience */}
          {step === "audience" && (
            <motion.div
              key="audience"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-lg font-semibold mb-1">Who needs to see this?</h3>
                <p className="text-sm text-muted-foreground">
                  Optional - helps tailor the depth and tone.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {audienceOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setAudience(audience === opt.id ? null : opt.id)}
                    className={cn(
                      "p-3 rounded-lg border text-left transition-all",
                      audience === opt.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="text-lg mb-1">{opt.icon}</div>
                    <div className="font-medium text-sm">{opt.label}</div>
                    <div className="text-xs text-muted-foreground">{opt.description}</div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => handleNext()}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip this step →
              </button>
            </motion.div>
          )}

          {/* Step 4: Confirm */}
          {step === "confirm" && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Ready to research</h3>
                  <p className="text-sm text-muted-foreground">
                    Here's what we'll investigate
                  </p>
                </div>
                {/* Template Manager */}
                <ResearchTemplateManager
                  userId={user?.id || null}
                  decisionType={selectedDecision || ""}
                  audience={audience || ""}
                  qualification={qualification}
                  onLoadTemplate={handleLoadTemplate}
                />
              </div>

              {/* Error display with retry */}
              {researchError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 space-y-2">
                  <p className="text-sm text-destructive font-medium">Research failed</p>
                  <p className="text-xs text-destructive/80">{researchError}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRetry}
                    className="mt-2"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Try again
                  </Button>
                </div>
              )}

              {/* Summary of inputs */}
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Target:</span>
                  <span className="font-medium">{qualification.companyName}</span>
                  {qualification.websiteUrl && (
                    <span className="text-primary">({qualification.websiteUrl})</span>
                  )}
                </div>
                {qualification.industry && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Industry:</span>
                    <span>{qualification.industry}</span>
                  </div>
                )}
              </div>
              
              <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                {isEditingQuery ? (
                  <Textarea
                    value={editedQuery}
                    onChange={(e) => setEditedQuery(e.target.value)}
                    className="min-h-[100px] resize-none text-sm"
                    autoFocus
                  />
                ) : (
                  <p className="text-sm leading-relaxed">{editedQuery || suggestedQuery}</p>
                )}
                <button
                  onClick={() => setIsEditingQuery(!isEditingQuery)}
                  className="text-xs text-primary mt-2 hover:underline"
                >
                  {isEditingQuery ? "Done editing" : "Edit query"}
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Research depth</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setResearchDepth("quick")}
                    className={cn(
                      "flex-1 p-3 rounded-lg border text-left transition-all",
                      researchDepth === "quick"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="font-medium text-sm flex items-center gap-1">
                      Quick scan
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-600">Fast</span>
                    </div>
                    <div className="text-xs text-muted-foreground">~15-30 seconds</div>
                  </button>
                  <button
                    onClick={() => setResearchDepth("deep")}
                    className={cn(
                      "flex-1 p-3 rounded-lg border text-left transition-all",
                      researchDepth === "deep"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="font-medium text-sm">Deep dive</div>
                    <div className="text-xs text-muted-foreground">~1-2 minutes</div>
                  </button>
                </div>
                {researchDepth === "deep" && !user && (
                  <p className="text-xs text-amber-600">
                    Sign in to use deep research with background processing
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 5: Research in progress */}
          {step === "research" && (
            <motion.div
              key="research"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 space-y-6"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-2 border-primary/20" />
                <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <Search className="absolute inset-0 m-auto w-8 h-8 text-primary" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Researching {qualification.companyName}...</h3>
                
                {/* Job status */}
                {currentJob && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{formattedElapsedTime}</span>
                    <span className="text-primary capitalize">{currentJob.status}</span>
                  </div>
                )}
                
                <p className="text-sm text-muted-foreground max-w-[280px]">
                  {researchDepth === "deep" 
                    ? "Deep analysis in progress. You can close this and we'll save your results."
                    : "Quick scan in progress..."}
                </p>

                {/* Mobile-friendly notice */}
                {researchDepth === "deep" && (
                  <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-center">
                    <p className="text-primary font-medium">✨ Results are auto-saved</p>
                    <p className="text-muted-foreground mt-1">
                      You can close this sheet and come back later
                    </p>
                  </div>
                )}
              </div>

              {/* Cancel button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-muted-foreground"
              >
                Cancel
              </Button>
            </motion.div>
          )}

          {/* Step 6: Results */}
          {step === "results" && results && (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Research Complete</h3>
                  <p className="text-sm text-muted-foreground">
                    {results.citations.length} sources analyzed
                  </p>
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
                  Executive Summary
                </h4>
                <p className="text-sm">{results.summary}</p>
              </div>

              {/* Key Findings */}
              {results.keyFindings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Key Findings
                  </h4>
                  <ul className="space-y-2">
                    {results.keyFindings.map((finding, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sources */}
              {results.citations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Sources ({results.citations.length})
                  </h4>
                  <div className="max-h-[120px] overflow-y-auto space-y-1">
                    {results.citations.slice(0, 10).map((citation, i) => (
                      <a
                        key={i}
                        href={citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors p-1.5 rounded hover:bg-muted/50"
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

        {/* Navigation */}
        <div className="pt-4 border-t border-border/50 mt-auto shrink-0">
          <div className="flex gap-2">
            {step !== "decision" && step !== "research" && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1"
                disabled={isLoading}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
            
            {step === "results" ? (
              <Button
                onClick={handleUseResearch}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Use This Research
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : step !== "research" ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isLoading}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    {step === "audience" ? "Preparing..." : "Loading..."}
                  </>
                ) : (
                  <>
                    {step === "confirm" ? "Start Research" : "Continue"}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            ) : null}
          </div>
          
          {step !== "research" && step !== "results" && (
            <button
              onClick={() => { onClose(); resetState(); }}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground mt-3 py-2"
            >
              Cancel
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
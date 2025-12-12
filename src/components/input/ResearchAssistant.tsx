import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, ArrowRight, ArrowLeft, Loader2, ExternalLink, ChevronRight, Target, Globe, Swords, Lightbulb, Building2, TrendingUp, HelpCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { formulateResearchQuery, executeResearch } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ResearchAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (researchContent: string) => void;
}

type Step = "decision" | "subject" | "audience" | "confirm" | "research" | "results";

// Decision archetypes - the core question types
const decisionTypes = [
  { 
    id: "invest", 
    icon: Target, 
    label: "Should we invest?", 
    description: "Evaluate a company, opportunity, or asset",
    placeholder: "Company or opportunity name",
    contextLabel: "investment",
  },
  { 
    id: "market", 
    icon: Globe, 
    label: "Should we enter this market?", 
    description: "New geography, segment, or vertical",
    placeholder: "Market or geography",
    contextLabel: "market entry",
  },
  { 
    id: "compete", 
    icon: Swords, 
    label: "How do we compete?", 
    description: "Competitive analysis and positioning",
    placeholder: "Competitor or category",
    contextLabel: "competitive analysis",
  },
  { 
    id: "future", 
    icon: Lightbulb, 
    label: "What's the future of...?", 
    description: "Trends, disruption, and forecasts",
    placeholder: "Industry or technology",
    contextLabel: "trend analysis",
  },
  { 
    id: "partner", 
    icon: Building2, 
    label: "Is this the right partner?", 
    description: "Due diligence on a company or vendor",
    placeholder: "Company or vendor name",
    contextLabel: "due diligence",
  },
  { 
    id: "opportunity", 
    icon: TrendingUp, 
    label: "What's the opportunity size?", 
    description: "TAM, SAM, SOM analysis",
    placeholder: "Market or product area",
    contextLabel: "opportunity sizing",
  },
];

// Simplified audience options
const audienceOptions = [
  { id: "self", label: "Just me", description: "Exploratory research", icon: "🔍" },
  { id: "team", label: "My team", description: "Tactical decisions", icon: "👥" },
  { id: "execs", label: "Executives", description: "Strategic briefing", icon: "📊" },
  { id: "investors", label: "Investors", description: "Persuasive analysis", icon: "💰" },
];

export const ResearchAssistant = ({ isOpen, onClose, onComplete }: ResearchAssistantProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("decision");
  const [selectedDecision, setSelectedDecision] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [showContext, setShowContext] = useState(false);
  const [audience, setAudience] = useState<string | null>(null);
  const [suggestedQuery, setSuggestedQuery] = useState("");
  const [editedQuery, setEditedQuery] = useState("");
  const [isEditingQuery, setIsEditingQuery] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [researchDepth, setResearchDepth] = useState<"quick" | "deep">("deep");
  
  // Results
  const [results, setResults] = useState<{
    summary: string;
    keyFindings: string[];
    citations: { url: string; title: string }[];
    rawContent: string;
  } | null>(null);

  const getDecisionType = () => decisionTypes.find(d => d.id === selectedDecision);

  const handleNext = async () => {
    if (step === "decision") {
      setStep("subject");
    } else if (step === "subject") {
      setStep("audience");
    } else if (step === "audience") {
      // Formulate the query
      setIsLoading(true);
      try {
        const decisionType = getDecisionType();
        const result = await formulateResearchQuery(
          `${decisionType?.label} ${subject}`,
          decisionType?.contextLabel || "analysis",
          audience as any || undefined,
          additionalContext ? [additionalContext] : undefined
        );
        if (result.suggestedQuery) {
          setSuggestedQuery(result.suggestedQuery);
          setEditedQuery(result.suggestedQuery);
        }
        setStep("confirm");
      } catch (err) {
        console.error("Formulation error:", err);
      } finally {
        setIsLoading(false);
      }
    } else if (step === "confirm") {
      // Execute research
      setStep("research");
      setIsLoading(true);
      try {
        const result = await executeResearch(editedQuery || suggestedQuery, researchDepth);
        if (result.error) {
          console.error("Research error:", result.error);
        } else {
          const researchResults = {
            summary: result.summary || "",
            keyFindings: result.keyFindings || [],
            citations: result.citations || [],
            rawContent: result.rawContent || "",
          };
          setResults(researchResults);
          setStep("results");
          
          // Save to research history
          if (user) {
            try {
              await supabase.from("research_history").insert({
                user_id: user.id,
                query: editedQuery || suggestedQuery,
                subject,
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
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (step === "subject") setStep("decision");
    else if (step === "audience") setStep("subject");
    else if (step === "confirm") setStep("audience");
    else if (step === "results") setStep("confirm");
  };

  const handleUseResearch = () => {
    if (results?.rawContent) {
      const citationText = results.citations.length > 0
        ? `\n\n---\nSources:\n${results.citations.map((c, i) => `[${i + 1}] ${c.title}: ${c.url}`).join('\n')}`
        : '';
      
      onComplete(results.rawContent + citationText);
      onClose();
      // Reset state
      resetState();
    }
  };

  const resetState = () => {
    setStep("decision");
    setSelectedDecision(null);
    setSubject("");
    setAdditionalContext("");
    setShowContext(false);
    setAudience(null);
    setSuggestedQuery("");
    setEditedQuery("");
    setResults(null);
  };

  const canProceed = () => {
    if (step === "decision") return selectedDecision !== null;
    if (step === "subject") return subject.trim().length >= 2;
    if (step === "audience") return true; // Optional
    if (step === "confirm") return (editedQuery || suggestedQuery).trim().length > 0;
    return false;
  };

  const stepNumber = {
    decision: 1,
    subject: 2,
    audience: 3,
    confirm: 4,
    research: 5,
    results: 6,
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); resetState(); } }}>
      <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto border-r border-primary/20">
        <SheetHeader className="mb-6">
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

          {/* Step 2: Subject */}
          {step === "subject" && (
            <motion.div
              key="subject"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-lg font-semibold mb-1">About what specifically?</h3>
                <p className="text-sm text-muted-foreground">
                  {getDecisionType()?.description}
                </p>
              </div>
              <div className="space-y-3">
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={getDecisionType()?.placeholder}
                  className="text-base h-12"
                  autoFocus
                />
                
                {!showContext ? (
                  <button
                    onClick={() => setShowContext(true)}
                    className="text-xs text-primary/70 hover:text-primary transition-colors flex items-center gap-1"
                  >
                    <span>+ Add context you already know</span>
                  </button>
                ) : (
                  <Textarea
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    placeholder="Any specific angles, concerns, or things you already know..."
                    className="min-h-[80px] resize-none text-sm"
                  />
                )}
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
              <div>
                <h3 className="text-lg font-semibold mb-1">Ready to research</h3>
                <p className="text-sm text-muted-foreground">
                  Here's what we'll investigate
                </p>
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
                    <div className="font-medium text-sm">Quick scan</div>
                    <div className="text-xs text-muted-foreground">~30 seconds</div>
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
                    <div className="font-medium text-sm flex items-center gap-1">
                      Deep dive
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">Recommended</span>
                    </div>
                    <div className="text-xs text-muted-foreground">~2-3 minutes</div>
                  </button>
                </div>
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
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Researching...</h3>
                <p className="text-sm text-muted-foreground max-w-[280px]">
                  {researchDepth === "deep" 
                    ? "Conducting deep analysis. This may take a few minutes."
                    : "Quick scan in progress..."}
                </p>
              </div>
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
                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Research Complete</h3>
                  <p className="text-sm text-muted-foreground">{results.summary}</p>
                </div>
              </div>

              {results.keyFindings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Key Findings</h4>
                  <ul className="space-y-2">
                    {results.keyFindings.slice(0, 5).map((finding, i) => (
                      <li key={i} className="text-sm text-foreground/90 flex items-start gap-2 p-2 rounded-lg bg-muted/30">
                        <ChevronRight className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {results.citations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sources ({results.citations.length})</h4>
                  <div className="space-y-1 max-h-[100px] overflow-y-auto">
                    {results.citations.slice(0, 6).map((citation, i) => (
                      <a
                        key={i}
                        href={citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-primary hover:underline truncate"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="truncate">{citation.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Footer */}
        <div className="mt-8 pt-4 border-t border-border/50 flex gap-2">
          {step !== "decision" && step !== "research" && (
            <Button variant="ghost" onClick={handleBack} disabled={isLoading}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
          
          {step === "decision" && (
            <Button variant="ghost" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          )}

          {step === "results" ? (
            <Button onClick={handleUseResearch} className="flex-1" variant="shimmer">
              <Sparkles className="w-4 h-4 mr-2" />
              Use This Research
            </Button>
          ) : step === "research" ? null : (
            <Button 
              onClick={handleNext} 
              disabled={!canProceed() || isLoading}
              className="flex-1"
              variant={step === "confirm" ? "shimmer" : "default"}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : step === "confirm" ? (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Start Research
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, ArrowRight, ArrowLeft, Loader2, ExternalLink, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { formulateResearchQuery, executeResearch } from "@/lib/api";
import { audienceDescriptions, AudienceMode } from "@/lib/types";

interface ResearchAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (researchContent: string) => void;
}

type Step = "topic" | "context" | "audience" | "questions" | "confirm" | "research" | "results";

const contextOptions = [
  { id: "strategy", label: "Strategic planning", description: "Long-term decisions and direction" },
  { id: "investment", label: "Investment decision", description: "Funding, acquisition, or partnership" },
  { id: "product", label: "Product development", description: "Building or improving a product" },
  { id: "market", label: "Market entry", description: "Entering a new market or segment" },
  { id: "competitive", label: "Competitive analysis", description: "Understanding the competition" },
  { id: "other", label: "Other", description: "Something else" },
];

export const ResearchAssistant = ({ isOpen, onClose, onComplete }: ResearchAssistantProps) => {
  const [step, setStep] = useState<Step>("topic");
  const [topic, setTopic] = useState("");
  const [context, setContext] = useState("");
  const [customContext, setCustomContext] = useState("");
  const [audience, setAudience] = useState<AudienceMode | null>(null);
  const [specificQuestions, setSpecificQuestions] = useState<string[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [suggestedQuery, setSuggestedQuery] = useState("");
  const [editedQuery, setEditedQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [researchDepth, setResearchDepth] = useState<"quick" | "deep">("deep");
  
  // Results
  const [results, setResults] = useState<{
    summary: string;
    keyFindings: string[];
    citations: { url: string; title: string }[];
    rawContent: string;
  } | null>(null);

  const handleNext = async () => {
    if (step === "topic") {
      setStep("context");
    } else if (step === "context") {
      setStep("audience");
    } else if (step === "audience") {
      setStep("questions");
    } else if (step === "questions") {
      // Formulate the query
      setIsLoading(true);
      try {
        const result = await formulateResearchQuery(
          topic,
          context === "other" ? customContext : context,
          audience || undefined,
          specificQuestions.length > 0 ? specificQuestions : undefined
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
          setResults({
            summary: result.summary || "",
            keyFindings: result.keyFindings || [],
            citations: result.citations || [],
            rawContent: result.rawContent || "",
          });
          setStep("results");
        }
      } catch (err) {
        console.error("Research error:", err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (step === "context") setStep("topic");
    else if (step === "audience") setStep("context");
    else if (step === "questions") setStep("audience");
    else if (step === "confirm") setStep("questions");
    else if (step === "results") setStep("confirm");
  };

  const handleUseResearch = () => {
    if (results?.rawContent) {
      // Format citations
      const citationText = results.citations.length > 0
        ? `\n\n---\nSources:\n${results.citations.map((c, i) => `[${i + 1}] ${c.title}: ${c.url}`).join('\n')}`
        : '';
      
      onComplete(results.rawContent + citationText);
      onClose();
      // Reset state
      setStep("topic");
      setTopic("");
      setContext("");
      setResults(null);
    }
  };

  const addQuestion = () => {
    if (newQuestion.trim()) {
      setSpecificQuestions([...specificQuestions, newQuestion.trim()]);
      setNewQuestion("");
    }
  };

  const removeQuestion = (index: number) => {
    setSpecificQuestions(specificQuestions.filter((_, i) => i !== index));
  };

  const canProceed = () => {
    if (step === "topic") return topic.trim().length >= 3;
    if (step === "context") return context !== "" || customContext.trim().length > 0;
    if (step === "audience") return true; // Optional
    if (step === "questions") return true; // Optional
    if (step === "confirm") return editedQuery.trim().length > 0;
    return false;
  };

  const stepNumber = {
    topic: 1,
    context: 2,
    audience: 3,
    questions: 4,
    confirm: 5,
    research: 6,
    results: 7,
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Research Assistant
          </SheetTitle>
          <div className="flex items-center gap-1 mt-2">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <div
                key={n}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  n <= stepNumber[step] ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
        </SheetHeader>

        <AnimatePresence mode="wait">
          {/* Step 1: Topic */}
          {step === "topic" && (
            <motion.div
              key="topic"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-lg font-semibold mb-2">What do you want to research?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Describe the topic, company, market, or question you're exploring.
                </p>
              </div>
              <Textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., The competitive landscape of AI-powered document processing in enterprise..."
                className="min-h-[120px] resize-none"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                {topic.length} characters • Be specific for better results
              </p>
            </motion.div>
          )}

          {/* Step 2: Context */}
          {step === "context" && (
            <motion.div
              key="context"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-lg font-semibold mb-2">What decision are you trying to make?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This helps focus the research on what matters most.
                </p>
              </div>
              <div className="grid gap-2">
                {contextOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setContext(opt.id)}
                    className={cn(
                      "p-3 rounded-lg border text-left transition-all",
                      context === opt.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="font-medium text-sm">{opt.label}</div>
                    <div className="text-xs text-muted-foreground">{opt.description}</div>
                  </button>
                ))}
              </div>
              {context === "other" && (
                <Input
                  value={customContext}
                  onChange={(e) => setCustomContext(e.target.value)}
                  placeholder="Describe your context..."
                  className="mt-2"
                />
              )}
            </motion.div>
          )}

          {/* Step 3: Audience */}
          {step === "audience" && (
            <motion.div
              key="audience"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-lg font-semibold mb-2">Who will see this research?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Optional - helps tailor the depth and focus.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(audienceDescriptions) as [AudienceMode, typeof audienceDescriptions.exec][]).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => setAudience(audience === key ? null : key)}
                    className={cn(
                      "p-3 rounded-lg border text-left transition-all",
                      audience === key
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="font-medium text-sm">{val.label}</div>
                    <div className="text-xs text-muted-foreground">{val.description}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 4: Questions */}
          {step === "questions" && (
            <motion.div
              key="questions"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-lg font-semibold mb-2">Any specific questions?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Optional - add questions you want answered.
                </p>
              </div>
              <div className="flex gap-2">
                <Input
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Add a specific question..."
                  onKeyDown={(e) => e.key === "Enter" && addQuestion()}
                />
                <Button onClick={addQuestion} disabled={!newQuestion.trim()}>
                  Add
                </Button>
              </div>
              {specificQuestions.length > 0 && (
                <div className="space-y-2">
                  {specificQuestions.map((q, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 p-2 rounded bg-muted/50 text-sm"
                    >
                      <span className="flex-1">{q}</span>
                      <button
                        onClick={() => removeQuestion(i)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Step 5: Confirm */}
          {step === "confirm" && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-lg font-semibold mb-2">Ready to research</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Review and edit the research query below.
                </p>
              </div>
              <Textarea
                value={editedQuery}
                onChange={(e) => setEditedQuery(e.target.value)}
                className="min-h-[120px] resize-none"
              />
              <div className="space-y-2">
                <p className="text-sm font-medium">Research depth</p>
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
                    <div className="font-medium text-sm">Quick</div>
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
                    <div className="font-medium text-sm">Deep</div>
                    <div className="text-xs text-muted-foreground">~2-3 minutes</div>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 6: Research in progress */}
          {step === "research" && (
            <motion.div
              key="research"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 space-y-6"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-primary/20" />
                <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <Search className="absolute inset-0 m-auto w-6 h-6 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Researching...</h3>
                <p className="text-sm text-muted-foreground">
                  {researchDepth === "deep" 
                    ? "Deep analysis in progress. This may take a few minutes."
                    : "Quick research in progress..."}
                </p>
              </div>
            </motion.div>
          )}

          {/* Step 7: Results */}
          {step === "results" && results && (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-lg font-semibold mb-2">Research Complete</h3>
                <p className="text-sm text-muted-foreground">{results.summary}</p>
              </div>

              {results.keyFindings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Key Findings</h4>
                  <ul className="space-y-1">
                    {results.keyFindings.slice(0, 5).map((finding, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {results.citations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Sources ({results.citations.length})</h4>
                  <div className="space-y-1 max-h-[120px] overflow-y-auto">
                    {results.citations.slice(0, 8).map((citation, i) => (
                      <a
                        key={i}
                        href={citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span className="truncate">{citation.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <Button onClick={handleUseResearch} className="w-full" variant="shimmer">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Use This Research
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        {step !== "research" && step !== "results" && (
          <div className="flex items-center justify-between mt-8 pt-4 border-t">
            <Button
              variant="ghost"
              onClick={step === "topic" ? onClose : handleBack}
              disabled={isLoading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {step === "topic" ? "Cancel" : "Back"}
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed() || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : step === "confirm" ? (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Start Research
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}

        {step === "results" && (
          <div className="flex items-center justify-between mt-8 pt-4 border-t">
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

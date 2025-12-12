import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { History, Search, ArrowRight, Clock, ChevronDown, ChevronUp, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface ResearchEntry {
  id: string;
  query: string;
  subject: string | null;
  decision_type: string | null;
  audience: string | null;
  results: {
    summary?: string;
    keyFindings?: string[];
    rawContent?: string;
  } | null;
  created_at: string;
}

interface ResearchHistoryProps {
  onContinueResearch: (query: string, previousResults?: string) => void;
  onUseResults: (content: string) => void;
}

export const ResearchHistory = ({ onContinueResearch, onUseResults }: ResearchHistoryProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [history, setHistory] = useState<ResearchEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    loadHistory();
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("research_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error && data) {
        setHistory(data as ResearchEntry[]);
      }
    } catch (err) {
      console.error("Failed to load research history:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const { error } = await supabase
        .from("research_history")
        .delete()
        .eq("id", id);

      if (!error) {
        setHistory(prev => prev.filter(h => h.id !== id));
        toast({
          title: "Research deleted",
          description: "Entry removed from history.",
        });
      }
    } catch (err) {
      toast({
        title: "Failed to delete",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleContinue = (entry: ResearchEntry) => {
    const previousContent = entry.results?.rawContent || entry.results?.summary || "";
    onContinueResearch(entry.query, previousContent);
  };

  const handleUse = (entry: ResearchEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    if (entry.results?.rawContent) {
      onUseResults(entry.results.rawContent);
      toast({
        title: "Research loaded",
        description: "Previous research has been added to your input.",
      });
    }
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <span>Loading history...</span>
      </div>
    );
  }

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Research History</span>
          <span className="text-xs text-muted-foreground">
            ({history.length} recent)
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden"
          >
            {history.map((entry, index) => {
              const isEntryExpanded = expandedEntryId === entry.id;
              const timeAgo = formatDistanceToNow(new Date(entry.created_at), { addSuffix: true });
              
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "p-3 rounded-lg border transition-all cursor-pointer",
                    isEntryExpanded 
                      ? "bg-primary/5 border-primary/30"
                      : "bg-muted/20 border-border/50 hover:border-primary/20"
                  )}
                  onClick={() => setExpandedEntryId(isEntryExpanded ? null : entry.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium truncate">
                          {entry.subject || entry.query.slice(0, 50)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{timeAgo}</span>
                        {entry.decision_type && (
                          <>
                            <span>•</span>
                            <span className="capitalize">{entry.decision_type.replace('_', ' ')}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => handleDelete(entry.id, e)}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isEntryExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t border-border/50 space-y-3"
                      >
                        {entry.results?.summary && (
                          <p className="text-xs text-muted-foreground line-clamp-3">
                            {entry.results.summary}
                          </p>
                        )}
                        
                        {entry.results?.keyFindings && entry.results.keyFindings.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-xs text-muted-foreground uppercase">Key Findings</span>
                            <ul className="space-y-1">
                              {entry.results.keyFindings.slice(0, 3).map((finding, idx) => (
                                <li key={idx} className="text-xs text-foreground/80 flex items-start gap-2">
                                  <span className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                                  <span className="line-clamp-1">{finding}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7"
                            onClick={() => handleContinue(entry)}
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Continue Research
                          </Button>
                          {entry.results?.rawContent && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs h-7"
                              onClick={(e) => handleUse(entry, e)}
                            >
                              <ArrowRight className="w-3 h-3 mr-1" />
                              Use Results
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
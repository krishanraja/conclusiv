import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { History, Search, ArrowRight, Clock, ChevronDown, ChevronUp, Trash2, RefreshCw, User, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

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

interface BrandGroup {
  brand: string;
  entries: ResearchEntry[];
}

export const ResearchHistory = ({ onContinueResearch, onUseResults }: ResearchHistoryProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [history, setHistory] = useState<ResearchEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());

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
        .order("created_at", { ascending: false });

      if (!error && data) {
        setHistory(data as ResearchEntry[]);
        // Auto-expand first brand group if only one exists
        if (data.length > 0) {
          const firstBrand = data[0]?.subject || "Other";
          setExpandedBrands(new Set([firstBrand]));
        }
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
        // Visual feedback from item disappearing - no toast needed
        // If this was the last entry in a brand group, collapse it
        const entry = history.find(h => h.id === id);
        if (entry?.subject) {
          const remainingEntries = history.filter(h => h.id !== id && h.subject === entry.subject);
          if (remainingEntries.length === 0) {
            setExpandedBrands(prev => {
              const next = new Set(prev);
              next.delete(entry.subject!);
              return next;
            });
          }
        }
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
      // Content appears in input field - no toast needed
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

  // Group entries by brand (subject field)
  const brandGroups = useMemo(() => {
    const groups: Map<string, ResearchEntry[]> = new Map();
    
    history.forEach(entry => {
      const brand = entry.subject || "Other";
      if (!groups.has(brand)) {
        groups.set(brand, []);
      }
      groups.get(brand)!.push(entry);
    });
    
    // Convert to array and sort by most recent entry in each group
    return Array.from(groups.entries())
      .map(([brand, entries]) => ({
        brand,
        entries: entries.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
      }))
      .sort((a, b) => {
        const aLatest = new Date(a.entries[0].created_at).getTime();
        const bLatest = new Date(b.entries[0].created_at).getTime();
        return bLatest - aLatest;
      });
  }, [history]);

  const toggleBrand = (brand: string) => {
    setExpandedBrands(prev => {
      const next = new Set(prev);
      if (next.has(brand)) {
        next.delete(brand);
      } else {
        next.add(brand);
      }
      return next;
    });
  };

  if (history.length === 0) {
    return null;
  }

  const totalEntries = history.length;
  const totalBrands = brandGroups.length;

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
            ({totalBrands} {totalBrands === 1 ? 'brand' : 'brands'}, {totalEntries} {totalEntries === 1 ? 'entry' : 'entries'})
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
            className="space-y-3 overflow-hidden"
          >
            {/* Link to Profile for saved narratives */}
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Access Saved Narratives</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                View and manage all your saved narratives in your profile
              </p>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => navigate('/profile')}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Go to Profile
              </Button>
            </div>

            {/* Brand Groups */}
            {brandGroups.map((group) => {
              const isBrandExpanded = expandedBrands.has(group.brand);
              const brandEntryCount = group.entries.length;
              
              return (
                <motion.div
                  key={group.brand}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-border/50 overflow-hidden"
                >
                  {/* Brand Header */}
                  <button
                    onClick={() => toggleBrand(group.brand)}
                    className="w-full flex items-center justify-between p-3 bg-muted/20 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      <span className="text-sm font-medium truncate">{group.brand}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        ({brandEntryCount} {brandEntryCount === 1 ? 'entry' : 'entries'})
                      </span>
                    </div>
                    {isBrandExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                  </button>

                  {/* Brand Entries */}
                  <AnimatePresence>
                    {isBrandExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-2 space-y-2">
                          {group.entries.map((entry, index) => {
                            const isEntryExpanded = expandedEntryId === entry.id;
                            const timeAgo = formatDistanceToNow(new Date(entry.created_at), { addSuffix: true });
                            
                            return (
                              <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.03 }}
                                className={cn(
                                  "p-2.5 rounded-md border transition-all cursor-pointer",
                                  isEntryExpanded 
                                    ? "bg-primary/5 border-primary/30"
                                    : "bg-background/50 border-border/50 hover:border-primary/20"
                                )}
                                onClick={() => setExpandedEntryId(isEntryExpanded ? null : entry.id)}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Search className="w-3 h-3 text-muted-foreground shrink-0" />
                                      <span className="text-xs font-medium truncate">
                                        {entry.query.slice(0, 60)}
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
                                      className="h-6 w-6"
                                      onClick={(e) => handleDelete(entry.id, e)}
                                    >
                                      <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                                    </Button>
                                  </div>
                                </div>

                                <AnimatePresence>
                                  {isEntryExpanded && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="mt-2 pt-2 border-t border-border/50 space-y-2"
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
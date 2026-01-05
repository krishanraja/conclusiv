import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Sparkles, Loader2, Wand2, Target, Heart, Award, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNarrativeStore } from "@/store/narrativeStore";
import { getSuggestedHighlights } from "@/lib/api";
import { Button } from "@/components/ui/button";
import type { RefinementHighlight, HighlightCategory } from "@/lib/types";

interface HighlightableTextProps {
  text: string;
  highlights: RefinementHighlight[];
  onHighlight: (highlight: RefinementHighlight) => void;
  onRemoveHighlight: (index: number) => void;
}

// Category badge component
const CategoryBadge = ({ category }: { category?: HighlightCategory }) => {
  if (!category || category === 'general') return null;
  
  const config: Record<HighlightCategory, { icon: typeof Target; label: string; className: string }> = {
    proof_point: { icon: Target, label: "Proof", className: "text-blue-500 bg-blue-500/10" },
    emotional_hook: { icon: Heart, label: "Hook", className: "text-pink-500 bg-pink-500/10" },
    credibility_signal: { icon: Award, label: "Credibility", className: "text-amber-500 bg-amber-500/10" },
    key_metric: { icon: BarChart3, label: "Metric", className: "text-green-500 bg-green-500/10" },
    general: { icon: Sparkles, label: "", className: "" },
  };
  
  const { icon: Icon, label, className } = config[category] || config.general;
  
  return (
    <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium", className)}>
      <Icon className="w-2.5 h-2.5" />
      {label}
    </span>
  );
};

interface TextBlock {
  type: "paragraph" | "bullet" | "header";
  content: string;
  startIndex: number;
}

interface Sentence {
  text: string;
  startIndex: number;
  endIndex: number;
}

// Parse raw text into structured blocks (for desktop)
const parseTextIntoBlocks = (text: string): TextBlock[] => {
  const blocks: TextBlock[] = [];
  let currentIndex = 0;
  
  const paragraphs = text.split(/\n\n+/);
  
  paragraphs.forEach((para) => {
    const trimmedPara = para.trim();
    if (!trimmedPara) {
      currentIndex += para.length + 2;
      return;
    }
    
    const lines = trimmedPara.split(/\n/);
    const hasBullets = lines.some(line => /^[\s]*[-•*]\s|^[\s]*\d+[.)]\s/.test(line));
    
    if (hasBullets) {
      lines.forEach((line) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
          currentIndex += line.length + 1;
          return;
        }
        
        const isBullet = /^[-•*]\s|^\d+[.)]\s/.test(trimmedLine);
        const cleanContent = trimmedLine.replace(/^[-•*]\s+|^\d+[.)]\s+/, '');
        
        blocks.push({
          type: isBullet ? "bullet" : "paragraph",
          content: cleanContent,
          startIndex: text.indexOf(trimmedLine, currentIndex),
        });
        currentIndex += line.length + 1;
      });
    } else {
      const isHeader = trimmedPara.length < 60 && !trimmedPara.endsWith('.') && !trimmedPara.includes('\n');
      
      blocks.push({
        type: isHeader ? "header" : "paragraph",
        content: trimmedPara,
        startIndex: text.indexOf(trimmedPara, currentIndex),
      });
      currentIndex += para.length + 2;
    }
  });
  
  return blocks;
};

// Parse text into sentences for mobile-friendly chip selection
const parseIntoSentences = (text: string): Sentence[] => {
  const sentences: Sentence[] = [];
  
  // Split by sentence-ending punctuation, keeping the delimiter
  const parts = text.split(/(?<=[.!?])\s+/);
  
  let currentIndex = 0;
  parts.forEach((part) => {
    const trimmed = part.trim();
    if (trimmed.length < 10) {
      // Skip very short fragments
      currentIndex += part.length + 1;
      return;
    }
    
    // Find actual position in original text
    const startIndex = text.indexOf(trimmed, currentIndex);
    if (startIndex !== -1) {
      sentences.push({
        text: trimmed,
        startIndex,
        endIndex: startIndex + trimmed.length,
      });
      currentIndex = startIndex + trimmed.length;
    }
  });
  
  // If no sentences found (e.g., bullet points), fall back to line-based parsing
  if (sentences.length === 0) {
    const lines = text.split(/\n/).filter(l => l.trim().length > 10);
    let idx = 0;
    lines.forEach(line => {
      const trimmed = line.trim().replace(/^[-•*]\s+|^\d+[.)]\s+/, '');
      if (trimmed.length >= 10) {
        const startIndex = text.indexOf(trimmed, idx);
        if (startIndex !== -1) {
          sentences.push({
            text: trimmed,
            startIndex,
            endIndex: startIndex + trimmed.length,
          });
          idx = startIndex + trimmed.length;
        }
      }
    });
  }
  
  return sentences;
};

// Mobile-friendly chip-based highlighting with AI suggestions
const MobileHighlightChips = ({
  text,
  highlights,
  onHighlight,
  onRemoveHighlight,
}: HighlightableTextProps) => {
  const { extractedNarrativeIntent } = useNarrativeStore();
  const [suggestedHighlights, setSuggestedHighlights] = useState<RefinementHighlight[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestionsLoaded, setSuggestionsLoaded] = useState(false);
  
  const sentences = useMemo(() => parseIntoSentences(text), [text]);
  
  // Load AI suggestions if we have a narrative goal
  useEffect(() => {
    const loadSuggestions = async () => {
      if (!extractedNarrativeIntent?.coreMessage || suggestionsLoaded) return;
      
      setIsLoadingSuggestions(true);
      try {
        const result = await getSuggestedHighlights(text, extractedNarrativeIntent.coreMessage);
        if (result.highlights) {
          setSuggestedHighlights(result.highlights.map(h => ({
            start: h.start,
            end: h.end,
            text: h.text,
            category: h.category as HighlightCategory,
            isAiSuggested: true,
          })));
        }
      } catch (err) {
        console.error("Failed to get highlight suggestions:", err);
      } finally {
        setIsLoadingSuggestions(false);
        setSuggestionsLoaded(true);
      }
    };
    
    loadSuggestions();
  }, [text, extractedNarrativeIntent?.coreMessage, suggestionsLoaded]);
  
  const isHighlighted = useCallback((sentence: Sentence) => {
    return highlights.some(h => 
      (h.start <= sentence.startIndex && h.end >= sentence.endIndex) ||
      (h.start >= sentence.startIndex && h.start < sentence.endIndex) ||
      (h.end > sentence.startIndex && h.end <= sentence.endIndex)
    );
  }, [highlights]);
  
  const isSuggested = useCallback((sentence: Sentence) => {
    return suggestedHighlights.some(h => 
      (h.start <= sentence.startIndex && h.end >= sentence.endIndex) ||
      (h.start >= sentence.startIndex && h.start < sentence.endIndex) ||
      (h.end > sentence.startIndex && h.end <= sentence.endIndex)
    );
  }, [suggestedHighlights]);
  
  const getSuggestionCategory = useCallback((sentence: Sentence): HighlightCategory | undefined => {
    const suggestion = suggestedHighlights.find(h => 
      (h.start <= sentence.startIndex && h.end >= sentence.endIndex) ||
      (h.start >= sentence.startIndex && h.start < sentence.endIndex) ||
      (h.end > sentence.startIndex && h.end <= sentence.endIndex)
    );
    return suggestion?.category;
  }, [suggestedHighlights]);
  
  const getHighlightIndex = useCallback((sentence: Sentence) => {
    return highlights.findIndex(h => 
      h.start === sentence.startIndex && h.end === sentence.endIndex
    );
  }, [highlights]);
  
  const handleToggle = useCallback((sentence: Sentence) => {
    const existingIndex = getHighlightIndex(sentence);
    if (existingIndex !== -1) {
      onRemoveHighlight(existingIndex);
    } else {
      const category = getSuggestionCategory(sentence);
      onHighlight({
        start: sentence.startIndex,
        end: sentence.endIndex,
        text: sentence.text,
        category,
        isAiSuggested: isSuggested(sentence),
      });
    }
  }, [getHighlightIndex, onHighlight, onRemoveHighlight, getSuggestionCategory, isSuggested]);
  
  // Accept all AI suggestions
  const acceptAllSuggestions = () => {
    suggestedHighlights.forEach(suggestion => {
      // Check if not already highlighted
      const alreadyHighlighted = highlights.some(h => 
        h.start === suggestion.start && h.end === suggestion.end
      );
      if (!alreadyHighlighted) {
        onHighlight(suggestion);
      }
    });
  };
  
  if (sentences.length === 0) {
    return (
      <div className="p-4 bg-card rounded-lg border border-border/50 text-sm text-muted-foreground">
        No key passages found to highlight.
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {/* Header with AI suggestions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>Tap to select key passages</span>
        </div>
        
        {isLoadingSuggestions && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            Finding suggestions...
          </span>
        )}
        
        {suggestedHighlights.length > 0 && !isLoadingSuggestions && (
          <Button
            variant="ghost"
            size="sm"
            onClick={acceptAllSuggestions}
            className="h-7 text-xs text-primary"
          >
            <Wand2 className="w-3 h-3 mr-1" />
            Accept {suggestedHighlights.length} AI suggestions
          </Button>
        )}
      </div>
      
      <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
        {sentences.map((sentence, idx) => {
          const highlighted = isHighlighted(sentence);
          const suggested = isSuggested(sentence);
          const category = getSuggestionCategory(sentence);
          
          return (
            <motion.button
              key={idx}
              onClick={() => handleToggle(sentence)}
              className={cn(
                "w-full text-left p-3 rounded-lg border transition-all text-sm leading-relaxed",
                highlighted 
                  ? "bg-primary/10 border-primary/40 text-foreground" 
                  : suggested
                  ? "bg-amber-500/5 border-amber-500/30 text-foreground"
                  : "bg-card/50 border-border/50 text-muted-foreground hover:border-border hover:bg-card"
              )}
              whileTap={{ scale: 0.98 }}
              layout
            >
              <div className="flex items-start gap-2">
                <div className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                  highlighted 
                    ? "bg-primary text-primary-foreground" 
                    : suggested
                    ? "bg-amber-500/20 border border-amber-500/50"
                    : "bg-muted/50 border border-border"
                )}>
                  <AnimatePresence mode="wait">
                    {highlighted ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Check className="w-3 h-3" />
                      </motion.div>
                    ) : suggested ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Wand2 className="w-2.5 h-2.5 text-amber-500" />
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
                <div className="flex-1">
                  <span className="line-clamp-3">{sentence.text}</span>
                  {suggested && category && (
                    <div className="mt-1.5">
                      <CategoryBadge category={category} />
                    </div>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
      
      {highlights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-2 border-t border-border/50"
        >
          <p className="text-xs text-primary">
            {highlights.length} passage{highlights.length !== 1 ? 's' : ''} selected
          </p>
        </motion.div>
      )}
    </div>
  );
};

// Desktop text selection highlighting with AI suggestions
const DesktopHighlightableText = ({
  text,
  highlights,
  onHighlight,
  onRemoveHighlight,
}: HighlightableTextProps) => {
  const { extractedNarrativeIntent } = useNarrativeStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [suggestedHighlights, setSuggestedHighlights] = useState<RefinementHighlight[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestionsLoaded, setSuggestionsLoaded] = useState(false);

  const blocks = useMemo(() => parseTextIntoBlocks(text), [text]);
  
  // Load AI suggestions if we have a narrative goal
  useEffect(() => {
    const loadSuggestions = async () => {
      if (!extractedNarrativeIntent?.coreMessage || suggestionsLoaded) return;
      
      setIsLoadingSuggestions(true);
      try {
        const result = await getSuggestedHighlights(text, extractedNarrativeIntent.coreMessage);
        if (result.highlights) {
          setSuggestedHighlights(result.highlights.map(h => ({
            start: h.start,
            end: h.end,
            text: h.text,
            category: h.category as HighlightCategory,
            isAiSuggested: true,
          })));
        }
      } catch (err) {
        console.error("Failed to get highlight suggestions:", err);
      } finally {
        setIsLoadingSuggestions(false);
        setSuggestionsLoaded(true);
      }
    };
    
    loadSuggestions();
  }, [text, extractedNarrativeIntent?.coreMessage, suggestionsLoaded]);
  
  // Accept all AI suggestions
  const acceptAllSuggestions = () => {
    suggestedHighlights.forEach(suggestion => {
      const alreadyHighlighted = highlights.some(h => 
        h.start === suggestion.start && h.end === suggestion.end
      );
      if (!alreadyHighlighted) {
        onHighlight(suggestion);
      }
    });
  };

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setIsSelecting(false);
      return;
    }

    const selectedText = selection.toString().trim();
    if (!selectedText) {
      setIsSelecting(false);
      return;
    }

    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    
    if (containerRef.current) {
      preCaretRange.selectNodeContents(containerRef.current);
      preCaretRange.setEnd(range.startContainer, range.startOffset);
      const start = preCaretRange.toString().length;
      const end = start + selectedText.length;

      const overlaps = highlights.some(
        h => (start >= h.start && start < h.end) || (end > h.start && end <= h.end)
      );

      if (!overlaps) {
        onHighlight({ start, end, text: selectedText });
      }
    }

    selection.removeAllRanges();
    setIsSelecting(false);
  }, [highlights, onHighlight]);

  const renderHighlightedContent = (content: string, blockStartIndex: number) => {
    const blockEnd = blockStartIndex + content.length;
    const relevantHighlights = highlights
      .map((h, idx) => ({ ...h, originalIndex: idx }))
      .filter(h => h.start < blockEnd && h.end > blockStartIndex)
      .sort((a, b) => a.start - b.start);
    
    if (relevantHighlights.length === 0) {
      return <span>{content}</span>;
    }

    const parts: JSX.Element[] = [];
    let lastEnd = 0;

    relevantHighlights.forEach((highlight, idx) => {
      const localStart = Math.max(0, highlight.start - blockStartIndex);
      const localEnd = Math.min(content.length, highlight.end - blockStartIndex);
      
      if (localStart > lastEnd) {
        parts.push(
          <span key={`text-${idx}`}>
            {content.slice(lastEnd, localStart)}
          </span>
        );
      }

      parts.push(
        <motion.span
          key={`highlight-${idx}`}
          initial={{ backgroundColor: "hsl(var(--primary) / 0)" }}
          animate={{ backgroundColor: "hsl(var(--primary) / 0.3)" }}
          className="relative rounded px-0.5 group cursor-pointer"
          onClick={() => onRemoveHighlight(highlight.originalIndex)}
        >
          {content.slice(localStart, localEnd)}
          <span className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <X className="w-3 h-3 text-destructive bg-background rounded-full" />
          </span>
        </motion.span>
      );

      lastEnd = localEnd;
    });

    if (lastEnd < content.length) {
      parts.push(<span key="text-end">{content.slice(lastEnd)}</span>);
    }

    return parts;
  };

  const renderBlock = (block: TextBlock, index: number) => {
    const content = renderHighlightedContent(block.content, block.startIndex);
    
    switch (block.type) {
      case "header":
        return (
          <h4 
            key={index} 
            className="font-semibold text-foreground text-base mt-4 mb-2 first:mt-0"
          >
            {content}
          </h4>
        );
      case "bullet":
        return (
          <li 
            key={index} 
            className="flex items-start gap-2 py-1"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-shimmer-start mt-2 flex-shrink-0" />
            <span className="flex-1">{content}</span>
          </li>
        );
      case "paragraph":
      default:
        return (
          <p 
            key={index} 
            className="mb-3 last:mb-0 leading-relaxed"
          >
            {content}
          </p>
        );
    }
  };

  const renderBlocks = () => {
    const rendered: JSX.Element[] = [];
    let bulletGroup: TextBlock[] = [];
    let bulletGroupStart = 0;
    
    blocks.forEach((block, index) => {
      if (block.type === "bullet") {
        if (bulletGroup.length === 0) {
          bulletGroupStart = index;
        }
        bulletGroup.push(block);
      } else {
        if (bulletGroup.length > 0) {
          rendered.push(
            <ul key={`bullets-${bulletGroupStart}`} className="space-y-0.5 my-3 ml-1">
              {bulletGroup.map((b, i) => renderBlock(b, bulletGroupStart + i))}
            </ul>
          );
          bulletGroup = [];
        }
        rendered.push(renderBlock(block, index));
      }
    });
    
    if (bulletGroup.length > 0) {
      rendered.push(
        <ul key={`bullets-${bulletGroupStart}`} className="space-y-0.5 my-3 ml-1">
          {bulletGroup.map((b, i) => renderBlock(b, bulletGroupStart + i))}
        </ul>
      );
    }
    
    return rendered;
  };

  return (
    <div className="space-y-3">
      {/* AI Suggestions header */}
      {(isLoadingSuggestions || suggestedHighlights.length > 0) && (
        <div className="flex items-center justify-between">
          {isLoadingSuggestions ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              Finding passages that support your goal...
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Wand2 className="w-3 h-3 text-amber-500" />
              {suggestedHighlights.length} AI-suggested passages
            </span>
          )}
          
          {suggestedHighlights.length > 0 && !isLoadingSuggestions && (
            <Button
              variant="ghost"
              size="sm"
              onClick={acceptAllSuggestions}
              className="h-7 text-xs text-primary"
            >
              <Check className="w-3 h-3 mr-1" />
              Accept all suggestions
            </Button>
          )}
        </div>
      )}
      
      <div
        ref={containerRef}
        className="p-4 bg-card rounded-lg border border-border/50 max-h-[400px] overflow-y-auto text-sm select-text cursor-text"
        onMouseDown={() => setIsSelecting(true)}
        onMouseUp={handleMouseUp}
      >
        {renderBlocks()}
      </div>
    </div>
  );
};

// Main component - switches between mobile and desktop modes
export const HighlightableText = (props: HighlightableTextProps) => {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return <MobileHighlightChips {...props} />;
  }
  
  return <DesktopHighlightableText {...props} />;
};

import { useState, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import type { RefinementHighlight } from "@/lib/types";

interface HighlightableTextProps {
  text: string;
  highlights: RefinementHighlight[];
  onHighlight: (highlight: RefinementHighlight) => void;
  onRemoveHighlight: (index: number) => void;
}

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

// Mobile-friendly chip-based highlighting
const MobileHighlightChips = ({
  text,
  highlights,
  onHighlight,
  onRemoveHighlight,
}: HighlightableTextProps) => {
  const sentences = useMemo(() => parseIntoSentences(text), [text]);
  
  const isHighlighted = useCallback((sentence: Sentence) => {
    return highlights.some(h => 
      (h.start <= sentence.startIndex && h.end >= sentence.endIndex) ||
      (h.start >= sentence.startIndex && h.start < sentence.endIndex) ||
      (h.end > sentence.startIndex && h.end <= sentence.endIndex)
    );
  }, [highlights]);
  
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
      onHighlight({
        start: sentence.startIndex,
        end: sentence.endIndex,
        text: sentence.text,
      });
    }
  }, [getHighlightIndex, onHighlight, onRemoveHighlight]);
  
  if (sentences.length === 0) {
    return (
      <div className="p-4 bg-card rounded-lg border border-border/50 text-sm text-muted-foreground">
        No key passages found to highlight.
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        <span>Tap to select key passages</span>
      </div>
      
      <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
        {sentences.map((sentence, idx) => {
          const highlighted = isHighlighted(sentence);
          return (
            <motion.button
              key={idx}
              onClick={() => handleToggle(sentence)}
              className={cn(
                "w-full text-left p-3 rounded-lg border transition-all text-sm leading-relaxed",
                highlighted 
                  ? "bg-primary/10 border-primary/40 text-foreground" 
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
                    : "bg-muted/50 border border-border"
                )}>
                  <AnimatePresence mode="wait">
                    {highlighted && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Check className="w-3 h-3" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <span className="flex-1 line-clamp-3">{sentence.text}</span>
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

// Desktop text selection highlighting (original behavior)
const DesktopHighlightableText = ({
  text,
  highlights,
  onHighlight,
  onRemoveHighlight,
}: HighlightableTextProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  const blocks = useMemo(() => parseTextIntoBlocks(text), [text]);

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
    <div
      ref={containerRef}
      className="p-4 bg-card rounded-lg border border-border/50 max-h-[400px] overflow-y-auto text-sm select-text cursor-text"
      onMouseDown={() => setIsSelecting(true)}
      onMouseUp={handleMouseUp}
    >
      {renderBlocks()}
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

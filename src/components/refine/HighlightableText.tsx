import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import type { RefinementHighlight } from "@/lib/types";

interface HighlightableTextProps {
  text: string;
  highlights: RefinementHighlight[];
  onHighlight: (highlight: RefinementHighlight) => void;
  onRemoveHighlight: (index: number) => void;
}

export const HighlightableText = ({
  text,
  highlights,
  onHighlight,
  onRemoveHighlight,
}: HighlightableTextProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSelecting, setIsSelecting] = useState(false);

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

    // Find the start position in the original text
    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    
    if (containerRef.current) {
      preCaretRange.selectNodeContents(containerRef.current);
      preCaretRange.setEnd(range.startContainer, range.startOffset);
      const start = preCaretRange.toString().length;
      const end = start + selectedText.length;

      // Check for overlapping highlights
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

  // Render text with highlights
  const renderHighlightedText = () => {
    if (highlights.length === 0) {
      return <span>{text}</span>;
    }

    // Sort highlights by start position
    const sortedHighlights = [...highlights].sort((a, b) => a.start - b.start);
    const parts: JSX.Element[] = [];
    let lastEnd = 0;

    sortedHighlights.forEach((highlight, idx) => {
      // Add non-highlighted text before this highlight
      if (highlight.start > lastEnd) {
        parts.push(
          <span key={`text-${idx}`}>
            {text.slice(lastEnd, highlight.start)}
          </span>
        );
      }

      // Add highlighted text
      parts.push(
        <motion.span
          key={`highlight-${idx}`}
          initial={{ backgroundColor: "hsl(var(--primary) / 0)" }}
          animate={{ backgroundColor: "hsl(var(--primary) / 0.3)" }}
          className="relative rounded px-0.5 group cursor-pointer"
          onClick={() => onRemoveHighlight(idx)}
        >
          {text.slice(highlight.start, highlight.end)}
          <span className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <X className="w-3 h-3 text-destructive bg-background rounded-full" />
          </span>
        </motion.span>
      );

      lastEnd = highlight.end;
    });

    // Add remaining text after last highlight
    if (lastEnd < text.length) {
      parts.push(<span key="text-end">{text.slice(lastEnd)}</span>);
    }

    return parts;
  };

  return (
    <div
      ref={containerRef}
      className="p-4 bg-card rounded-lg border border-border/50 max-h-[400px] overflow-y-auto text-sm leading-relaxed select-text cursor-text"
      onMouseDown={() => setIsSelecting(true)}
      onMouseUp={handleMouseUp}
    >
      {renderHighlightedText()}
    </div>
  );
};
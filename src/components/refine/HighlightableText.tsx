import { useState, useRef, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
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

// Parse raw text into structured blocks
const parseTextIntoBlocks = (text: string): TextBlock[] => {
  const blocks: TextBlock[] = [];
  let currentIndex = 0;
  
  // Split by double newlines for paragraphs
  const paragraphs = text.split(/\n\n+/);
  
  paragraphs.forEach((para) => {
    const trimmedPara = para.trim();
    if (!trimmedPara) {
      currentIndex += para.length + 2;
      return;
    }
    
    // Check if this paragraph contains bullet points
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
        // Remove bullet markers for display
        const cleanContent = trimmedLine.replace(/^[-•*]\s+|^\d+[.)]\s+/, '');
        
        blocks.push({
          type: isBullet ? "bullet" : "paragraph",
          content: cleanContent,
          startIndex: text.indexOf(trimmedLine, currentIndex),
        });
        currentIndex += line.length + 1;
      });
    } else {
      // Check if it's a short line (potential header)
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

export const HighlightableText = ({
  text,
  highlights,
  onHighlight,
  onRemoveHighlight,
}: HighlightableTextProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // Parse text into structured blocks
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

  // Render text with highlights for a specific content string
  const renderHighlightedContent = (content: string, blockStartIndex: number) => {
    // Find highlights that overlap with this block
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
      // Convert to local indices within this block
      const localStart = Math.max(0, highlight.start - blockStartIndex);
      const localEnd = Math.min(content.length, highlight.end - blockStartIndex);
      
      // Add non-highlighted text before this highlight
      if (localStart > lastEnd) {
        parts.push(
          <span key={`text-${idx}`}>
            {content.slice(lastEnd, localStart)}
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

    // Add remaining text after last highlight
    if (lastEnd < content.length) {
      parts.push(<span key="text-end">{content.slice(lastEnd)}</span>);
    }

    return parts;
  };

  // Render a block based on its type
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

  // Group consecutive bullets into lists
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
        // Flush any pending bullet group
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
    
    // Flush remaining bullets
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

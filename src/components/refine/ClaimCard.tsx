import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Pencil, ChevronDown, ChevronUp, Loader2, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { normalizeClaim } from "@/lib/api";
import type { KeyClaim } from "@/lib/types";

interface ClaimCardProps {
  claim: KeyClaim;
  index: number;
  total: number;
  onApprove: () => void;
  onReject: () => void;
  onUpdate: (updates: { title?: string; text?: string }) => void;
  onSwapAlternative?: (alternativeIndex: number) => void;
}

const TITLE_MAX = 60;
const TEXT_MAX = 200;

export const ClaimCard = ({
  claim,
  index,
  total,
  onApprove,
  onReject,
  onUpdate,
  onSwapAlternative,
}: ClaimCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(claim.title);
  const [editText, setEditText] = useState(claim.text);
  const [isNormalizing, setIsNormalizing] = useState(false);
  
  const isApproved = claim.approved === true;
  const isRejected = claim.approved === false;
  const isEdited = claim.edited;

  // Show truncated text if longer than 120 chars and not expanded
  const shouldTruncate = claim.text.length > 120;
  const displayText = shouldTruncate && !isExpanded 
    ? claim.text.slice(0, 120) + "..." 
    : claim.text;

  const handleStartEdit = () => {
    setEditTitle(claim.title);
    setEditText(claim.text);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditTitle(claim.title);
    setEditText(claim.text);
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    // Check if normalization is needed (significantly over limits)
    const needsNormalization = editTitle.length > TITLE_MAX * 1.5 || editText.length > TEXT_MAX * 1.5;
    
    if (needsNormalization) {
      setIsNormalizing(true);
      try {
        const result = await normalizeClaim(editTitle, editText);
        if (result.error) {
          console.error('[ClaimCard] Normalization error:', result.error);
          // Fall back to truncation
          onUpdate({ 
            title: editTitle.slice(0, TITLE_MAX), 
            text: editText.slice(0, TEXT_MAX) 
          });
        } else {
          onUpdate({ 
            title: result.title || editTitle.slice(0, TITLE_MAX), 
            text: result.text || editText.slice(0, TEXT_MAX) 
          });
        }
      } catch (err) {
        console.error('[ClaimCard] Normalization failed:', err);
        onUpdate({ 
          title: editTitle.slice(0, TITLE_MAX), 
          text: editText.slice(0, TEXT_MAX) 
        });
      } finally {
        setIsNormalizing(false);
      }
    } else {
      // Just save with truncation if needed
      onUpdate({ 
        title: editTitle.slice(0, TITLE_MAX), 
        text: editText.slice(0, TEXT_MAX) 
      });
    }
    
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="p-4 rounded-lg border border-primary/50 bg-primary/5"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <span className="text-xs text-muted-foreground font-medium">
            Editing claim {index + 1} of {total}
          </span>
        </div>

        {/* Title input */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-muted-foreground">Title</label>
            <span className={cn(
              "text-xs",
              editTitle.length > TITLE_MAX ? "text-destructive" : "text-muted-foreground"
            )}>
              {editTitle.length}/{TITLE_MAX}
            </span>
          </div>
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Claim title..."
            className="text-sm"
            autoFocus
          />
        </div>

        {/* Text input */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-muted-foreground">Statement</label>
            <span className={cn(
              "text-xs",
              editText.length > TEXT_MAX ? "text-destructive" : "text-muted-foreground"
            )}>
              {editText.length}/{TEXT_MAX}
            </span>
          </div>
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            placeholder="Claim statement..."
            className="text-sm min-h-[80px] resize-none"
            rows={3}
          />
          {(editTitle.length > TITLE_MAX * 1.5 || editText.length > TEXT_MAX * 1.5) && (
            <p className="text-xs text-amber-500 mt-1">
              Text exceeds limits - will be cleaned up on save
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancelEdit}
            disabled={isNormalizing}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSaveEdit}
            disabled={isNormalizing || (!editTitle.trim() && !editText.trim())}
          >
            {isNormalizing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Cleaning up...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "p-4 rounded-lg border transition-all",
        isApproved && "border-green-500/50 bg-green-500/5",
        isRejected && "border-red-500/50 bg-red-500/5",
        isEdited && !isApproved && !isRejected && "border-blue-500/50 bg-blue-500/5",
        !isApproved && !isRejected && !isEdited && "border-border/50 bg-card hover:border-border"
      )}
    >
      {/* Header row: number + actions */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">
            {index + 1} of {total}
          </span>
          {isEdited && (
            <span className="text-[10px] text-blue-500 font-medium px-1.5 py-0.5 bg-blue-500/10 rounded">
              Edited
            </span>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <Button
            variant={isApproved ? "default" : "outline"}
            size="sm"
            onClick={onApprove}
            className={cn(
              "h-7 w-7 p-0",
              isApproved && "bg-green-600 hover:bg-green-700 border-green-600"
            )}
            title="Approve claim"
          >
            <Check className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant={isRejected ? "default" : "outline"}
            size="sm"
            onClick={onReject}
            className={cn(
              "h-7 w-7 p-0",
              isRejected && "bg-red-600 hover:bg-red-700 border-red-600"
            )}
            title="Reject claim"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStartEdit}
            className="h-7 px-2"
            title="Edit claim"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          
          {/* Swap alternatives dropdown */}
          {claim.alternatives && claim.alternatives.length > 0 && onSwapAlternative && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 border-primary/30 text-primary hover:bg-primary/10"
                  title={`${claim.alternatives.length} alternative${claim.alternatives.length > 1 ? 's' : ''} available`}
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <div className="px-2 py-1.5 text-xs text-muted-foreground border-b border-border/50 mb-1">
                  Swap to alternative
                </div>
                {claim.alternatives.map((alt, altIndex) => (
                  <DropdownMenuItem
                    key={altIndex}
                    onClick={() => onSwapAlternative(altIndex)}
                    className="flex flex-col items-start gap-0.5 py-2 cursor-pointer"
                  >
                    <span className="text-sm font-medium text-foreground">{alt.title}</span>
                    <span className="text-xs text-muted-foreground line-clamp-2">{alt.text}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Title - prominent headline */}
      <h4 className="text-sm font-semibold text-foreground mb-1.5 leading-tight">
        {claim.title}
      </h4>

      {/* Full text - secondary */}
      <p className="text-xs text-muted-foreground leading-relaxed">
        {displayText}
      </p>

      {/* Expand/collapse for long text */}
      {shouldTruncate && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs text-primary/70 hover:text-primary mt-1.5 transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3 h-3" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              Read more
            </>
          )}
        </button>
      )}

      {/* Source */}
      {claim.source && (
        <p className="text-[10px] text-muted-foreground/60 mt-2 pt-2 border-t border-border/30">
          Source: {claim.source}
        </p>
      )}
    </motion.div>
  );
};

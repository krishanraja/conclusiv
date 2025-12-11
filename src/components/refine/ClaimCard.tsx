import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Flag, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { KeyClaim } from "@/lib/types";

interface ClaimCardProps {
  claim: KeyClaim;
  index: number;
  total: number;
  onApprove: () => void;
  onReject: () => void;
  onFlagMisleading: () => void;
}

export const ClaimCard = ({
  claim,
  index,
  total,
  onApprove,
  onReject,
  onFlagMisleading,
}: ClaimCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isApproved = claim.approved === true;
  const isRejected = claim.approved === false;
  const isFlagged = claim.flaggedMisleading;

  // Show truncated text if longer than 120 chars and not expanded
  const shouldTruncate = claim.text.length > 120;
  const displayText = shouldTruncate && !isExpanded 
    ? claim.text.slice(0, 120) + "..." 
    : claim.text;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "p-4 rounded-lg border transition-all",
        isApproved && "border-green-500/50 bg-green-500/5",
        isRejected && "border-red-500/50 bg-red-500/5",
        isFlagged && "border-amber-500/50 bg-amber-500/5",
        !isApproved && !isRejected && !isFlagged && "border-border/50 bg-card hover:border-border"
      )}
    >
      {/* Header row: number + actions */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-xs text-muted-foreground font-medium">
          {index + 1} of {total}
        </span>
        
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
            variant={isFlagged ? "default" : "ghost"}
            size="sm"
            onClick={onFlagMisleading}
            className={cn(
              "h-7 px-2",
              isFlagged && "bg-amber-600 hover:bg-amber-700 border-amber-600"
            )}
            title="Flag as misleading"
          >
            <Flag className="w-3.5 h-3.5" />
          </Button>
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

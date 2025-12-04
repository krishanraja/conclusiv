import { motion } from "framer-motion";
import { Check, X, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { KeyClaim } from "@/lib/types";

interface ClaimCardProps {
  claim: KeyClaim;
  onApprove: () => void;
  onReject: () => void;
  onFlagMisleading: () => void;
}

export const ClaimCard = ({
  claim,
  onApprove,
  onReject,
  onFlagMisleading,
}: ClaimCardProps) => {
  const isApproved = claim.approved === true;
  const isRejected = claim.approved === false;
  const isFlagged = claim.flaggedMisleading;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 rounded-lg border transition-colors",
        isApproved && "border-green-500/50 bg-green-500/5",
        isRejected && "border-red-500/50 bg-red-500/5",
        isFlagged && "border-amber-500/50 bg-amber-500/5",
        !isApproved && !isRejected && !isFlagged && "border-border/50 bg-card"
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Claim text */}
        <div className="flex-1">
          <p className="text-sm text-foreground">{claim.text}</p>
          {claim.source && (
            <p className="text-xs text-muted-foreground mt-1">
              Source: {claim.source}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant={isApproved ? "default" : "outline"}
            size="sm"
            onClick={onApprove}
            className={cn(
              "h-8 w-8 p-0",
              isApproved && "bg-green-600 hover:bg-green-700 border-green-600"
            )}
          >
            <Check className="w-4 h-4" />
          </Button>
          <Button
            variant={isRejected ? "default" : "outline"}
            size="sm"
            onClick={onReject}
            className={cn(
              "h-8 w-8 p-0",
              isRejected && "bg-red-600 hover:bg-red-700 border-red-600"
            )}
          >
            <X className="w-4 h-4" />
          </Button>
          <Button
            variant={isFlagged ? "default" : "ghost"}
            size="sm"
            onClick={onFlagMisleading}
            className={cn(
              "h-8 px-2",
              isFlagged && "bg-amber-600 hover:bg-amber-700 border-amber-600"
            )}
          >
            <Flag className="w-4 h-4" />
            <span className="ml-1 text-xs hidden sm:inline">Misleading</span>
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
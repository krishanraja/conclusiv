import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, X, Pencil, ChevronDown, ChevronUp, Loader2, ArrowRightLeft, ShieldCheck, Shield, ShieldAlert, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { normalizeClaim, verifyClaim } from "@/lib/api";
import type { KeyClaim, ClaimVerification, ClaimFreshnessStatus } from "@/lib/types";

// Simplified auto-verify badge - color coded, no click needed
const VerificationBadge = ({ 
  verification, 
  isLoading,
}: { 
  verification?: ClaimVerification; 
  isLoading?: boolean;
}) => {
  if (isLoading) {
    return (
      <motion.span 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted/50 text-muted-foreground"
      >
        <Loader2 className="w-3 h-3 animate-spin" />
        <span className="hidden sm:inline">Verifying</span>
      </motion.span>
    );
  }
  
  if (!verification || verification.status === "pending" || verification.status === "checking") {
    return null;
  }

  const config = {
    verified: {
      icon: ShieldCheck,
      bgClass: "bg-green-500/15",
      textClass: "text-green-500",
      label: "Verified",
      description: "Confirmed by external sources",
    },
    reliable: {
      icon: Shield,
      bgClass: "bg-amber-500/15",
      textClass: "text-amber-500",
      label: "Reliable",
      description: "Appears consistent with sources",
    },
    unreliable: {
      icon: ShieldAlert,
      bgClass: "bg-red-500/15",
      textClass: "text-red-500",
      label: "Unreliable",
      description: "Could not find supporting evidence",
    },
  };

  const statusConfig = config[verification.status] || config.reliable;
  const { icon: Icon, bgClass, textClass, label, description } = statusConfig;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.span 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all",
              bgClass,
              textClass
            )}
          >
            <Icon className="w-3 h-3" />
            <span className="hidden sm:inline">{label}</span>
          </motion.span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[280px]">
          <p className="text-xs font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
          {verification.summary && (
            <p className="text-xs mt-1 pt-1 border-t border-border/50">{verification.summary}</p>
          )}
          {verification.confidence !== undefined && (
            <p className="text-[10px] text-muted-foreground mt-1">
              Confidence: {verification.confidence}%
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Freshness badge - shows data currency
const FreshnessBadge = ({ 
  freshness,
  reason,
}: { 
  freshness?: ClaimFreshnessStatus;
  reason?: string;
}) => {
  if (!freshness) return null;

  const config = {
    fresh: {
      icon: Clock,
      bgClass: "bg-green-500/15",
      dotClass: "bg-green-500",
      textClass: "text-green-500",
      label: "Fresh",
      description: "Data is current",
    },
    dated: {
      icon: Clock,
      bgClass: "bg-amber-500/15",
      dotClass: "bg-amber-500",
      textClass: "text-amber-500",
      label: "Dated",
      description: "Data may be outdated",
    },
    stale: {
      icon: AlertCircle,
      bgClass: "bg-red-500/15",
      dotClass: "bg-red-500",
      textClass: "text-red-500",
      label: "Stale",
      description: "Data is outdated",
    },
  };

  const freshnessConfig = config[freshness] || config.dated;
  const { dotClass, textClass, bgClass, label, description } = freshnessConfig;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.span 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30, delay: 0.1 }}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
              bgClass,
              textClass
            )}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full", dotClass)} />
            <span className="hidden sm:inline">{label}</span>
          </motion.span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[250px]">
          <p className="text-xs font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
          {reason && (
            <p className="text-xs mt-1 pt-1 border-t border-border/50">{reason}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface ClaimCardProps {
  claim: KeyClaim;
  index: number;
  total: number;
  onApprove: () => void;
  onReject: () => void;
  onUpdate: (updates: { title?: string; text?: string; verification?: ClaimVerification }) => void;
  onSwapAlternative?: (alternativeIndex: number) => void;
  autoVerify?: boolean;
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
  autoVerify = false,
}: ClaimCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(claim.title);
  const [editText, setEditText] = useState(claim.text);
  const [isNormalizing, setIsNormalizing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const isApproved = claim.approved === true;
  const isRejected = claim.approved === false;
  const isEdited = claim.edited;

  // Auto-verify claim - runs automatically, no user interaction needed
  const runVerification = async () => {
    if (isVerifying) return;
    
    setIsVerifying(true);
    try {
      const result = await verifyClaim(claim.text, claim.title);
      if (result.status) {
        onUpdate({
          verification: {
            status: result.status,
            confidence: result.confidence,
            summary: result.summary,
            checkedAt: Date.now(),
            freshness: result.freshness,
            freshnessReason: result.freshnessReason,
            dataDate: result.dataDate,
            sources: result.sources,
          },
        });
      }
    } catch (err) {
      console.error('[ClaimCard] Verification failed:', err);
      // Set as reliable by default on error
      onUpdate({
        verification: {
          status: "reliable",
          confidence: 50,
          summary: "Could not verify - marked as reliable by default",
          checkedAt: Date.now(),
          freshness: "dated",
          freshnessReason: "Verification error",
        },
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Auto-verify claim if enabled and not already verified
  useEffect(() => {
    if (autoVerify && !claim.verification && !isVerifying) {
      // Stagger verification calls to avoid rate limiting (1.5s between each)
      const delay = index * 1500;
      const timer = setTimeout(runVerification, delay);
      return () => clearTimeout(timer);
    }
  }, [autoVerify, claim.verification, index]);

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
      {/* Header row: number + badges + actions */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium">
            {index + 1} of {total}
          </span>
          {isEdited && (
            <span className="text-[10px] text-blue-500 font-medium px-1.5 py-0.5 bg-blue-500/10 rounded">
              Edited
            </span>
          )}
          {/* Verification + Freshness badges - auto displayed */}
          <VerificationBadge verification={claim.verification} isLoading={isVerifying} />
          <FreshnessBadge 
            freshness={claim.verification?.freshness} 
            reason={claim.verification?.freshnessReason} 
          />
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
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

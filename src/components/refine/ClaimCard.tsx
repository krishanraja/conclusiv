import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, X, Pencil, ChevronDown, ChevronUp, Loader2, ArrowRightLeft, ShieldCheck, Shield, ShieldAlert, ShieldQuestion, Clock, AlertCircle, RefreshCw, ThumbsUp, AlertTriangle, ThumbsDown, Minus, ExternalLink, Database, Newspaper, Search, TrendingUp } from "lucide-react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { normalizeClaim, verifyClaim } from "@/lib/api";
import type { KeyClaim, ClaimVerification, ClaimFreshnessStatus, ClaimAlignment } from "@/lib/types";

// Narrative alignment badge - shows how claim relates to user's goal
const AlignmentBadge = ({
  alignment,
  reason,
}: {
  alignment?: ClaimAlignment;
  reason?: string;
}) => {
  if (!alignment || alignment === 'neutral') return null;

  const config = {
    supports: {
      icon: ThumbsUp,
      bgClass: "bg-green-500/15",
      textClass: "text-green-500",
      label: "Supports",
      description: "Supports your narrative goal",
    },
    potential_objection: {
      icon: AlertTriangle,
      bgClass: "bg-amber-500/15",
      textClass: "text-amber-500",
      label: "Objection",
      description: "Potential audience concern - address proactively",
    },
    undermines: {
      icon: ThumbsDown,
      bgClass: "bg-red-500/15",
      textClass: "text-red-500",
      label: "Undermines",
      description: "May conflict with your narrative goal",
    },
    neutral: {
      icon: Minus,
      bgClass: "bg-muted/50",
      textClass: "text-muted-foreground",
      label: "Neutral",
      description: "Neither helps nor hurts your goal",
    },
  };

  const alignmentConfig = config[alignment] || config.neutral;
  const { icon: Icon, bgClass, textClass, label, description } = alignmentConfig;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium cursor-pointer",
            bgClass,
            textClass
          )}
          type="button"
        >
          <Icon className="w-3 h-3" />
          <span className="hidden sm:inline">{label}</span>
        </motion.button>
      </PopoverTrigger>
      <PopoverContent side="top" className="w-64 p-3" align="start">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Icon className={cn("w-4 h-4", textClass)} />
            <p className="text-sm font-medium">{label}</p>
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
          {reason && (
            <p className="text-xs pt-2 border-t border-border/50">{reason}</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Verification badge - now includes unable_to_verify with retry
const VerificationBadge = ({
  verification,
  isLoading,
  retryCount,
  onRetry,
}: {
  verification?: ClaimVerification;
  isLoading?: boolean;
  retryCount?: number;
  onRetry?: () => void;
}) => {
  if (isLoading) {
    return (
      <motion.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted/50 text-muted-foreground"
      >
        <Loader2 className="w-3 h-3 animate-spin" />
        <span className="hidden sm:inline">
          {retryCount && retryCount > 0 ? `Retry ${retryCount}...` : 'Verifying'}
        </span>
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
    unable_to_verify: {
      icon: ShieldQuestion,
      bgClass: "bg-orange-500/15",
      textClass: "text-orange-500",
      label: "Needs Review",
      description: "Automatic verification failed - please verify manually",
    },
  };

  const statusConfig = config[verification.status] || config.unable_to_verify;
  const { icon: Icon, bgClass, textClass, label, description } = statusConfig;
  const isUnableToVerify = verification.status === "unable_to_verify";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <motion.button 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all cursor-pointer",
            bgClass,
            textClass
          )}
          type="button"
        >
          <Icon className="w-3 h-3" />
          <span className="hidden sm:inline">{label}</span>
        </motion.button>
      </PopoverTrigger>
      <PopoverContent side="top" className="w-80 p-0" align="start">
        <div className="space-y-0">
          {/* Header */}
          <div className="flex items-center gap-2 p-3 border-b border-border/50">
            <Icon className={cn("w-4 h-4", textClass)} />
            <p className="text-sm font-semibold">{label}</p>
          </div>

          {/* Confidence Score */}
          {verification.confidence !== undefined && verification.confidence > 0 && (
            <div className="px-3 py-2 bg-muted/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground font-medium">CONFIDENCE</span>
                <span className="text-xs font-semibold">{verification.confidence}%</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn("h-full transition-all", textClass.replace('text-', 'bg-'))}
                  style={{ width: `${verification.confidence}%` }}
                />
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="p-3 space-y-2">
            <p className="text-xs text-muted-foreground">{description}</p>
            {verification.summary && (
              <p className="text-xs pt-2 border-t border-border/50 leading-relaxed">{verification.summary}</p>
            )}
          </div>

          {/* Data Sources */}
          {verification.sources && verification.sources.length > 0 && (
            <div className="px-3 pb-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground mb-2">
                <Database className="w-3 h-3" />
                <span>DATA SOURCES ({verification.sources.length})</span>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {verification.sources.map((source, idx) => (
                  <a
                    key={idx}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-start gap-1.5 p-1.5 rounded text-xs hover:bg-muted/50 transition-colors group"
                  >
                    <div className="pt-0.5">
                      {source.url.includes('alphavantage') ? (
                        <TrendingUp className="w-3 h-3 text-green-500" />
                      ) : source.url.includes('news') ? (
                        <Newspaper className="w-3 h-3 text-blue-500" />
                      ) : (
                        <Search className="w-3 h-3 text-amber-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs truncate group-hover:text-primary">{source.title}</p>
                      {source.publishedAt && (
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(source.publishedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Retry button for failed verifications */}
          {isUnableToVerify && onRetry && (
            <div className="p-3 border-t border-border/50">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRetry();
                }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-orange-500/20 text-orange-500 text-xs font-medium hover:bg-orange-500/30 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Retry Verification
              </button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
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
    <Popover>
      <PopoverTrigger asChild>
        <motion.button 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30, delay: 0.1 }}
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium cursor-pointer",
            bgClass,
            textClass
          )}
          type="button"
        >
          <span className={cn("w-1.5 h-1.5 rounded-full", dotClass)} />
          <span className="hidden sm:inline">{label}</span>
        </motion.button>
      </PopoverTrigger>
      <PopoverContent side="top" className="w-64 p-3" align="start">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={cn("w-2 h-2 rounded-full", dotClass)} />
            <p className="text-sm font-medium">{label}</p>
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
          {reason && (
            <p className="text-xs pt-2 border-t border-border/50">{reason}</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
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
  const [retryCount, setRetryCount] = useState(0);

  const isApproved = claim.approved === true;
  const isRejected = claim.approved === false;
  const isEdited = claim.edited;

  // Auto-verify claim with retry logic - runs automatically, no user interaction needed
  const runVerification = async (attempt = 0) => {
    if (isVerifying) return;

    setIsVerifying(true);
    try {
      const result = await verifyClaim(claim.text, claim.title);
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
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error('[ClaimCard] Verification failed (attempt ' + (attempt + 1) + '):', err);

      // Retry logic: up to 2 retries with exponential backoff
      const maxRetries = 2;
      if (attempt < maxRetries) {
        const backoffDelay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.log(`[ClaimCard] Retrying in ${backoffDelay}ms...`);
        setIsVerifying(false);
        setTimeout(() => runVerification(attempt + 1), backoffDelay);
        setRetryCount(attempt + 1);
        return;
      }

      // Final failure after retries
      setRetryCount(0);
      onUpdate({
        verification: {
          status: "unable_to_verify",
          confidence: 0,
          summary: "Verification failed after multiple attempts. Please verify manually or try again later.",
          checkedAt: Date.now(),
          freshness: "dated",
          freshnessReason: "Verification error",
        },
      });
    } finally {
      setIsVerifying(false);
    }
  };
  
  // Retry verification (clears existing and re-runs)
  const handleRetryVerification = () => {
    onUpdate({ verification: undefined });
    runVerification();
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
          {/* Narrative alignment badge - shows relationship to goal */}
          <AlignmentBadge 
            alignment={claim.alignment} 
            reason={claim.alignmentReason} 
          />
          {/* Verification + Freshness badges - auto displayed */}
          <VerificationBadge
            verification={claim.verification}
            isLoading={isVerifying}
            retryCount={retryCount}
            onRetry={handleRetryVerification}
          />
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
            aria-label="Approve claim"
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
            aria-label="Reject claim"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStartEdit}
            className="h-7 px-2"
            title="Edit claim"
            aria-label="Edit claim"
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
                  aria-label={`Swap with ${claim.alternatives.length} alternative${claim.alternatives.length > 1 ? 's' : ''}`}
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

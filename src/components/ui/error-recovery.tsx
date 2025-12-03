import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, FileText, HelpCircle } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export type ErrorCode = 'RATE_LIMIT' | 'PAYMENT_REQUIRED' | 'TIMEOUT' | 'PARSE_ERROR' | 'NETWORK' | 'UNKNOWN';

interface APIError {
  code: ErrorCode;
  message: string;
  retryable: boolean;
  retryAfter?: number;
}

interface ErrorRecoveryProps {
  error: APIError;
  onRetry: () => void;
  onSimplify?: () => void;
  onDismiss: () => void;
  inputLength?: number;
}

const errorConfig: Record<ErrorCode, { title: string; description: string; icon: React.ElementType; color: string }> = {
  RATE_LIMIT: {
    title: "Too many requests",
    description: "Please wait a moment before trying again.",
    icon: RefreshCw,
    color: "text-amber-500",
  },
  PAYMENT_REQUIRED: {
    title: "Usage limit reached",
    description: "Please add credits to continue using the service.",
    icon: AlertTriangle,
    color: "text-amber-500",
  },
  TIMEOUT: {
    title: "Request timed out",
    description: "The document may be too long. Try with less text.",
    icon: RefreshCw,
    color: "text-amber-500",
  },
  PARSE_ERROR: {
    title: "Processing error",
    description: "We had trouble understanding the response. Please try again.",
    icon: FileText,
    color: "text-amber-500",
  },
  NETWORK: {
    title: "Connection error",
    description: "Please check your internet connection and try again.",
    icon: AlertTriangle,
    color: "text-red-500",
  },
  UNKNOWN: {
    title: "Something went wrong",
    description: "An unexpected error occurred. Please try again.",
    icon: HelpCircle,
    color: "text-red-500",
  },
};

export const ErrorRecovery = ({ 
  error, 
  onRetry, 
  onSimplify, 
  onDismiss,
  inputLength = 0 
}: ErrorRecoveryProps) => {
  const config = errorConfig[error.code] || errorConfig.UNKNOWN;
  const Icon = config.icon;

  const showSimplify = onSimplify && inputLength > 10000 && 
    (error.code === 'TIMEOUT' || error.code === 'PARSE_ERROR');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-6"
    >
      <div className="w-full max-w-md space-y-6">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="flex justify-center"
        >
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center",
            "bg-destructive/10"
          )}>
            <Icon className={cn("w-8 h-8", config.color)} />
          </div>
        </motion.div>

        {/* Message */}
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold text-foreground">{config.title}</h3>
          <p className="text-sm text-muted-foreground">{config.description}</p>
          {error.message && error.message !== config.description && (
            <p className="text-xs text-muted-foreground/70 mt-2">
              Details: {error.message}
            </p>
          )}
        </div>

        {/* Retry timer */}
        {error.retryAfter && error.retryAfter > 0 && (
          <RetryTimer seconds={error.retryAfter} />
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {error.retryable && (
            <Button
              onClick={onRetry}
              variant="shimmer"
              className="w-full"
              disabled={error.retryAfter && error.retryAfter > 0}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}

          {showSimplify && (
            <Button
              onClick={onSimplify}
              variant="outline"
              className="w-full"
            >
              <FileText className="w-4 h-4 mr-2" />
              Simplify Input ({Math.round(inputLength / 2000)}k → {Math.round(inputLength / 4000)}k chars)
            </Button>
          )}

          <Button
            onClick={onDismiss}
            variant="ghost"
            className="w-full"
          >
            Go Back
          </Button>
        </div>

        {/* Help link */}
        <p className="text-xs text-center text-muted-foreground">
          Having trouble?{" "}
          <a 
            href="https://docs.lovable.dev/tips-tricks/troubleshooting" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            View troubleshooting guide
          </a>
        </p>
      </div>
    </motion.div>
  );
};

// Retry countdown timer
const RetryTimer = ({ seconds }: { seconds: number }) => {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setTimeout(() => setRemaining(remaining - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining]);

  if (remaining <= 0) return null;

  return (
    <div className="text-center">
      <p className="text-sm text-muted-foreground">
        Retry available in <span className="font-mono text-foreground">{remaining}s</span>
      </p>
    </div>
  );
};

import { useState, useEffect } from "react";

// Helper to create APIError from various error sources
export const parseAPIError = (error: unknown): APIError => {
  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>;
    
    // Check for specific status codes
    if (err.status === 429) {
      return {
        code: 'RATE_LIMIT',
        message: String(err.message || 'Rate limit exceeded'),
        retryable: true,
        retryAfter: 60,
      };
    }
    if (err.status === 402) {
      return {
        code: 'PAYMENT_REQUIRED',
        message: String(err.message || 'Usage limit reached'),
        retryable: false,
      };
    }
    
    // Check message content
    const message = String(err.message || '');
    if (message.toLowerCase().includes('timeout')) {
      return {
        code: 'TIMEOUT',
        message,
        retryable: true,
      };
    }
    if (message.toLowerCase().includes('parse') || message.toLowerCase().includes('json')) {
      return {
        code: 'PARSE_ERROR',
        message,
        retryable: true,
      };
    }
    if (message.toLowerCase().includes('network') || message.toLowerCase().includes('fetch')) {
      return {
        code: 'NETWORK',
        message,
        retryable: true,
      };
    }
    
    return {
      code: 'UNKNOWN',
      message: message || 'An unknown error occurred',
      retryable: true,
    };
  }

  return {
    code: 'UNKNOWN',
    message: String(error) || 'An unknown error occurred',
    retryable: true,
  };
};

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Globe, Loader2, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { BusinessContext } from "@/lib/types";

interface BusinessContextInputProps {
  value: string;
  onChange: (url: string) => void;
  context: BusinessContext | null;
  isLoading: boolean;
  onClear: () => void;
  isExpanded: boolean;
  onToggle: () => void;
}

export const BusinessContextInput = ({
  value,
  onChange,
  context,
  isLoading,
  onClear,
  isExpanded,
  onToggle,
}: BusinessContextInputProps) => {
  // Compact inline success view when context is loaded
  if (context && !isLoading) {
    return (
      <div className="w-full">
        <div className="flex items-center gap-2 text-sm py-1">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Check className="w-4 h-4 text-shimmer-start flex-shrink-0" />
            <span className="text-foreground truncate">{context.companyName}</span>
            {context.industry && (
              <>
                <span className="text-muted-foreground/50 text-xs">·</span>
                <span className="text-muted-foreground text-xs truncate">{context.industry}</span>
              </>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="text-muted-foreground/50 text-xs">|</span>
          <button
            type="button"
            onClick={onToggle}
            className="text-muted-foreground hover:text-foreground text-xs transition-colors whitespace-nowrap"
          >
            Edit
          </button>
        </div>
        
        {/* Expanded edit mode */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-2">
                <Input
                  type="url"
                  placeholder="yourcompany.com"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="bg-card/50 border-border/50 text-sm"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex items-center gap-2 text-sm py-1">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Loading business context...</span>
        </div>
      </div>
    );
  }

  // Default expandable view - no context loaded
  return (
    <div className="w-full">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <Globe className="w-4 h-4" />
        <span>Add business context</span>
        <span className="text-xs opacity-50">(optional)</span>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3">
              <Input
                type="url"
                placeholder="yourcompany.com"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="bg-card/50 border-border/50 text-sm"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

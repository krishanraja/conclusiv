import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Globe, Loader2, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { BusinessContext } from "@/lib/types";

interface BusinessContextInputProps {
  value: string;
  onChange: (url: string) => void;
  context: BusinessContext | null;
  isLoading: boolean;
  onClear: () => void;
}

export const BusinessContextInput = ({
  value,
  onChange,
  context,
  isLoading,
  onClear,
}: BusinessContextInputProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
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
            <div className="pt-3 space-y-3">
              <div className="relative">
                <Input
                  type="url"
                  placeholder="yourcompany.com"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className={cn(
                    "bg-card border-border/50 pr-10",
                    context && "border-shimmer-start/50"
                  )}
                  disabled={isLoading}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isLoading && (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                  {context && !isLoading && (
                    <button
                      type="button"
                      onClick={onClear}
                      className="text-shimmer-start hover:text-shimmer-end transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Context Preview */}
              <AnimatePresence>
                {context && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 rounded-lg bg-shimmer-start/5 border border-shimmer-start/20"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          {context.companyName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {context.industry}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={onClear}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {context.valuePropositions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {context.valuePropositions.slice(0, 3).map((prop, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-0.5 rounded-full bg-shimmer-start/10 text-shimmer-start"
                          >
                            {prop}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, Image } from "lucide-react";
import type { LogoVariant } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LogoVariantSelectorProps {
  variants: LogoVariant[];
  selectedUrl?: string;
  onSelect: (url: string) => void;
}

export const LogoVariantSelector = ({
  variants,
  selectedUrl,
  onSelect,
}: LogoVariantSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (variants.length <= 1) return null;

  // Group variants by type for better organization
  const groupedVariants = variants.reduce((acc, variant) => {
    const key = variant.type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(variant);
    return acc;
  }, {} as Record<string, LogoVariant[]>);

  const typeLabels: Record<string, string> = {
    logo: "Full Logo",
    symbol: "Symbol",
    icon: "Icon",
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-[10px] text-primary hover:text-primary/80 transition-colors"
      >
        <Image className="w-3 h-3" />
        <span>{variants.length} variants</span>
        <ChevronDown className={cn("w-3 h-3 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-lg shadow-lg p-2 min-w-[200px] max-w-[280px]"
            >
              <p className="text-[10px] text-muted-foreground mb-2 px-1">
                Select a logo variant
              </p>
              
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {Object.entries(groupedVariants).map(([type, typeVariants]) => (
                  <div key={type}>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground/70 px-1 mb-1">
                      {typeLabels[type] || type}
                    </p>
                    <div className="grid grid-cols-3 gap-1">
                      {typeVariants.map((variant, idx) => (
                        <button
                          key={`${variant.url}-${idx}`}
                          type="button"
                          onClick={() => {
                            onSelect(variant.url);
                            setIsOpen(false);
                          }}
                          className={cn(
                            "relative w-full aspect-square rounded border p-1 transition-all hover:border-primary/50",
                            selectedUrl === variant.url
                              ? "border-primary bg-primary/10"
                              : "border-border/50 bg-background/50"
                          )}
                          title={`${variant.theme} theme, ${variant.format.toUpperCase()}`}
                        >
                          <img
                            src={variant.url}
                            alt={`${type} variant`}
                            className={cn(
                              "w-full h-full object-contain",
                              variant.theme === "dark" && "bg-slate-800 rounded"
                            )}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          {selectedUrl === variant.url && (
                            <div className="absolute top-0 right-0 w-3 h-3 bg-primary rounded-bl flex items-center justify-center">
                              <Check className="w-2 h-2 text-primary-foreground" />
                            </div>
                          )}
                          <span className="absolute bottom-0 left-0 right-0 text-[7px] text-center text-muted-foreground/70 bg-background/80 rounded-b">
                            {variant.theme}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

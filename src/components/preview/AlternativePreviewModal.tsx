import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NarrativeAlternative } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AlternativePreviewModalProps {
  alternative: NarrativeAlternative | null;
  isOpen: boolean;
  onClose: () => void;
  onUse: () => void;
}

export const AlternativePreviewModal = ({
  alternative,
  isOpen,
  onClose,
  onUse,
}: AlternativePreviewModalProps) => {
  if (!alternative) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/90 backdrop-blur-md z-[60]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-4 md:inset-8 lg:inset-16 bg-card border border-border rounded-2xl z-[60] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h2 className="font-semibold">{alternative.goalLabel}</h2>
                <p className="text-sm text-muted-foreground">{alternative.rationale}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-background transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4 max-w-3xl mx-auto">
                {alternative.narrative.sections.map((section, index) => (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-xl bg-background border border-border"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {index + 1}
                      </span>
                      <h3 className="font-medium">{section.title}</h3>
                    </div>
                    {section.content && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {section.content}
                      </p>
                    )}
                    {section.items && section.items.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {section.items.map((item, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-shimmer-start">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="shimmer" onClick={onUse}>
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                Use This Narrative
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

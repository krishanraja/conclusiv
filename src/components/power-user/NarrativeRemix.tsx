import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wand2, Minimize2, Maximize2, ShieldAlert, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNarrativeStore } from "@/store/narrativeStore";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type RemixOption = "shorter" | "bolder" | "safer" | "flip";

interface RemixConfig {
  id: RemixOption;
  label: string;
  description: string;
  icon: React.ReactNode;
  prompt: string;
}

const remixOptions: RemixConfig[] = [
  {
    id: "shorter",
    label: "Make it Shorter",
    description: "Compress to essential points only",
    icon: <Minimize2 className="w-4 h-4" />,
    prompt: "Compress this narrative to only the most essential 3-4 points. Be extremely concise but keep the core message and call to action intact.",
  },
  {
    id: "bolder",
    label: "Make it Bolder",
    description: "Increase certainty and conviction",
    icon: <Maximize2 className="w-4 h-4" />,
    prompt: "Rewrite this narrative with more confident, assertive language. Remove hedging words, make claims stronger, and add more conviction to the recommendations.",
  },
  {
    id: "safer",
    label: "Make it Safer",
    description: "Add more caveats and nuance",
    icon: <ShieldAlert className="w-4 h-4" />,
    prompt: "Rewrite this narrative with more balanced language. Add appropriate caveats, acknowledge uncertainties, and present a more measured view while keeping the core insights.",
  },
  {
    id: "flip",
    label: "Flip the Framing",
    description: "Opposite perspective",
    icon: <RotateCcw className="w-4 h-4" />,
    prompt: "Rewrite this narrative from the opposite perspective. If it was optimistic, make it cautionary. If it highlighted opportunities, highlight risks. Maintain factual accuracy but shift the framing entirely.",
  },
];

interface NarrativeRemixProps {
  onRemixComplete?: () => void;
}

export const NarrativeRemix = ({ onRemixComplete }: NarrativeRemixProps) => {
  const { narrative, setNarrative, rawText, businessContext } = useNarrativeStore();
  const { toast } = useToast();
  const [isRemixing, setIsRemixing] = useState<RemixOption | null>(null);
  const [showOptions, setShowOptions] = useState(false);

  const handleRemix = async (option: RemixConfig) => {
    if (!narrative) return;

    setIsRemixing(option.id);

    try {
      const response = await supabase.functions.invoke("build-narrative", {
        body: {
          text: rawText,
          businessContext,
          remixPrompt: option.prompt,
          currentNarrative: narrative,
        },
      });

      if (response.error) throw response.error;

      const result = response.data;
      if (result.narrative) {
        setNarrative(result.narrative);
        // Narrative updates visibly - no toast needed
        onRemixComplete?.();
      }
    } catch (error) {
      console.error("Remix failed:", error);
      toast({
        title: "Remix failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsRemixing(null);
      setShowOptions(false);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowOptions(!showOptions)}
        disabled={!narrative || isRemixing !== null}
        className="text-muted-foreground"
      >
        <Wand2 className="w-4 h-4 mr-1" />
        Remix
      </Button>

      <AnimatePresence>
        {showOptions && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 right-0 z-50 w-64 p-2 rounded-lg bg-card border border-border shadow-xl"
          >
            <div className="text-xs text-muted-foreground px-2 py-1 mb-1">
              Transform your narrative
            </div>
            {remixOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleRemix(option)}
                disabled={isRemixing !== null}
                className="w-full flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors text-left disabled:opacity-50"
              >
                <div className="p-1.5 rounded-md bg-muted">
                  {isRemixing === option.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    option.icon
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium">{option.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {option.description}
                  </div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

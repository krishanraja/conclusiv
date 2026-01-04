import { useNarrativeStore } from "@/store/narrativeStore";
import { NarrativeDuration, durationDescriptions } from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const durations: NarrativeDuration[] = ["10s", "1min", "5min", "full"];

interface DurationSelectorProps {
  onSelect?: () => void;
}

export const DurationSelector = ({ onSelect }: DurationSelectorProps) => {
  const { duration, setDuration } = useNarrativeStore();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 rounded-lg bg-card/50 border border-border/50">
      {durations.map((d) => {
        const config = durationDescriptions[d];
        const isSelected = duration === d;

        return (
          <motion.button
            key={d}
            onClick={() => {
              setDuration(d);
              onSelect?.();
            }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "relative px-2.5 py-1.5 rounded-md text-xs font-medium transition-all text-center",
              isSelected
                ? "bg-shimmer-start/20 text-shimmer-start"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {isSelected && (
              <motion.div
                layoutId="duration-highlight"
                className="absolute inset-0 rounded-md bg-shimmer-start/20 border border-shimmer-start/30"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <span className="relative z-10">{config.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
};

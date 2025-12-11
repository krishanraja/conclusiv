import { useNarrativeStore } from "@/store/narrativeStore";
import { NarrativeDuration, durationDescriptions } from "@/lib/types";
import { cn } from "@/lib/utils";

const durations: NarrativeDuration[] = ["10s", "1min", "5min", "full"];

interface DurationSelectorProps {
  onSelect?: () => void;
}

export const DurationSelector = ({ onSelect }: DurationSelectorProps) => {
  const { duration, setDuration } = useNarrativeStore();

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-card/50 border border-border/50">
      {durations.map((d) => {
        const config = durationDescriptions[d];
        const isSelected = duration === d;

        return (
          <button
            key={d}
            onClick={() => {
              setDuration(d);
              onSelect?.();
            }}
            className={cn(
              "px-2.5 py-1 rounded-md text-xs transition-all",
              isSelected
                ? "bg-shimmer-start/20 text-shimmer-start"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {config.label}
          </button>
        );
      })}
    </div>
  );
};

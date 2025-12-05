import { useState } from "react";
import { motion } from "framer-motion";
import { useFeedback } from "@/hooks/useFeedback";

interface QuickRatingProps {
  context?: { step?: string; [key: string]: unknown };
  onComplete?: () => void;
}

const emojis = [
  { value: 1, emoji: "😞", label: "Poor" },
  { value: 2, emoji: "😕", label: "Fair" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😊", label: "Great" },
];

export const QuickRating = ({ context, onComplete }: QuickRatingProps) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const { submitQuickRating, isSubmitting } = useFeedback();

  const handleSelect = async (value: number) => {
    setSelected(value);
    const success = await submitQuickRating(value, context);
    if (success) {
      setSubmitted(true);
      setTimeout(() => {
        onComplete?.();
      }, 1500);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="text-4xl mb-2"
        >
          🎉
        </motion.div>
        <p className="text-sm font-medium text-foreground">Thank you!</p>
        <p className="text-xs text-muted-foreground">Your feedback helps us improve</p>
      </motion.div>
    );
  }

  return (
    <div className="flex justify-center gap-2">
      {emojis.map(({ value, emoji, label }) => (
        <motion.button
          key={value}
          onClick={() => handleSelect(value)}
          disabled={isSubmitting}
          className={`flex flex-col items-center p-2 rounded-lg transition-all ${
            selected === value
              ? "bg-primary/20 scale-110"
              : "hover:bg-accent/50"
          }`}
          whileHover={{ scale: selected === value ? 1.1 : 1.05 }}
          whileTap={{ scale: 0.95 }}
          title={label}
        >
          <span className="text-2xl">{emoji}</span>
          <span className="text-[10px] text-muted-foreground mt-1">{label}</span>
        </motion.button>
      ))}
    </div>
  );
};

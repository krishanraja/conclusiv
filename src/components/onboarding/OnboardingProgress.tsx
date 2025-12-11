import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  onStepClick?: (step: number) => void;
}

export const OnboardingProgress = ({
  currentStep,
  totalSteps,
  onStepClick,
}: OnboardingProgressProps) => {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onStepClick?.(index)}
          disabled={!onStepClick}
          className={cn(
            "w-2 h-2 rounded-full transition-all duration-300",
            index === currentStep
              ? "bg-primary w-6"
              : index < currentStep
              ? "bg-primary/50"
              : "bg-muted-foreground/30",
            onStepClick && "cursor-pointer hover:opacity-80"
          )}
        />
      ))}
    </div>
  );
};
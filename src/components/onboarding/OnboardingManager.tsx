import { useOnboarding } from "@/hooks/useOnboarding";
import { OnboardingSpotlight } from "./OnboardingSpotlight";
import { OnboardingProgress } from "./OnboardingProgress";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import conclusivLogo from "@/assets/conclusiv-logo.png";

interface OnboardingStep {
  targetSelector: string;
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
  actionLabel?: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    targetSelector: "[data-onboarding='welcome']",
    title: "Welcome to Conclusiv!",
    description: "Let's take a quick tour to help you get started. We'll show you the key features.",
    position: "bottom",
    actionLabel: "Let's go!",
  },
  {
    targetSelector: "[data-onboarding='research-assistant']",
    title: "AI Research Assistant",
    description: "Don't have content yet? Our AI can help you research and generate strategic insights.",
    position: "bottom",
    actionLabel: "Next",
  },
  {
    targetSelector: "[data-onboarding='document-upload']",
    title: "Upload Documents",
    description: "Already have a document? Drag & drop or click to upload PDFs, Word docs, or PowerPoints.",
    position: "bottom",
    actionLabel: "Next",
  },
  {
    targetSelector: "[data-onboarding='business-context']",
    title: "Add Business Context",
    description: "Enter your company website to auto-fetch your logo, brand colors, and company info.",
    position: "bottom",
    actionLabel: "Next",
  },
  {
    targetSelector: "[data-onboarding='continue-button']",
    title: "You're Ready!",
    description: "Paste or upload your content, then click Continue to transform it into a stunning presentation.",
    position: "top",
    actionLabel: "Start Creating",
  },
];

export const OnboardingManager = () => {
  const {
    isActive,
    currentStep,
    totalSteps,
    completeStep,
    goToStep,
    skipOnboarding,
  } = useOnboarding();

  if (!isActive) return null;

  const step = ONBOARDING_STEPS[currentStep];
  
  // Show welcome overlay for step 0
  if (currentStep === 0) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl p-8 max-w-md w-full text-center shadow-2xl"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Welcome to{" "}
              <img 
                src={conclusivLogo} 
                alt="Conclusiv" 
                className="h-6 w-auto inline align-middle" 
              />
            </h2>
            <p className="text-muted-foreground mb-6">
              Transform your research, strategy documents, and business plans into stunning interactive presentations.
            </p>

            <div className="space-y-3">
              <Button
                variant="shimmer"
                size="lg"
                onClick={completeStep}
                className="w-full"
              >
                Take the Tour (30 sec)
              </Button>
              <button
                onClick={skipOnboarding}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip, I'll explore on my own
              </button>
            </div>

            <OnboardingProgress
              currentStep={currentStep}
              totalSteps={totalSteps}
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <>
      <OnboardingSpotlight
        targetSelector={step.targetSelector}
        title={step.title}
        description={step.description}
        position={step.position}
        onNext={completeStep}
        onSkip={skipOnboarding}
        actionLabel={step.actionLabel}
        isActive={isActive}
      />

      {/* Progress indicator - fixed at bottom on mobile */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-[101] bg-card/90 backdrop-blur-sm rounded-full px-4 py-2 border border-border"
      >
        <OnboardingProgress
          currentStep={currentStep}
          totalSteps={totalSteps}
          onStepClick={goToStep}
        />
      </motion.div>
    </>
  );
};
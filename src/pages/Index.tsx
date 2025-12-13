import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useNarrativeStore } from "@/store/narrativeStore";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useFeedback } from "@/hooks/useFeedback";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { InputScreen } from "@/components/input/InputScreen";
import { RefineScreen } from "@/components/refine/RefineScreen";
import { PreviewScreen } from "@/components/preview/PreviewScreen";
import { PresentScreen } from "@/components/present/PresentScreen";
import { LoadingOverlay } from "@/components/ui/loading";
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";
import { OnboardingManager } from "@/components/onboarding/OnboardingManager";
import { AnimatePresence, motion } from "framer-motion";

const Index = () => {
  const { toast } = useToast();
  const { checkSubscription } = useSubscription();
  const { trackPageView, trackStepChange, trackSubscriptionAction } = useAnalytics();
  const { incrementUsageCount } = useFeedback();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isPageReady, setIsPageReady] = useState(false);
  const { 
    currentStep, 
    isLoading, 
    loadingMessage, 
    loadingStage, 
    loadingProgress,
    rawText 
  } = useNarrativeStore();

  // Coordinate initial page render
  useEffect(() => {
    // Small delay ensures fonts, styles, and initial state are ready
    const timer = requestAnimationFrame(() => {
      setIsPageReady(true);
    });
    return () => cancelAnimationFrame(timer);
  }, []);

  // Track page view on mount
  useEffect(() => {
    trackPageView("/");
  }, [trackPageView]);

  // Track step changes
  const previousStepRef = React.useRef(currentStep);
  useEffect(() => {
    if (previousStepRef.current !== currentStep) {
      trackStepChange(previousStepRef.current, currentStep);
      previousStepRef.current = currentStep;
    }
    if (currentStep === "preview") {
      incrementUsageCount();
    }
  }, [currentStep, trackStepChange, incrementUsageCount]);

  // Handle checkout success/cancel
  useEffect(() => {
    const checkoutStatus = searchParams.get('checkout');
    
    if (checkoutStatus === 'success') {
      trackSubscriptionAction("checkout_completed");
      toast({
        title: "Subscription activated!",
        description: "Welcome to Pro. Your premium features are now unlocked.",
      });
      checkSubscription();
      searchParams.delete('checkout');
      setSearchParams(searchParams, { replace: true });
    } else if (checkoutStatus === 'cancelled') {
      trackSubscriptionAction("checkout_cancelled");
      toast({
        title: "Checkout cancelled",
        description: "No charges were made. You can upgrade anytime.",
        variant: "destructive",
      });
      searchParams.delete('checkout');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, trackSubscriptionAction]);

  // Present mode is fullscreen, no header
  if (currentStep === "present") {
    return <PresentScreen />;
  }

  // Staggered animation variants for coordinated entrance
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1],
        staggerChildren: 0.1,
      },
    },
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  const mainVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  const stepTransitionVariants = {
    initial: { opacity: 0, y: 8 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.35,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
    exit: { 
      opacity: 0,
      y: -8,
      transition: {
        duration: 0.2,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  return (
    <motion.div 
      className="min-h-screen min-h-[100dvh] bg-background flex flex-col overflow-x-hidden max-w-[100vw]"
      variants={containerVariants}
      initial="hidden"
      animate={isPageReady ? "visible" : "hidden"}
    >
      <motion.div variants={headerVariants}>
        <Header />
      </motion.div>
      
      <AnimatePresence>
        {isLoading && (
          <LoadingOverlay 
            message={loadingMessage || "Processing..."} 
            stage={loadingStage}
            progress={loadingProgress}
            inputLength={rawText.length}
          />
        )}
      </AnimatePresence>
      
      <motion.main
        variants={mainVariants}
        className="flex-1 pt-16"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            variants={stepTransitionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {currentStep === "input" && <InputScreen />}
            {currentStep === "refine" && <RefineScreen />}
            {currentStep === "preview" && <PreviewScreen />}
          </motion.div>
        </AnimatePresence>
      </motion.main>
      
      {/* Footer only on desktop for input step */}
      {currentStep === "input" && (
        <motion.div 
          className="hidden md:block"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <Footer />
        </motion.div>
      )}
      
      <FeedbackWidget currentStep={currentStep} />
      
      {/* Onboarding for first-time users */}
      {currentStep === "input" && <OnboardingManager />}
    </motion.div>
  );
};

export default Index;

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
import { SplashScreen } from "@/components/ui/SplashScreen";
import { AnimatePresence, motion } from "framer-motion";

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const { toast } = useToast();
  const { checkSubscription } = useSubscription();
  const { trackPageView, trackStepChange, trackSubscriptionAction } = useAnalytics();
  const { incrementUsageCount } = useFeedback();
  const [searchParams, setSearchParams] = useSearchParams();
  const { 
    currentStep, 
    isLoading, 
    loadingMessage, 
    loadingStage, 
    loadingProgress,
    rawText 
  } = useNarrativeStore();

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

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background">
      {/* Splash Screen with exit animation */}
      <AnimatePresence mode="wait">
        {showSplash && (
          <SplashScreen key="splash" onComplete={() => setShowSplash(false)} />
        )}
      </AnimatePresence>
      
      {/* Main Content - renders after splash completes */}
      <AnimatePresence>
        {!showSplash && (
          <motion.div
            key="main-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="flex flex-col overflow-x-hidden max-w-[100vw] min-h-screen min-h-[100dvh]"
            style={{ willChange: "opacity" }}
          >
            <Header />
            
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
            
            <AnimatePresence mode="wait">
              <motion.main
                key={currentStep}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="flex-1 pt-16"
              >
                {currentStep === "input" && <InputScreen />}
                {currentStep === "refine" && <RefineScreen />}
                {currentStep === "preview" && <PreviewScreen />}
              </motion.main>
            </AnimatePresence>
            
            {/* Footer only on desktop for input step */}
            {currentStep === "input" && (
              <div className="hidden md:block">
                <Footer />
              </div>
            )}
            
            <FeedbackWidget currentStep={currentStep} />
            
            {/* Onboarding for first-time users */}
            {currentStep === "input" && <OnboardingManager />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;

import { useNarrativeStore } from "@/store/narrativeStore";
import { Header } from "@/components/layout/Header";
import { InputScreen } from "@/components/input/InputScreen";
import { PreviewScreen } from "@/components/preview/PreviewScreen";
import { PresentScreen } from "@/components/present/PresentScreen";
import { LoadingOverlay } from "@/components/ui/loading";
import { AnimatePresence, motion } from "framer-motion";

const Index = () => {
  const { 
    currentStep, 
    isLoading, 
    loadingMessage, 
    loadingStage, 
    loadingProgress,
    rawText 
  } = useNarrativeStore();

  // Present mode is fullscreen, no header
  if (currentStep === "present") {
    return <PresentScreen />;
  }

  return (
    <div className="min-h-screen bg-background">
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
          transition={{ duration: 0.3 }}
        >
          {currentStep === "input" && <InputScreen />}
          {currentStep === "preview" && <PreviewScreen />}
        </motion.main>
      </AnimatePresence>
    </div>
  );
};

export default Index;

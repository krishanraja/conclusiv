import { useNarrativeStore } from "@/store/narrativeStore";
import { Header } from "@/components/layout/Header";
import { ExtractScreen } from "@/components/extract/ExtractScreen";
import { ReviewScreen } from "@/components/review/ReviewScreen";
import { TemplateScreen } from "@/components/template/TemplateScreen";
import { EditorScreen } from "@/components/editor/EditorScreen";
import { PresentScreen } from "@/components/present/PresentScreen";
import { LoadingOverlay } from "@/components/ui/loading";
import { AnimatePresence, motion } from "framer-motion";

const Index = () => {
  const { currentStep, isLoading } = useNarrativeStore();

  // Present mode is fullscreen, no header
  if (currentStep === "present") {
    return <PresentScreen />;
  }

  const loadingMessages: Record<string, string> = {
    extract: "Analyzing your research...",
    review: "Processing themes...",
    template: "Building your narrative...",
    editor: "Preparing editor...",
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <AnimatePresence>
        {isLoading && (
          <LoadingOverlay message={loadingMessages[currentStep]} />
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
          {currentStep === "extract" && <ExtractScreen />}
          {currentStep === "review" && <ReviewScreen />}
          {currentStep === "template" && <TemplateScreen />}
          {currentStep === "editor" && <EditorScreen />}
        </motion.main>
      </AnimatePresence>
    </div>
  );
};

export default Index;

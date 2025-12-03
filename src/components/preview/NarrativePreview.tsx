import { motion, AnimatePresence } from "framer-motion";
import { useNarrativeStore } from "@/store/narrativeStore";
import { cn } from "@/lib/utils";
import { iconMap } from "@/lib/icons";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const NarrativePreview = () => {
  const { narrative, currentSectionIndex, setCurrentSectionIndex } = useNarrativeStore();

  if (!narrative) return null;

  const sections = narrative.sections;
  const currentSection = sections[currentSectionIndex];

  const handlePrev = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
    }
  };

  const IconComponent = currentSection?.icon 
    ? iconMap[currentSection.icon as keyof typeof iconMap] 
    : null;

  return (
    <div className="relative h-full flex flex-col">
      {/* Preview Area */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSectionIndex}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.3 }}
            className="text-center max-w-lg"
          >
            {IconComponent && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring" }}
                className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-shimmer-start/10 flex items-center justify-center"
              >
                <IconComponent className="w-8 h-8 text-shimmer-start" />
              </motion.div>
            )}
            
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-2xl font-semibold mb-4"
            >
              {currentSection?.title}
            </motion.h2>
            
            {currentSection?.content && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-muted-foreground leading-relaxed"
              >
                {currentSection.content}
              </motion.p>
            )}

            {currentSection?.items && currentSection.items.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="mt-4 space-y-2 text-left"
              >
                {currentSection.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-shimmer-start mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </motion.ul>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4 pb-6">
        <button
          onClick={handlePrev}
          disabled={currentSectionIndex === 0}
          className={cn(
            "p-2 rounded-full transition-colors",
            currentSectionIndex === 0
              ? "text-muted-foreground/30 cursor-not-allowed"
              : "text-muted-foreground hover:text-foreground hover:bg-card"
          )}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Dots */}
        <div className="flex items-center gap-2">
          {sections.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSectionIndex(i)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                i === currentSectionIndex
                  ? "w-6 bg-shimmer-start"
                  : "bg-border hover:bg-muted-foreground"
              )}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={currentSectionIndex === sections.length - 1}
          className={cn(
            "p-2 rounded-full transition-colors",
            currentSectionIndex === sections.length - 1
              ? "text-muted-foreground/30 cursor-not-allowed"
              : "text-muted-foreground hover:text-foreground hover:bg-card"
          )}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNarrativeStore } from "@/store/narrativeStore";
import { cn } from "@/lib/utils";
import { iconMap } from "@/lib/icons.js";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ImagePicker, ImagePickerTrigger } from "@/components/editor/ImagePicker";
import { useBrandLogo } from "@/hooks/useBrandLogo";

interface NarrativePreviewProps {
  showLogo?: boolean;
}

export const NarrativePreview = ({ showLogo: showLogoProp = false }: NarrativePreviewProps) => {
  const { 
    narrative, 
    currentSectionIndex, 
    setCurrentSectionIndex,
    updateSectionImage,
    presentationStyle,
  } = useNarrativeStore();
  const isMobile = useIsMobile();
  const reducedMotion = useReducedMotion();
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  
  // Use brand logo hook for dark mode detection
  const { logoUrl, showLogo, logoPosition, logoSize } = useBrandLogo();

  if (!narrative) return null;

  const sections = narrative.sections;
  const currentSection = sections[currentSectionIndex];

  const handlePrev = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
      setImagePickerOpen(false);
    }
  };

  const handleNext = () => {
    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      setImagePickerOpen(false);
    }
  };

  const IconComponent = currentSection?.icon 
    ? iconMap[currentSection.icon as keyof typeof iconMap] 
    : null;

  const shouldSimplifyAnimations = reducedMotion || isMobile;
  
  // Logo positioning - adjusted for preview container
  const logoPositionClasses: Record<string, string> = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2',
    'bottom-left': 'bottom-12 left-2',
    'bottom-right': 'bottom-12 right-2',
  };
  
  const logoSizeClasses: Record<string, string> = {
    'sm': 'h-5 max-w-[80px]',
    'md': 'h-6 max-w-[100px]',
    'lg': 'h-8 max-w-[120px]',
  };

  // Apply brand colors if set
  const brandStyles: React.CSSProperties = {};
  if (presentationStyle?.primaryColor) {
    brandStyles['--brand-primary' as string] = presentationStyle.primaryColor;
  }

  return (
    <div className="relative h-full flex flex-col" style={brandStyles}>
      {/* Logo overlay - only render if explicitly enabled via prop */}
      {showLogoProp && showLogo && logoUrl && (
        <div className={cn(
          "absolute z-10 opacity-60 hover:opacity-100 transition-opacity",
          logoPositionClasses[logoPosition]
        )}>
          <img 
            src={logoUrl} 
            alt="Logo" 
            className={cn(
              "w-auto object-contain",
              logoSizeClasses[logoSize]
            )}
          />
        </div>
      )}

      {/* Preview Area */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSectionIndex}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 20 }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: shouldSimplifyAnimations ? 0.15 : 0.3 }}
            className="text-center max-w-lg will-change-transform"
            style={{ backfaceVisibility: "hidden" }}
          >
            {/* Section Image */}
            {currentSection?.image && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05, duration: 0.2 }}
                className="mb-6 rounded-lg overflow-hidden"
              >
                <img
                  src={currentSection.image}
                  alt={currentSection.title}
                  className="w-full h-40 object-cover"
                />
              </motion.div>
            )}

            {IconComponent && !currentSection?.image && (
              <motion.div
                initial={reducedMotion ? { opacity: 0 } : { scale: 0 }}
                animate={reducedMotion ? { opacity: 1 } : { scale: 1 }}
                transition={reducedMotion ? { duration: 0.1 } : { delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
                className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-shimmer-start/10 flex items-center justify-center"
              >
                <IconComponent className="w-8 h-8 text-shimmer-start" />
              </motion.div>
            )}
            
            <motion.h2
              initial={{ opacity: 0, y: reducedMotion ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: shouldSimplifyAnimations ? 0.05 : 0.15, duration: shouldSimplifyAnimations ? 0.1 : 0.2 }}
              className="text-2xl font-semibold mb-4"
              style={presentationStyle?.primaryFont ? { fontFamily: presentationStyle.primaryFont } : undefined}
            >
              {currentSection?.title}
            </motion.h2>
            
            {currentSection?.content && (
              <motion.p
                initial={{ opacity: 0, y: reducedMotion ? 0 : 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: shouldSimplifyAnimations ? 0.1 : 0.2, duration: shouldSimplifyAnimations ? 0.1 : 0.2 }}
                className="text-muted-foreground leading-relaxed"
              >
                {currentSection.content}
              </motion.p>
            )}

            {currentSection?.items && currentSection.items.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, y: reducedMotion ? 0 : 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: shouldSimplifyAnimations ? 0.15 : 0.25, duration: shouldSimplifyAnimations ? 0.1 : 0.2 }}
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

            {/* Image Picker - Minimal trigger */}
            <div className="mt-4 flex justify-center">
              <ImagePickerTrigger
                hasImage={!!currentSection?.image}
                onClick={() => setImagePickerOpen(!imagePickerOpen)}
              />
            </div>

            {/* Image Picker Panel */}
            <ImagePicker
              sectionTitle={currentSection?.title || ""}
              sectionContent={currentSection?.content}
              currentImage={currentSection?.image}
              onSelect={(url) => {
                if (currentSection) {
                  updateSectionImage(currentSection.id, url);
                }
              }}
              isOpen={imagePickerOpen}
              onOpenChange={setImagePickerOpen}
            />
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
              onClick={() => {
                setCurrentSectionIndex(i);
                setImagePickerOpen(false);
              }}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                shouldSimplifyAnimations ? "duration-150" : "duration-300",
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

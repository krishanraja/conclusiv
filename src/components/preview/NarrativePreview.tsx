import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNarrativeStore } from "@/store/narrativeStore";
import { cn } from "@/lib/utils";
import { iconMap } from "@/lib/icons.js";
import { ChevronLeft, ChevronRight, Clock, ExternalLink } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ImagePicker, ImagePickerTrigger } from "@/components/editor/ImagePicker";
import { useBrandLogo } from "@/hooks/useBrandLogo";
import { useBrandFonts } from "@/hooks/useBrandFonts";
import { InlineTensionBadge } from "./TensionIndicator";
import type { ViewMode } from "@/lib/types";

interface NarrativePreviewProps {
  showLogo?: boolean;
}

// Reading time estimate (words per minute)
const WORDS_PER_MINUTE = 200;

// Calculate reading time for a section
const calculateReadingTime = (content?: string, items?: string[]): number => {
  let wordCount = 0;
  if (content) wordCount += content.split(/\s+/).length;
  if (items) wordCount += items.join(' ').split(/\s+/).length;
  return Math.ceil(wordCount / WORDS_PER_MINUTE);
};

export const NarrativePreview = ({ showLogo: showLogoProp = false }: NarrativePreviewProps) => {
  const { 
    narrative, 
    currentSectionIndex, 
    setCurrentSectionIndex,
    updateSectionImage,
    presentationStyle,
    tensions,
    viewMode,
    businessContext,
  } = useNarrativeStore();
  const isMobile = useIsMobile();
  const reducedMotion = useReducedMotion();
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  
  // Use brand logo hook for dark mode detection
  const { logoUrl, showLogo, logoPosition, logoSize } = useBrandLogo();
  
  // Ensure brand fonts are loaded for presentation
  useBrandFonts();

  // Track scroll progress for reader mode
  useEffect(() => {
    if (viewMode !== "reader" || !scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const progress = scrollHeight > clientHeight 
        ? (scrollTop / (scrollHeight - clientHeight)) * 100 
        : 100;
      setScrollProgress(Math.min(100, progress));
    };
    
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [viewMode]);

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
  
  // Logo positioning classes
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

  // Calculate total reading time
  const totalReadingTime = sections.reduce((acc, section) => 
    acc + calculateReadingTime(section.content, section.items), 0
  );

  // Apply brand colors if set
  const brandStyles: React.CSSProperties = {};
  if (presentationStyle?.primaryColor) {
    brandStyles['--brand-primary' as string] = presentationStyle.primaryColor;
  }

  // ============= READER MODE =============
  if (viewMode === "reader") {
    return (
      <div className="relative h-full flex flex-col" style={brandStyles}>
        {/* Reading progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-border/30 z-20">
          <motion.div 
            className="h-full bg-shimmer-start"
            initial={{ width: 0 }}
            animate={{ width: `${scrollProgress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>

        {/* Reading time indicator */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2 py-1 rounded-full bg-card/80 backdrop-blur-sm border border-border/50 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{totalReadingTime} min read</span>
        </div>

        {/* Scrollable content */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-6 py-12 scroll-smooth"
        >
          <div className="max-w-2xl mx-auto space-y-12">
            {/* Title section */}
            <div className="text-center pb-8 border-b border-border/30">
              <h1 
                className="text-3xl font-bold mb-4"
                style={presentationStyle?.primaryFont ? { fontFamily: presentationStyle.primaryFont } : undefined}
              >
                {narrative.title || businessContext?.companyName || "Narrative"}
              </h1>
              <p className="text-muted-foreground">
                {sections.length} sections • {totalReadingTime} min read
              </p>
            </div>

            {/* All sections in vertical scroll */}
            {sections.map((section, idx) => {
              const SectionIcon = section.icon ? iconMap[section.icon as keyof typeof iconMap] : null;
              
              return (
                <article 
                  key={section.id} 
                  className="scroll-mt-8"
                  id={`section-${idx}`}
                >
                  {/* Section image */}
                  {section.image && (
                    <div className="mb-6 rounded-xl overflow-hidden">
                      <img
                        src={section.image}
                        alt={section.title}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}

                  {/* Section icon */}
                  {SectionIcon && !section.image && (
                    <div className="w-12 h-12 mb-4 rounded-xl bg-shimmer-start/10 flex items-center justify-center">
                      <SectionIcon className="w-6 h-6 text-shimmer-start" />
                    </div>
                  )}

                  {/* Section title with number */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                      {idx + 1}
                    </span>
                    <h2 
                      className="text-xl font-semibold flex items-center gap-2"
                      style={presentationStyle?.primaryFont ? { fontFamily: presentationStyle.primaryFont } : undefined}
                    >
                      {section.title}
                      {tensions.length > 0 && (
                        <InlineTensionBadge tensions={tensions} sectionTitle={section.title} />
                      )}
                    </h2>
                  </div>

                  {/* Section content - larger text for readability */}
                  {section.content && (
                    <p className="text-base leading-relaxed text-foreground/90 mb-4">
                      {section.content}
                    </p>
                  )}

                  {/* Section items */}
                  {section.items && section.items.length > 0 && (
                    <ul className="space-y-2 pl-1">
                      {section.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-base text-foreground/80">
                          <span className="text-shimmer-start mt-1.5 text-lg">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              );
            })}

            {/* End indicator */}
            <div className="text-center pt-8 pb-16 border-t border-border/30">
              <p className="text-sm text-muted-foreground">End of narrative</p>
            </div>
          </div>
        </div>

        {/* Section quick nav */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/90 backdrop-blur-sm border border-border/50">
          {sections.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                const el = document.getElementById(`section-${i}`);
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                "hover:bg-shimmer-start/50",
                scrollProgress >= (i / sections.length) * 100 && scrollProgress < ((i + 1) / sections.length) * 100
                  ? "w-4 bg-shimmer-start"
                  : "bg-border"
              )}
            />
          ))}
        </div>
      </div>
    );
  }

  // ============= EXTERNAL MODE =============
  if (viewMode === "external") {
    return (
      <div className="relative h-full flex flex-col" style={brandStyles}>
        {/* Minimal header with branding */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
          {showLogo && logoUrl ? (
            <img 
              src={logoUrl} 
              alt="Logo" 
              className="h-6 w-auto object-contain"
            />
          ) : (
            <span className="text-sm font-medium text-muted-foreground">
              {businessContext?.companyName || ""}
            </span>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ExternalLink className="w-3 h-3" />
            Shared presentation
          </div>
        </div>

        {/* Clean preview area - minimal chrome */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSectionIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-center max-w-xl"
            >
              {/* Section image */}
              {currentSection?.image && (
                <div className="mb-6 rounded-xl overflow-hidden shadow-lg">
                  <img
                    src={currentSection.image}
                    alt={currentSection.title}
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              {IconComponent && !currentSection?.image && (
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-shimmer-start/10 flex items-center justify-center">
                  <IconComponent className="w-8 h-8 text-shimmer-start" />
                </div>
              )}
              
              <h2
                className="text-2xl font-semibold mb-4"
                style={presentationStyle?.primaryFont ? { fontFamily: presentationStyle.primaryFont } : undefined}
              >
                {currentSection?.title}
              </h2>
              
              {currentSection?.content && (
                <p className="text-muted-foreground leading-relaxed mb-4">
                  {currentSection.content}
                </p>
              )}

              {currentSection?.items && currentSection.items.length > 0 && (
                <ul className="mt-4 space-y-2 text-left max-w-md mx-auto">
                  {currentSection.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-shimmer-start mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Clean navigation footer */}
        <div className="flex items-center justify-center gap-6 py-4 border-t border-border/30">
          <button
            onClick={handlePrev}
            disabled={currentSectionIndex === 0}
            className={cn(
              "p-2 rounded-full transition-colors",
              currentSectionIndex === 0
                ? "text-muted-foreground/30 cursor-not-allowed"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="text-sm text-muted-foreground tabular-nums">
            {currentSectionIndex + 1} / {sections.length}
          </span>

          <button
            onClick={handleNext}
            disabled={currentSectionIndex === sections.length - 1}
            className={cn(
              "p-2 rounded-full transition-colors",
              currentSectionIndex === sections.length - 1
                ? "text-muted-foreground/30 cursor-not-allowed"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // ============= PRESENT MODE (Default) =============
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
            fetchPriority="high"
            decoding="async"
          />
        </div>
      )}

      {/* Preview Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-hidden">
        {/* Section Toolbar */}
        <div className="w-full max-w-4xl mb-4 flex items-center justify-between gap-3 px-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate">{currentSection?.title}</h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ImagePickerTrigger
              hasImage={!!currentSection?.image}
              onClick={() => setImagePickerOpen(!imagePickerOpen)}
            />
          </div>
        </div>

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
              className="text-2xl font-semibold mb-4 flex items-center justify-center gap-2 flex-wrap"
              style={presentationStyle?.primaryFont ? { fontFamily: presentationStyle.primaryFont } : undefined}
            >
              <span>{currentSection?.title}</span>
              {tensions.length > 0 && currentSection && (
                <InlineTensionBadge tensions={tensions} sectionTitle={currentSection.title} />
              )}
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

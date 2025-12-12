import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNarrativeStore } from "@/store/narrativeStore";

interface TitleSequenceProps {
  onComplete: () => void;
  tagline?: string;
  companyLogoUrl?: string;
  brandColors?: {
    primary: string;
    secondary: string;
  };
}

export const TitleSequence = ({ 
  onComplete, 
  tagline,
  companyLogoUrl,
  brandColors,
}: TitleSequenceProps) => {
  const { businessContext, selectedArchetype, narrative } = useNarrativeStore();
  const [phase, setPhase] = useState<"logo" | "company" | "tagline" | "complete">("logo");

  const companyName = businessContext?.companyName || "Your Story";
  const logoUrl = companyLogoUrl || businessContext?.logoUrl;
  const generatedTagline = tagline || narrative?.sections[0]?.title || "A Strategic Narrative";
  const date = new Date().toLocaleDateString("en-US", { 
    year: "numeric", 
    month: "long", 
    day: "numeric" 
  });

  // Use brand colors if provided
  const accentColor = brandColors?.primary || businessContext?.brandColors?.primary;

  useEffect(() => {
    const timeline = [
      { phase: "company" as const, delay: 1200 },
      { phase: "tagline" as const, delay: 2400 },
      { phase: "complete" as const, delay: 4000 },
    ];

    const timers = timeline.map(({ phase, delay }) => 
      setTimeout(() => setPhase(phase), delay)
    );

    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (phase === "complete") {
      setTimeout(onComplete, 500);
    }
  }, [phase, onComplete]);

  return (
    <AnimatePresence>
      {phase !== "complete" && (
        <motion.div
          className="fixed inset-0 z-[100] bg-background flex items-center justify-center overflow-hidden"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Particle field background */}
          <div className="absolute inset-0">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-shimmer-start/30"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  opacity: [0, 0.6, 0],
                  scale: [0, 1.5, 0],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          {/* Radial glow - use brand color if available */}
          <motion.div
            className="absolute w-[600px] h-[600px] rounded-full"
            style={{
              background: accentColor 
                ? `radial-gradient(circle, ${accentColor}26 0%, transparent 70%)`
                : "radial-gradient(circle, hsl(var(--shimmer-start) / 0.15) 0%, transparent 70%)",
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Content */}
          <div className="relative text-center z-10">
            {/* Logo phase */}
            <AnimatePresence mode="wait">
              {phase === "logo" && (
                <motion.div
                  key="logo"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center"
                >
                  {logoUrl ? (
                    <img 
                      src={logoUrl} 
                      alt={companyName} 
                      className="w-24 h-24 mb-4 object-contain"
                      fetchPriority="high"
                      decoding="async"
                      onError={(e) => {
                        // Hide the image if it fails to load
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    // Show company initials as fallback instead of Conclusiv logo
                    <div className="w-24 h-24 mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <span className="text-4xl font-bold text-primary">
                        {companyName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground tracking-[0.3em] uppercase">
                    {companyName}
                  </span>
                </motion.div>
              )}

              {/* Company phase */}
              {phase === "company" && (
                <motion.div
                  key="company"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                  <motion.h1
                    className="text-5xl md:text-7xl font-bold gradient-text mb-4"
                    animate={{ letterSpacing: ["0em", "0.05em", "0.02em"] }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  >
                    {companyName}
                  </motion.h1>
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="h-0.5 w-48 mx-auto bg-gradient-to-r from-transparent via-shimmer-start to-transparent"
                  />
                </motion.div>
              )}

              {/* Tagline phase */}
              {phase === "tagline" && (
                <motion.div
                  key="tagline"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  className="space-y-6"
                >
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-3xl md:text-4xl font-light text-foreground/90 max-w-xl mx-auto"
                  >
                    {generatedTagline}
                  </motion.h2>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-sm text-muted-foreground"
                  >
                    {date}
                  </motion.div>
                  {selectedArchetype && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                      className="inline-block px-3 py-1 rounded-full bg-shimmer-start/10 text-shimmer-start text-xs"
                    >
                      {selectedArchetype.replace(/_/g, " ")}
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Skip button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            onClick={onComplete}
            className="absolute bottom-8 right-8 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip →
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

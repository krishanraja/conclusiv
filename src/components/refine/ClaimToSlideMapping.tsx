import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNarrativeStore } from "@/store/narrativeStore";
import { ArrowRight, FileText, Presentation, Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { iconMap } from "@/lib/icons";

interface ClaimMappingProps {
  compact?: boolean;
}

export const ClaimToSlideMapping = ({ compact = false }: ClaimMappingProps) => {
  const { keyClaims, narrative } = useNarrativeStore();
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);

  const approvedClaims = keyClaims.filter(c => c.approved === true);

  if (approvedClaims.length === 0 || !narrative) {
    return null;
  }

  // Simple text matching to find which section a claim maps to
  const findMatchingSection = (claimText: string) => {
    const claimWords = claimText.toLowerCase().split(/\s+/).slice(0, 10);
    
    let bestMatch = { section: narrative.sections[0], score: 0 };
    
    narrative.sections.forEach(section => {
      const sectionText = `${section.title} ${section.content || ''} ${section.items?.join(' ') || ''}`.toLowerCase();
      let matchScore = 0;
      
      claimWords.forEach(word => {
        if (word.length > 3 && sectionText.includes(word)) {
          matchScore++;
        }
      });
      
      if (matchScore > bestMatch.score) {
        bestMatch = { section, score: matchScore };
      }
    });
    
    return bestMatch.section;
  };

  const mappings = approvedClaims.map(claim => ({
    claim,
    section: findMatchingSection(claim.text),
  }));

  if (compact) {
    return (
      <div className="space-y-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Presentation className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Claim → Slide Mapping</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {approvedClaims.length} claims
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-1 overflow-hidden"
            >
              {mappings.map(({ claim, section }, index) => {
                const Icon = iconMap[section.icon] || FileText;
                const sectionIndex = narrative.sections.findIndex(s => s.id === section.id);
                
                return (
                  <motion.div
                    key={claim.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-xs"
                  >
                    <span className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      {index + 1}
                    </span>
                    <span className="truncate flex-1 text-muted-foreground">
                      {claim.title}
                    </span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                    <div className="flex items-center gap-1 shrink-0">
                      <Icon className="w-3 h-3 text-primary" />
                      <span className="text-foreground">
                        Slide {sectionIndex + 1}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Presentation className="w-4 h-4 text-primary" />
          Claim → Slide Mapping
        </h3>
        <span className="text-xs text-muted-foreground">
          {approvedClaims.length} approved claims
        </span>
      </div>

      <div className="grid gap-2">
        {mappings.map(({ claim, section }, index) => {
          const Icon = iconMap[section.icon] || FileText;
          const sectionIndex = narrative.sections.findIndex(s => s.id === section.id);
          const isSelected = selectedClaimId === claim.id;

          return (
            <motion.div
              key={claim.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "p-3 rounded-lg border transition-all cursor-pointer",
                isSelected 
                  ? "bg-primary/5 border-primary/30"
                  : "bg-muted/30 border-border/50 hover:border-primary/20"
              )}
              onClick={() => setSelectedClaimId(isSelected ? null : claim.id)}
            >
              <div className="flex items-start gap-3">
                {/* Claim side */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-medium shrink-0">
                      {index + 1}
                    </span>
                    <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground uppercase">Claim</span>
                  </div>
                  <p className="text-sm font-medium truncate">{claim.title}</p>
                  {isSelected && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="text-xs text-muted-foreground mt-2 line-clamp-3"
                    >
                      {claim.text}
                    </motion.p>
                  )}
                </div>

                {/* Arrow */}
                <div className="flex items-center shrink-0 self-center">
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  >
                    <ArrowRight className="w-4 h-4 text-primary" />
                  </motion.div>
                </div>

                {/* Section side */}
                <div className="flex-1 min-w-0 text-right">
                  <div className="flex items-center justify-end gap-2 mb-1">
                    <span className="text-xs text-muted-foreground uppercase">Slide {sectionIndex + 1}</span>
                    <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                  </div>
                  <p className="text-sm font-medium truncate">{section.title}</p>
                  {isSelected && section.content && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="text-xs text-muted-foreground mt-2 line-clamp-3"
                    >
                      {section.content}
                    </motion.p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {mappings.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <p>No approved claims to map.</p>
          <p className="text-xs mt-1">Approve claims in the Quick Q's tab to see mappings.</p>
        </div>
      )}
    </div>
  );
};
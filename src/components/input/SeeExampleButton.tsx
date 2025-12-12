import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNarrativeStore } from "@/store/narrativeStore";
import { cn } from "@/lib/utils";

// Sample research content that demonstrates the tool's capabilities
const EXAMPLE_RESEARCH = `Strategic Analysis: TechFlow Inc. - Series B Readiness Assessment

Executive Summary
TechFlow Inc. is a B2B SaaS platform specializing in workflow automation for mid-market enterprises. After 3 years of operation and achieving $4.2M ARR, the company is evaluating Series B readiness.

Strengths
- Strong product-market fit with 94% customer retention rate
- Proprietary AI engine reducing manual workflow setup by 73%
- Growing enterprise segment (38% of new revenue)
- Experienced founding team with 2 prior exits

Weaknesses
- Customer acquisition cost increased 22% YoY
- Sales cycle extended to 89 days (up from 67)
- Technical debt in legacy codebase slowing feature velocity
- Limited brand awareness outside core markets

Opportunities
- Enterprise automation market projected to grow 24% CAGR through 2027
- Strategic partnership discussions with 2 major cloud providers
- Geographic expansion into EMEA showing early traction
- New vertical-specific solutions could unlock $12B TAM

Threats & Risks
- Three well-funded competitors raised $200M+ combined in 2024
- Economic uncertainty affecting enterprise software budgets
- Key engineering talent being actively recruited by competitors
- Regulatory changes in data processing may require compliance investment

Key Metrics
- Monthly Recurring Revenue: $350K (growing 8% MoM)
- Net Revenue Retention: 118%
- Gross Margin: 72%
- Runway: 18 months at current burn

Strategic Recommendations
1. Accelerate enterprise sales motion before market window closes
2. Invest in developer experience to reduce churn risk
3. Consider strategic partnerships over pure organic growth
4. Build defensible moats through proprietary data assets`;

interface SeeExampleButtonProps {
  className?: string;
  variant?: "default" | "outline";
}

export const SeeExampleButton = ({ className, variant = "outline" }: SeeExampleButtonProps) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const { setRawText, rawText } = useNarrativeStore();

  const hasContent = rawText.trim().length > 0;

  const handleLoadExample = () => {
    if (hasContent) {
      setShowConfirm(true);
    } else {
      loadExample();
    }
  };

  const loadExample = () => {
    setRawText(EXAMPLE_RESEARCH);
    setShowConfirm(false);
  };

  return (
    <>
      <Button
        variant={variant}
        onClick={handleLoadExample}
        className={cn("h-12", className)}
      >
        <Eye className="w-4 h-4 mr-2" />
        Example
      </Button>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-xl p-6 max-w-sm mx-4 shadow-xl"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-semibold text-foreground">Replace current content?</h3>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Loading the example will replace your current research. This action cannot be undone.
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowConfirm(false)}>
                  Cancel
                </Button>
                <Button variant="shimmer" size="sm" onClick={loadExample}>
                  Load Example
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

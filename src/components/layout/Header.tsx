import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Zap } from "lucide-react";
import { criticalImages, isImageReady, onImageReady } from "@/lib/imagePreloader";
import { AccountMenu } from "./AccountMenu";
import { CompanyBrainIndicator } from "./CompanyBrainIndicator";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { UpgradePrompt } from "@/components/subscription/UpgradePrompt";
import { cn } from "@/lib/utils";

export const Header = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { isPro, isTrial, limits, usage, trialDaysRemaining, isLoading: subLoading } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [logoReady, setLogoReady] = useState(() => isImageReady("conclusivIcon"));

  useEffect(() => {
    if (logoReady) return;
    return onImageReady("conclusivIcon", () => setLogoReady(true));
  }, [logoReady]);

  // Guard: Only compute user-dependent values when auth is stable
  // Use safe defaults when loading to prevent crashes
  const buildsRemaining = (!authLoading && limits?.buildsPerWeek !== undefined)
    ? (limits.buildsPerWeek === Infinity ? null : Math.max(0, limits.buildsPerWeek - (usage?.buildsThisWeek ?? 0)))
    : null;

  const showUpgradeButton = !authLoading && user && !isPro && !subLoading;
  const showBuildsCounter = !authLoading && user && !subLoading && buildsRemaining !== null;

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 glass-strong"
      >
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center">
            {/* C icon - responsive sizing with fade-in */}
            <motion.img 
              src={criticalImages.conclusivIcon}
              alt="conclusiv" 
              className="h-7 w-7 sm:h-8 sm:w-8 object-contain"
              initial={{ opacity: 0 }}
              animate={{ opacity: logoReady ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Builds counter */}
            {showBuildsCounter && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                  buildsRemaining === 0 
                    ? "bg-destructive/10 text-destructive border border-destructive/20"
                    : "bg-muted/50 text-muted-foreground border border-border/50"
                )}
              >
                <Zap className={cn(
                  "w-3.5 h-3.5",
                  buildsRemaining === 0 ? "text-destructive" : "text-shimmer-start"
                )} />
                <span>{buildsRemaining} build{buildsRemaining !== 1 ? 's' : ''} left</span>
              </motion.div>
            )}

            {/* Trial badge - only show when auth is ready */}
            {!authLoading && user && isTrial && trialDaysRemaining !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{trialDaysRemaining}d trial left</span>
              </motion.div>
            )}

            {/* Upgrade button */}
            {showUpgradeButton && (
              <Button
                variant="shimmer"
                size="sm"
                onClick={() => setShowUpgrade(true)}
                className="hidden sm:flex"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Upgrade to Pro
              </Button>
            )}

            {/* Company Brain indicator - only for authenticated users when auth is ready */}
            {!authLoading && user && <CompanyBrainIndicator />}

            {/* AccountMenu handles its own loading state */}
            <AccountMenu />
          </div>
        </div>
      </motion.header>

      <UpgradePrompt
        trigger="build_limit"
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
      />
    </>
  );
};

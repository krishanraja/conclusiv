import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Zap } from "lucide-react";
import conclusivLogo from "@/assets/conclusiv-logo.png";
import { AccountMenu } from "./AccountMenu";
import { CompanyBrainIndicator } from "./CompanyBrainIndicator";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { UpgradePrompt } from "@/components/subscription/UpgradePrompt";
import { cn } from "@/lib/utils";

export const Header = () => {
  const { user } = useAuth();
  const { isPro, isTrial, limits, usage, trialDaysRemaining, isLoading } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const buildsRemaining = limits.buildsPerWeek === Infinity 
    ? null 
    : Math.max(0, limits.buildsPerWeek - usage.buildsThisWeek);

  const showUpgradeButton = user && !isPro && !isLoading;
  const showBuildsCounter = user && !isLoading && buildsRemaining !== null;

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 glass-strong"
      >
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center">
            {/* Mobile: C icon */}
            <img 
              src="/favicon.png"
              alt="conclusiv" 
              className="h-8 w-8 sm:hidden"
            />
            {/* Desktop: Full wordmark */}
            <img 
              src={conclusivLogo} 
              alt="conclusiv" 
              className="hidden sm:block h-5 w-auto"
              style={{ aspectRatio: 'auto' }}
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

            {/* Trial badge */}
            {user && isTrial && trialDaysRemaining !== null && (
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

            {/* Company Brain indicator - only for authenticated users */}
            {user && <CompanyBrainIndicator />}

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

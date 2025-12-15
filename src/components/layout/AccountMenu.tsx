import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, CreditCard, Sparkles, Loader2, X, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { useHaptics } from '@/hooks/useHaptics';

export const AccountMenu = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isPro, isTrial, trialDaysRemaining, usage, limits } = useSubscription();
  const isMobile = useIsMobile();
  const haptics = useHaptics();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Lock body scroll when menu is open on mobile
  useEffect(() => {
    if (isOpen && isMobile) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, isMobile]);

  if (!user) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/auth')}
        className="text-muted-foreground hover:text-foreground"
      >
        Sign in
      </Button>
    );
  }

  const handleOpen = () => {
    haptics.light();
    setIsOpen(true);
  };

  const handleClose = () => {
    haptics.selection();
    setIsOpen(false);
  };

  const handleProfileClick = () => {
    haptics.light();
    if (isMobile) {
      setIsOpen(false);
      navigate('/profile');
    } else {
      setIsOpen(false);
      navigate('/profile');
    }
  };

  const handleSignOut = async () => {
    haptics.medium();
    setIsOpen(false);
    await signOut();
    navigate('/');
  };

  const handleManageBilling = async () => {
    setIsLoading(true);
    haptics.light();
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Failed to open billing portal:', err);
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  const handleUpgrade = async () => {
    setIsLoading(true);
    haptics.light();
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Failed to create checkout:', err);
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';
  const buildsRemaining = isPro ? '∞' : Math.max(0, limits.buildsPerWeek - usage.buildsThisWeek);

  // Staggered animation for menu items
  const menuItemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: 0.05 + i * 0.05, duration: 0.2, ease: "easeOut" }
    })
  };

  return (
    <div className="relative">
      {/* Profile button - same on mobile and desktop */}
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
          <User className="w-4 h-4 text-primary" />
        </div>
        {!isMobile && <span className="hidden sm:inline">{displayName}</span>}
        {isPro && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
            PRO
          </span>
        )}
      </button>

      {/* Account Menu - renders via portal-like fixed positioning */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop - always rendered first */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm"
              onClick={handleClose}
              aria-hidden="true"
            />

            {/* Menu - Bottom sheet on mobile, dropdown on desktop */}
            {isMobile ? (
              // MOBILE: Bottom sheet with proper animation and high z-index
              <motion.div
                key="mobile-menu"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 350 }}
                className="fixed bottom-0 left-0 right-0 z-[101] bg-card rounded-t-3xl border-t border-border shadow-2xl overflow-hidden"
              >
                {/* Drag handle indicator */}
                <div className="flex justify-center pt-3 pb-2">
                  <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
                </div>

                {/* Header with close button */}
                <motion.div 
                  className="flex items-center justify-between px-5 pb-3"
                  variants={menuItemVariants}
                  initial="hidden"
                  animate="visible"
                  custom={0}
                >
                  <h2 className="text-lg font-semibold text-foreground">Account</h2>
                  <button 
                    onClick={handleClose}
                    className="p-2 -mr-2 rounded-full hover:bg-muted/50 active:bg-muted transition-colors"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </motion.div>

                {/* User info card */}
                <motion.div 
                  className="mx-4 mb-4 p-4 bg-muted/30 rounded-2xl"
                  variants={menuItemVariants}
                  initial="hidden"
                  animate="visible"
                  custom={1}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-lg truncate">{displayName}</p>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  
                  {/* Plan status */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {isPro ? (
                      <span className="px-3 py-1.5 rounded-full bg-primary/20 text-primary font-medium text-sm">
                        {isTrial ? `Trial (${trialDaysRemaining}d left)` : 'Pro Plan'}
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 rounded-full bg-muted text-muted-foreground font-medium text-sm">
                        Free Plan
                      </span>
                    )}
                    <span className="text-sm text-muted-foreground">
                      {buildsRemaining} builds left
                    </span>
                  </div>
                </motion.div>

                {/* Actions */}
                <div className="px-4 pb-safe space-y-2">
                  <motion.button
                    onClick={handleProfileClick}
                    className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-muted/30 text-foreground font-medium text-base active:scale-[0.98] active:bg-muted/50 transition-all"
                    variants={menuItemVariants}
                    initial="hidden"
                    animate="visible"
                    custom={2}
                  >
                    <Settings className="w-5 h-5" />
                    View Profile
                  </motion.button>

                  {!isPro && (
                    <motion.button
                      onClick={handleUpgrade}
                      disabled={isLoading}
                      className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-gradient-to-r from-primary/20 to-shimmer-end/20 text-primary font-medium text-base active:scale-[0.98] transition-transform"
                      variants={menuItemVariants}
                      initial="hidden"
                      animate="visible"
                      custom={3}
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Sparkles className="w-5 h-5" />
                      )}
                      Upgrade to Pro
                    </motion.button>
                  )}

                  {isPro && (
                    <motion.button
                      onClick={handleManageBilling}
                      disabled={isLoading}
                      className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-muted/50 text-foreground font-medium text-base active:scale-[0.98] active:bg-muted transition-all"
                      variants={menuItemVariants}
                      initial="hidden"
                      animate="visible"
                      custom={3}
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <CreditCard className="w-5 h-5" />
                      )}
                      Manage Billing
                    </motion.button>
                  )}

                  <motion.button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-muted/30 text-muted-foreground font-medium text-base active:scale-[0.98] active:bg-muted/50 transition-all"
                    variants={menuItemVariants}
                    initial="hidden"
                    animate="visible"
                    custom={isPro ? 4 : 4}
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </motion.button>
                  
                  {/* Extra padding at bottom for gesture area */}
                  <div className="h-2" />
                </div>
              </motion.div>
            ) : (
              // DESKTOP: Dropdown menu with proper z-index
              <motion.div
                key="desktop-menu"
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute right-0 top-full mt-2 w-64 bg-card rounded-xl border border-border shadow-xl z-[101] overflow-hidden"
              >
                {/* User info */}
                <div className="p-4 border-b border-border/30">
                  <p className="font-medium text-foreground">{displayName}</p>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">{user.email}</p>
                  
                  {/* Plan status */}
                  <div className="mt-3 flex items-center gap-2">
                    {isPro ? (
                      <span className="px-2 py-1 rounded-full bg-primary/20 text-primary font-medium text-xs">
                        {isTrial ? `Trial (${trialDaysRemaining}d left)` : 'Pro Plan'}
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full bg-muted text-muted-foreground font-medium text-xs">
                        Free Plan
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {buildsRemaining} builds left
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-2">
                  <button
                    onClick={handleProfileClick}
                    className="w-full flex items-center gap-3 px-4 py-2 text-left rounded-lg text-muted-foreground text-sm hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    View Profile
                  </button>

                  {!isPro && (
                    <button
                      onClick={handleUpgrade}
                      disabled={isLoading}
                      className="w-full flex items-center gap-3 px-4 py-2 text-left rounded-lg bg-primary/10 text-primary text-sm hover:bg-primary/20 transition-colors"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      Upgrade to Pro
                    </button>
                  )}

                  {isPro && (
                    <button
                      onClick={handleManageBilling}
                      disabled={isLoading}
                      className="w-full flex items-center gap-3 px-4 py-2 text-left rounded-lg text-muted-foreground text-sm hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CreditCard className="w-4 h-4" />
                      )}
                      Manage billing
                    </button>
                  )}

                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-2 text-left rounded-lg text-muted-foreground text-sm hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

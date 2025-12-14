import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, CreditCard, Sparkles, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';

export const AccountMenu = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isPro, isTrial, trialDaysRemaining, usage, limits } = useSubscription();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    navigate('/');
  };

  const handleManageBilling = async () => {
    setIsLoading(true);
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

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
          <User className="w-4 h-4 text-primary" />
        </div>
        <span className="hidden sm:inline">{displayName}</span>
        {isPro && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
            PRO
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop - solid dark on mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`fixed inset-0 z-40 ${isMobile ? 'bg-background/95' : 'bg-transparent'}`}
              onClick={() => setIsOpen(false)}
            />

            {/* Menu - Full screen slide-up on mobile, dropdown on desktop */}
            <motion.div
              initial={isMobile ? { opacity: 0, y: '100%' } : { opacity: 0, y: 8, scale: 0.95 }}
              animate={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, y: 0, scale: 1 }}
              exit={isMobile ? { opacity: 0, y: '100%' } : { opacity: 0, y: 8, scale: 0.95 }}
              transition={isMobile ? { type: 'spring', damping: 25, stiffness: 300 } : { duration: 0.15 }}
              className={
                isMobile
                  ? "fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl border-t border-x border-border shadow-2xl"
                  : "absolute right-0 top-full mt-2 w-64 bg-card rounded-xl border border-border shadow-xl z-50 overflow-hidden"
              }
            >
              {/* Mobile drag handle */}
              {isMobile && (
                <div className="flex items-center justify-between p-4 border-b border-border/30">
                  <span className="text-sm font-medium text-muted-foreground">Account</span>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-full hover:bg-muted transition-colors"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              )}

              {/* User info */}
              <div className={`p-4 ${isMobile ? '' : 'border-b border-border/30'}`}>
                <p className={`font-medium text-foreground ${isMobile ? 'text-lg' : ''}`}>{displayName}</p>
                <p className="text-sm text-muted-foreground truncate mt-0.5">{user.email}</p>
                
                {/* Plan status */}
                <div className={`mt-3 flex items-center gap-2 ${isMobile ? 'flex-wrap' : ''}`}>
                  {isPro ? (
                    <span className={`px-2 py-1 rounded-full bg-primary/20 text-primary font-medium ${isMobile ? 'text-sm' : 'text-xs'}`}>
                      {isTrial ? `Trial (${trialDaysRemaining}d left)` : 'Pro Plan'}
                    </span>
                  ) : (
                    <span className={`px-2 py-1 rounded-full bg-muted text-muted-foreground font-medium ${isMobile ? 'text-sm' : 'text-xs'}`}>
                      Free Plan
                    </span>
                  )}
                  <span className={`text-muted-foreground ${isMobile ? 'text-sm' : 'text-xs'}`}>
                    {buildsRemaining} builds left
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className={`p-2 ${isMobile ? 'pb-safe space-y-1' : ''}`}>
                {!isPro && (
                  <button
                    onClick={handleUpgrade}
                    disabled={isLoading}
                    className={`w-full flex items-center gap-3 px-4 text-left rounded-lg bg-primary/10 text-primary transition-colors ${isMobile ? 'py-3.5 text-base hover:bg-primary/20' : 'py-2 text-sm hover:bg-primary/20'}`}
                  >
                    {isLoading ? (
                      <Loader2 className={`animate-spin ${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
                    ) : (
                      <Sparkles className={isMobile ? 'w-5 h-5' : 'w-4 h-4'} />
                    )}
                    Upgrade to Pro
                  </button>
                )}

                {isPro && (
                  <button
                    onClick={handleManageBilling}
                    disabled={isLoading}
                    className={`w-full flex items-center gap-3 px-4 text-left rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors ${isMobile ? 'py-3.5 text-base' : 'py-2 text-sm'}`}
                  >
                    {isLoading ? (
                      <Loader2 className={`animate-spin ${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
                    ) : (
                      <CreditCard className={isMobile ? 'w-5 h-5' : 'w-4 h-4'} />
                    )}
                    Manage billing
                  </button>
                )}

                <button
                  onClick={handleSignOut}
                  className={`w-full flex items-center gap-3 px-4 text-left rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors ${isMobile ? 'py-3.5 text-base' : 'py-2 text-sm'}`}
                >
                  <LogOut className={isMobile ? 'w-5 h-5' : 'w-4 h-4'} />
                  Sign out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

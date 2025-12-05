import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, CreditCard, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';

export const AccountMenu = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isPro, isTrial, trialDaysRemaining, usage, limits } = useSubscription();
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
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error('Failed to open billing portal:', err);
    } finally {
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
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error('Failed to create checkout:', err);
    } finally {
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
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-64 glass-strong rounded-xl border border-border/50 shadow-xl z-50 overflow-hidden"
            >
              {/* User info */}
              <div className="p-4 border-b border-border/30">
                <p className="font-medium text-foreground">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                
                {/* Plan status */}
                <div className="mt-3 flex items-center gap-2">
                  {isPro ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary font-medium">
                      {isTrial ? `Trial (${trialDaysRemaining}d left)` : 'Pro Plan'}
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground font-medium">
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
                {!isPro && (
                  <button
                    onClick={handleUpgrade}
                    disabled={isLoading}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left rounded-lg hover:bg-primary/10 text-primary transition-colors"
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
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
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
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <LogOut className="w-4 h-4" />
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

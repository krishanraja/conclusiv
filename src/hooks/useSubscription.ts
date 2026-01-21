import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type SubscriptionPlan = 'free' | 'pro';
export type SubscriptionStatus = 'free' | 'trialing' | 'active' | 'cancelled' | 'past_due';

interface SubscriptionState {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  subscriptionEnd: string | null;
  trialEnd: string | null;
  isLoading: boolean;
}

interface UsageState {
  buildsThisWeek: number;
  lastBuildAt: string | null;
  weekStart: string;
}

// Feature access matrix
export const FEATURE_LIMITS = {
  free: {
    buildsPerWeek: 1,
    maxSections: 4,
    templates: ['linear-storyboard'] as const,
    canExport: true, // PDF only, with watermark
    canExportPPTX: false,
    canChangeIcons: false,
    canChangeThemes: false,
    canReorderSections: false,
    hasWatermark: true,
    fullPresentation: false,
    priorityProcessing: false,
  },
  pro: {
    buildsPerWeek: Infinity,
    maxSections: Infinity,
    templates: ['linear-storyboard', 'zoom-reveal', 'flyover-map', 'contrast-split', 'priority-ladder'] as const,
    canExport: true, // PDF & PPTX, no watermark
    canExportPPTX: true,
    canChangeIcons: true,
    canChangeThemes: true,
    canReorderSections: true,
    hasWatermark: false,
    fullPresentation: true,
    priorityProcessing: true,
  },
} as const;

export const useSubscription = () => {
  const { user, isLoading: authLoading } = useAuth();
  
  // Load cached subscription state first for instant UI
  const [subscription, setSubscription] = useState<SubscriptionState>(() => {
    const cached = localStorage.getItem('conclusiv_subscription');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // Cache valid for 5 minutes
        if (parsed.cachedAt && Date.now() - parsed.cachedAt < 5 * 60 * 1000) {
          return { ...parsed, isLoading: false };
        }
      } catch {
        localStorage.removeItem('conclusiv_subscription');
      }
    }
    return {
      plan: 'free',
      status: 'free',
      subscriptionEnd: null,
      trialEnd: null,
      isLoading: true,
    };
  });
  
  const [usage, setUsage] = useState<UsageState>({
    buildsThisWeek: 0,
    lastBuildAt: null,
    weekStart: getWeekStart(),
  });

  const [hasEverBuilt, setHasEverBuilt] = useState(() => {
    // Clean up stale localStorage data on init
    const storedUsage = localStorage.getItem('conclusiv_usage');
    const currentWeek = getWeekStart();
    
    if (storedUsage) {
      try {
        const parsed = JSON.parse(storedUsage);
        if (parsed.weekStart !== currentWeek) {
          // New week - reset usage data
          localStorage.removeItem('conclusiv_usage');
          console.log('[useSubscription] Reset usage for new week');
        }
      } catch {
        localStorage.removeItem('conclusiv_usage');
      }
    }
    
    return localStorage.getItem('conclusiv_first_build_completed') === 'true';
  });

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(prev => ({ ...prev, plan: 'free', status: 'free', isLoading: false }));
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        setSubscription(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const newState = {
        plan: data.plan || 'free',
        status: data.status || 'free',
        subscriptionEnd: data.subscription_end,
        trialEnd: data.trial_end,
        isLoading: false,
      };
      setSubscription(newState);
      // Cache subscription for instant load on next visit
      localStorage.setItem('conclusiv_subscription', JSON.stringify({
        ...newState,
        cachedAt: Date.now(),
      }));
    } catch (err) {
      console.error('Failed to check subscription:', err);
      setSubscription(prev => ({ ...prev, isLoading: false }));
    }
  }, [user]);

  const fetchUsage = useCallback(async () => {
    if (!user) {
      // Check localStorage for anonymous usage
      const localUsage = localStorage.getItem('conclusiv_usage');
      if (localUsage) {
        const parsed = JSON.parse(localUsage);
        const currentWeek = getWeekStart();
        if (parsed.weekStart === currentWeek) {
          setUsage(parsed);
        } else {
          // Reset for new week
          const newUsage = { buildsThisWeek: 0, lastBuildAt: null, weekStart: currentWeek };
          localStorage.setItem('conclusiv_usage', JSON.stringify(newUsage));
          setUsage(newUsage);
        }
      }
      return;
    }

    try {
      const weekStart = getWeekStart();
      const { data, error } = await supabase
        .from('usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .maybeSingle();

      // Handle various error cases
      if (error) {
        // PGRST116 = no rows found (expected when user hasn't built yet)
        if (error.code === 'PGRST116') {
          // This is expected - user hasn't built this week yet
          return;
        }
        
        // 406 = Not Acceptable - usually content negotiation issue
        if (error.code === 'PGRST301' || error.message?.includes('406')) {
          console.warn('[useSubscription] 406 error fetching usage - possible format mismatch:', error);
          // Try with explicit column selection
          const { data: retryData, error: retryError } = await supabase
            .from('usage')
            .select('builds_count, last_build_at, week_start')
            .eq('user_id', user.id)
            .eq('week_start', weekStart)
            .maybeSingle();
          
          if (!retryError && retryData) {
            setUsage({
              buildsThisWeek: retryData.builds_count || 0,
              lastBuildAt: retryData.last_build_at,
              weekStart,
            });
          }
          return;
        }
        
        console.error('[useSubscription] Error fetching usage:', error);
        return;
      }

      if (data) {
        setUsage({
          buildsThisWeek: data.builds_count || 0,
          lastBuildAt: data.last_build_at,
          weekStart,
        });
        // If they have any builds in DB, they've built before
        if (data.builds_count > 0) {
          setHasEverBuilt(true);
          localStorage.setItem('conclusiv_first_build_completed', 'true');
        }
      }
    } catch (err) {
      console.error('Failed to fetch usage:', err);
    }
  }, [user]);

  const incrementBuildCount = useCallback(async () => {
    const weekStart = getWeekStart();
    const newCount = usage.buildsThisWeek + 1;
    const now = new Date().toISOString();

    // Mark first build as completed
    if (!hasEverBuilt) {
      setHasEverBuilt(true);
      localStorage.setItem('conclusiv_first_build_completed', 'true');
    }

    if (!user) {
      // Store in localStorage for anonymous users
      const newUsage = { buildsThisWeek: newCount, lastBuildAt: now, weekStart };
      localStorage.setItem('conclusiv_usage', JSON.stringify(newUsage));
      setUsage(newUsage);
      return;
    }

    try {
      const { error } = await supabase
        .from('usage')
        .upsert({
          user_id: user.id,
          week_start: weekStart,
          builds_count: newCount,
          last_build_at: now,
        }, { onConflict: 'user_id,week_start' });

      if (error) {
        console.error('Error updating usage:', error);
        return;
      }

      setUsage({
        buildsThisWeek: newCount,
        lastBuildAt: now,
        weekStart,
      });
    } catch (err) {
      console.error('Failed to update usage:', err);
    }
  }, [user, usage.buildsThisWeek, hasEverBuilt]);

  // Initial load - wait for auth to be fully stable before fetching
  // We check both authLoading AND explicitly track user to prevent race conditions
  useEffect(() => {
    // Only proceed when auth is no longer loading
    if (authLoading) return;
    
    // Now auth is stable - we know definitively whether user is logged in or not
    checkSubscription();
    fetchUsage();
  }, [authLoading, user, checkSubscription, fetchUsage]);

  // Refresh subscription periodically (every minute)
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  const isPro = subscription.plan === 'pro';
  const isTrial = subscription.status === 'trialing';
  const limits = isPro ? FEATURE_LIMITS.pro : FEATURE_LIMITS.free;
  
  // First build is always free, trial users can build, then check weekly limits
  // Also allow builds while subscription is loading to prevent false blocks
  const canBuild = subscription.isLoading || isPro || isTrial || !hasEverBuilt || usage.buildsThisWeek < limits.buildsPerWeek;
  const isFirstBuild = !hasEverBuilt;

  const trialDaysRemaining = subscription.trialEnd 
    ? Math.max(0, Math.ceil((new Date(subscription.trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return {
    ...subscription,
    usage,
    isPro,
    isTrial,
    limits,
    canBuild,
    isFirstBuild,
    hasEverBuilt,
    trialDaysRemaining,
    checkSubscription,
    incrementBuildCount,
  };
};

// Helper to get the start of the current week (Monday)
function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
}

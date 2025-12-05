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
    canExport: false,
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
    canExport: true,
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
  
  const [subscription, setSubscription] = useState<SubscriptionState>({
    plan: 'free',
    status: 'free',
    subscriptionEnd: null,
    trialEnd: null,
    isLoading: true,
  });
  
  const [usage, setUsage] = useState<UsageState>({
    buildsThisWeek: 0,
    lastBuildAt: null,
    weekStart: getWeekStart(),
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

      setSubscription({
        plan: data.plan || 'free',
        status: data.status || 'free',
        subscriptionEnd: data.subscription_end,
        trialEnd: data.trial_end,
        isLoading: false,
      });
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
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching usage:', error);
        return;
      }

      if (data) {
        setUsage({
          buildsThisWeek: data.builds_count || 0,
          lastBuildAt: data.last_build_at,
          weekStart,
        });
      }
    } catch (err) {
      console.error('Failed to fetch usage:', err);
    }
  }, [user]);

  const incrementBuildCount = useCallback(async () => {
    const weekStart = getWeekStart();
    const newCount = usage.buildsThisWeek + 1;
    const now = new Date().toISOString();

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
  }, [user, usage.buildsThisWeek]);

  // Initial load
  useEffect(() => {
    if (!authLoading) {
      checkSubscription();
      fetchUsage();
    }
  }, [authLoading, checkSubscription, fetchUsage]);

  // Refresh subscription periodically (every minute)
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  const isPro = subscription.plan === 'pro';
  const isTrial = subscription.status === 'trialing';
  const limits = isPro ? FEATURE_LIMITS.pro : FEATURE_LIMITS.free;
  const canBuild = isPro || usage.buildsThisWeek < limits.buildsPerWeek;

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

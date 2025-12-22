/**
 * Auth State Machine
 * 
 * Provides explicit state management for authentication with clear transitions.
 * This replaces scattered boolean checks with a single source of truth.
 * 
 * States:
 * - anonymous: No user, no progress
 * - anonymous_with_progress: No user, but has local work
 * - authenticating: Auth operation in progress
 * - authenticated: Valid session
 * - session_expired: Session needs refresh
 * - signed_out: Explicitly signed out
 * 
 * See plan: auth_&_onboarding_audit_a083024c.plan.md
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Auth state machine states
export type AuthState = 
  | 'anonymous'
  | 'anonymous_with_progress'
  | 'authenticating'
  | 'authenticated'
  | 'session_expired'
  | 'signed_out';

// Events that can trigger state transitions
export type AuthEvent =
  | 'INITIAL_SESSION_LOADED'
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY'
  | 'SESSION_EXPIRED'
  | 'PROGRESS_CREATED'
  | 'AUTH_ERROR';

// LocalStorage keys for anonymous progress
const STORAGE_KEYS = {
  onboarding: 'conclusiv_onboarding',
  usage: 'conclusiv_usage',
  firstBuild: 'conclusiv_first_build_completed',
  subscription: 'conclusiv_subscription',
} as const;

interface AuthStateMachineState {
  state: AuthState;
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: Error | null;
  hasLocalProgress: boolean;
  lastEvent: AuthEvent | null;
}

interface AuthActions {
  signUp: (email: string, password: string, displayName?: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  refreshSession: () => Promise<void>;
  markProgress: () => void;
}

export interface AuthStateMachine extends AuthStateMachineState, AuthActions {
  // Derived state helpers
  isAnonymous: boolean;
  isAuthenticated: boolean;
  canAccessProtectedRoutes: boolean;
}

/**
 * Check if user has local progress stored
 */
function checkLocalProgress(): boolean {
  if (typeof window === 'undefined') return false;
  
  return !!(
    localStorage.getItem(STORAGE_KEYS.onboarding) ||
    localStorage.getItem(STORAGE_KEYS.usage) ||
    localStorage.getItem(STORAGE_KEYS.firstBuild)
  );
}

/**
 * Get the initial state based on local storage
 */
function getInitialState(): AuthStateMachineState {
  const hasProgress = checkLocalProgress();
  return {
    state: hasProgress ? 'anonymous_with_progress' : 'anonymous',
    user: null,
    session: null,
    isLoading: true,
    error: null,
    hasLocalProgress: hasProgress,
    lastEvent: null,
  };
}

/**
 * State transition function
 */
function transition(
  currentState: AuthState,
  event: AuthEvent,
  context: { session: Session | null; hasProgress: boolean }
): AuthState {
  const { session, hasProgress } = context;
  
  switch (currentState) {
    case 'anonymous':
    case 'anonymous_with_progress':
      switch (event) {
        case 'SIGNED_IN':
        case 'INITIAL_SESSION_LOADED':
          return session ? 'authenticated' : hasProgress ? 'anonymous_with_progress' : 'anonymous';
        case 'PROGRESS_CREATED':
          return 'anonymous_with_progress';
        default:
          return currentState;
      }
      
    case 'authenticating':
      switch (event) {
        case 'SIGNED_IN':
          return 'authenticated';
        case 'AUTH_ERROR':
        case 'SIGNED_OUT':
          return hasProgress ? 'anonymous_with_progress' : 'anonymous';
        default:
          return 'authenticating';
      }
      
    case 'authenticated':
      switch (event) {
        case 'SIGNED_OUT':
          return 'signed_out';
        case 'SESSION_EXPIRED':
          return 'session_expired';
        case 'TOKEN_REFRESHED':
        case 'USER_UPDATED':
          return 'authenticated';
        default:
          return 'authenticated';
      }
      
    case 'session_expired':
      switch (event) {
        case 'TOKEN_REFRESHED':
        case 'SIGNED_IN':
          return 'authenticated';
        case 'SIGNED_OUT':
          return 'signed_out';
        default:
          return 'session_expired';
      }
      
    case 'signed_out':
      switch (event) {
        case 'SIGNED_IN':
          return 'authenticated';
        case 'PROGRESS_CREATED':
          return 'anonymous_with_progress';
        default:
          return hasProgress ? 'anonymous_with_progress' : 'anonymous';
      }
      
    default:
      return currentState;
  }
}

/**
 * Map Supabase auth events to our state machine events
 */
function mapSupabaseEvent(event: AuthChangeEvent): AuthEvent {
  switch (event) {
    case 'SIGNED_IN':
      return 'SIGNED_IN';
    case 'SIGNED_OUT':
      return 'SIGNED_OUT';
    case 'TOKEN_REFRESHED':
      return 'TOKEN_REFRESHED';
    case 'USER_UPDATED':
      return 'USER_UPDATED';
    case 'PASSWORD_RECOVERY':
      return 'PASSWORD_RECOVERY';
    case 'INITIAL_SESSION':
      return 'INITIAL_SESSION_LOADED';
    default:
      return 'INITIAL_SESSION_LOADED';
  }
}

export const useAuthStateMachine = (): AuthStateMachine => {
  const [machineState, setMachineState] = useState<AuthStateMachineState>(getInitialState);
  const mountedRef = useRef(true);
  const sessionRefreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle state transitions
  const dispatch = useCallback((event: AuthEvent, session: Session | null, error?: Error) => {
    if (!mountedRef.current) return;
    
    setMachineState(prev => {
      const hasProgress = checkLocalProgress();
      const newState = transition(prev.state, event, { session, hasProgress });
      
      console.log(`[AuthStateMachine] ${prev.state} -> ${newState} (event: ${event})`);
      
      return {
        state: newState,
        user: session?.user ?? null,
        session,
        isLoading: false,
        error: error ?? null,
        hasLocalProgress: hasProgress,
        lastEvent: event,
      };
    });
  }, []);

  // Set up auth state listener
  useEffect(() => {
    mountedRef.current = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const mappedEvent = mapSupabaseEvent(event);
        dispatch(mappedEvent, session);
        
        // Set up session refresh timer if authenticated
        if (session && event !== 'SIGNED_OUT') {
          const expiresAt = session.expires_at;
          if (expiresAt) {
            const expiresIn = expiresAt * 1000 - Date.now();
            const refreshBuffer = 60 * 1000; // Refresh 1 minute before expiry
            
            if (sessionRefreshTimeoutRef.current) {
              clearTimeout(sessionRefreshTimeoutRef.current);
            }
            
            if (expiresIn > refreshBuffer) {
              sessionRefreshTimeoutRef.current = setTimeout(() => {
                supabase.auth.refreshSession();
              }, expiresIn - refreshBuffer);
            }
          }
        }
      }
    );

    // Load initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        dispatch('AUTH_ERROR', null, error);
      } else {
        dispatch('INITIAL_SESSION_LOADED', session);
      }
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
      if (sessionRefreshTimeoutRef.current) {
        clearTimeout(sessionRefreshTimeoutRef.current);
      }
    };
  }, [dispatch]);

  // Auth actions
  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    setMachineState(prev => ({ ...prev, state: 'authenticating', isLoading: true }));
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined,
          data: {
            display_name: displayName || email.split('@')[0],
          },
        },
      });

      if (error) {
        dispatch('AUTH_ERROR', null, error);
        return { success: false, error: error.message };
      }

      // Session will be set via onAuthStateChange
      return { success: true };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Sign up failed');
      dispatch('AUTH_ERROR', null, error);
      return { success: false, error: error.message };
    }
  }, [dispatch]);

  const signIn = useCallback(async (email: string, password: string) => {
    setMachineState(prev => ({ ...prev, state: 'authenticating', isLoading: true }));
    
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        dispatch('AUTH_ERROR', null, error);
        return { success: false, error: error.message };
      }

      // Session will be set via onAuthStateChange
      return { success: true };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Sign in failed');
      dispatch('AUTH_ERROR', null, error);
      return { success: false, error: error.message };
    }
  }, [dispatch]);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { success: false, error: error.message };
      }

      // State will be updated via onAuthStateChange
      return { success: true };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Sign out failed');
      return { success: false, error: error.message };
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      // Validate redirect URL is same origin to prevent open redirects
      const redirectTo = `${window.location.origin}/auth?mode=reset`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Password reset failed');
      return { success: false, error: error.message };
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        dispatch('SESSION_EXPIRED', null, error);
      } else if (session) {
        dispatch('TOKEN_REFRESHED', session);
      }
    } catch (err) {
      dispatch('SESSION_EXPIRED', null, err instanceof Error ? err : new Error('Session refresh failed'));
    }
  }, [dispatch]);

  const markProgress = useCallback(() => {
    if (machineState.state === 'anonymous') {
      dispatch('PROGRESS_CREATED', machineState.session);
    }
  }, [machineState.state, machineState.session, dispatch]);

  // Derived state
  const isAnonymous = machineState.state === 'anonymous' || machineState.state === 'anonymous_with_progress';
  const isAuthenticated = machineState.state === 'authenticated';
  const canAccessProtectedRoutes = isAuthenticated;

  return {
    ...machineState,
    signUp,
    signIn,
    signOut,
    resetPassword,
    refreshSession,
    markProgress,
    isAnonymous,
    isAuthenticated,
    canAccessProtectedRoutes,
  };
};

/**
 * Hook to merge localStorage data to profile on first authentication
 * Should be used in App.tsx or a top-level component
 */
export const useLocalStorageMerge = (auth: AuthStateMachine) => {
  const hasMergedRef = useRef(false);

  useEffect(() => {
    // Only run once when user first authenticates
    if (auth.lastEvent !== 'SIGNED_IN' || hasMergedRef.current) return;
    if (!auth.user) return;

    hasMergedRef.current = true;
    
    const mergeLocalStorage = async () => {
      console.log('[AuthStateMachine] Merging localStorage to profile...');
      
      try {
        // Merge onboarding progress
        const onboardingData = localStorage.getItem(STORAGE_KEYS.onboarding);
        if (onboardingData) {
          const parsed = JSON.parse(onboardingData);
          
          // Check if profile doesn't have onboarding completed
          const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_completed, onboarding_step')
            .eq('id', auth.user.id)
            .single();
          
          if (profile && !profile.onboarding_completed && parsed.step > profile.onboarding_step) {
            await supabase
              .from('profiles')
              .update({
                onboarding_step: parsed.step,
                onboarding_completed: parsed.completed,
              })
              .eq('id', auth.user.id);
            
            console.log('[AuthStateMachine] Merged onboarding progress');
          }
          
          localStorage.removeItem(STORAGE_KEYS.onboarding);
        }

        // Merge usage data
        const usageData = localStorage.getItem(STORAGE_KEYS.usage);
        if (usageData) {
          const parsed = JSON.parse(usageData);
          
          // Upsert usage data
          await supabase
            .from('usage')
            .upsert({
              user_id: auth.user.id,
              week_start: parsed.weekStart,
              builds_count: parsed.buildsThisWeek,
              last_build_at: parsed.lastBuildAt,
            }, { onConflict: 'user_id,week_start' });
          
          console.log('[AuthStateMachine] Merged usage data');
          localStorage.removeItem(STORAGE_KEYS.usage);
        }

        // Keep first build flag synced
        if (localStorage.getItem(STORAGE_KEYS.firstBuild)) {
          // Already marked in DB via usage merge
          localStorage.removeItem(STORAGE_KEYS.firstBuild);
        }

        console.log('[AuthStateMachine] localStorage merge complete');
      } catch (err) {
        console.error('[AuthStateMachine] Failed to merge localStorage:', err);
      }
    };

    mergeLocalStorage();
  }, [auth.lastEvent, auth.user]);
};


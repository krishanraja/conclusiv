import { useState, useEffect, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: Error | null;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    error: null,
  });

  // Track initialization state to prevent race conditions
  const initialSessionCheckedRef = useRef(false);
  const authStateReceivedRef = useRef(false);

  useEffect(() => {
    let retryCount = 0;
    let mounted = true;

    // Helper to check if auth is ready (both checks complete)
    const isAuthReady = () => initialSessionCheckedRef.current && authStateReceivedRef.current;

    const loadSession = async (): Promise<void> => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          // Retry on network errors or transient failures
          if (retryCount < MAX_RETRIES && (
            error.message.includes('fetch') || 
            error.message.includes('network') ||
            error.message.includes('timeout')
          )) {
            retryCount++;
            setTimeout(() => {
              if (mounted) loadSession();
            }, RETRY_DELAY * retryCount);
            return;
          }
          
          initialSessionCheckedRef.current = true;
          if (mounted) {
            setAuthState({
              session: null,
              user: null,
              // Only set isLoading to false if we've received at least one auth state event
              // OR if this is our final attempt (we need to show something)
              isLoading: !authStateReceivedRef.current,
              error: error,
            });
          }
          return;
        }

        initialSessionCheckedRef.current = true;
        if (mounted) {
          setAuthState({
            session: session,
            user: session?.user ?? null,
            // Only fully loaded when both session check AND auth state listener have fired
            isLoading: !authStateReceivedRef.current,
            error: null,
          });
        }
      } catch (err) {
        initialSessionCheckedRef.current = true;
        if (mounted) {
          setAuthState({
            session: null,
            user: null,
            isLoading: !authStateReceivedRef.current,
            error: err instanceof Error ? err : new Error('Failed to load session'),
          });
        }
      }
    };

    // Set up auth state listener FIRST
    // This listener fires on: INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        // Mark that we've received at least one auth state event
        authStateReceivedRef.current = true;
        
        // Now we can safely set isLoading to false if session was also checked
        setAuthState({
          session,
          user: session?.user ?? null,
          // Only set loading to false if initial session check is also complete
          isLoading: !initialSessionCheckedRef.current,
          error: null,
        });
      }
    );

    // THEN check for existing session with retry logic
    loadSession();

    // Safety timeout: ensure we don't stay in loading state forever
    // Increased to 10 seconds to allow for slower networks, but still prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      if (mounted && authState.isLoading) {
        console.warn('[useAuth] Safety timeout triggered after 10s - forcing loading state to false');
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
        }));
      }
    }, 10000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Email verification disabled - users are auto-confirmed
        emailRedirectTo: undefined,
        data: {
          display_name: displayName || email.split('@')[0],
        },
      },
    });
    
    // Profile creation is handled by the database trigger (handle_new_user)
    // which runs on auth.users INSERT. No client-side fallback needed.
    // See: supabase/migrations/consolidated_schema.sql
    
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=reset`,
    });
    return { data, error };
  };

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };
};

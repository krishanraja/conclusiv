import { useState, useEffect } from 'react';
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

  useEffect(() => {
    let retryCount = 0;
    let mounted = true;

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
          
          if (mounted) {
            setAuthState({
              session: null,
              user: null,
              isLoading: false,
              error: error,
            });
          }
          return;
        }

        if (mounted) {
          setAuthState({
            session: session,
            user: session?.user ?? null,
            isLoading: false,
            error: null,
          });
        }
      } catch (err) {
        if (mounted) {
          setAuthState({
            session: null,
            user: null,
            isLoading: false,
            error: err instanceof Error ? err : new Error('Failed to load session'),
          });
        }
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          setAuthState({
            session,
            user: session?.user ?? null,
            isLoading: false,
            error: null,
          });
        }
      }
    );

    // THEN check for existing session with retry logic
    loadSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
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

/**
 * AuthProvider
 * 
 * Provides authentication context to the app and handles:
 * - Session expiry notifications
 * - Auto-refresh of sessions
 * - LocalStorage merge on first auth
 * - Auth state machine integration
 */

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useAuthStateMachine, useLocalStorageMerge, AuthStateMachine } from '@/hooks/useAuthStateMachine';
import { useToast } from '@/hooks/use-toast';

// Create context
const AuthContext = createContext<AuthStateMachine | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuthStateMachine();
  const { toast } = useToast();
  const prevStateRef = useRef(auth.state);
  const hasShownExpiryToastRef = useRef(false);

  // Merge localStorage data on first authentication
  useLocalStorageMerge(auth);

  // Handle state transitions with toasts
  useEffect(() => {
    const prevState = prevStateRef.current;
    const currentState = auth.state;
    
    // Only show toasts on state changes
    if (prevState === currentState) return;
    prevStateRef.current = currentState;

    // Session expired notification
    if (currentState === 'session_expired' && !hasShownExpiryToastRef.current) {
      hasShownExpiryToastRef.current = true;
      toast({
        title: 'Session expired',
        description: 'Your session has expired. Please sign in again.',
        variant: 'destructive',
      });
      
      // Try to auto-refresh
      auth.refreshSession();
    }

    // Successfully refreshed
    if (prevState === 'session_expired' && currentState === 'authenticated') {
      hasShownExpiryToastRef.current = false;
      toast({
        title: 'Session restored',
        description: 'Your session has been refreshed.',
      });
    }

    // Signed out notification (only if was authenticated)
    if (prevState === 'authenticated' && currentState === 'signed_out') {
      toast({
        title: 'Signed out',
        description: 'You have been signed out successfully.',
      });
    }

    // Auth error notification
    if (auth.error && auth.lastEvent === 'AUTH_ERROR') {
      toast({
        title: 'Authentication error',
        description: auth.error.message,
        variant: 'destructive',
      });
    }
  }, [auth.state, auth.error, auth.lastEvent, auth.refreshSession, toast]);

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to access auth state machine from context
 * Throws if used outside of AuthProvider
 */
export const useAuth = (): AuthStateMachine => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

/**
 * Legacy hook compatibility layer
 * Maps the new state machine to the old useAuth interface
 * 
 * Use this for gradual migration - eventually all components should use
 * the new useAuth from AuthProvider directly
 */
export const useLegacyAuth = () => {
  const auth = useAuth();
  
  return {
    user: auth.user,
    session: auth.session,
    isLoading: auth.isLoading,
    error: auth.error,
    signUp: async (email: string, password: string, displayName?: string) => {
      const result = await auth.signUp(email, password, displayName);
      return {
        data: result.success ? { user: auth.user } : null,
        error: result.error ? new Error(result.error) : null,
      };
    },
    signIn: async (email: string, password: string) => {
      const result = await auth.signIn(email, password);
      return {
        data: result.success ? { user: auth.user, session: auth.session } : null,
        error: result.error ? new Error(result.error) : null,
      };
    },
    signOut: async () => {
      const result = await auth.signOut();
      return {
        error: result.error ? new Error(result.error) : null,
      };
    },
    resetPassword: async (email: string) => {
      const result = await auth.resetPassword(email);
      return {
        data: result.success ? {} : null,
        error: result.error ? new Error(result.error) : null,
      };
    },
  };
};


/**
 * AuthDebugPanel
 * 
 * Development-only component for debugging auth state.
 * Shows current auth state, session info, and allows manual state transitions.
 * 
 * Only renders in development mode (import.meta.env.DEV).
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, ChevronDown, ChevronUp, User, Clock, Key, Shield, RefreshCw, LogOut, AlertTriangle } from 'lucide-react';
import { useAuthStateMachine } from '@/hooks/useAuthStateMachine';
import { Button } from '@/components/ui/button';

// State color mapping for visual debugging
const stateColors: Record<string, string> = {
  anonymous: 'bg-gray-500',
  anonymous_with_progress: 'bg-yellow-500',
  authenticating: 'bg-blue-500',
  authenticated: 'bg-green-500',
  session_expired: 'bg-orange-500',
  signed_out: 'bg-red-500',
};

export const AuthDebugPanel = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const auth = useAuthStateMachine();

  // Only render in development
  if (!import.meta.env.DEV) {
    return null;
  }

  const sessionExpiresAt = auth.session?.expires_at 
    ? new Date(auth.session.expires_at * 1000) 
    : null;
  
  const sessionExpiresIn = sessionExpiresAt 
    ? Math.max(0, Math.floor((sessionExpiresAt.getTime() - Date.now()) / 1000))
    : null;

  const formatExpiresIn = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="fixed bottom-4 left-4 z-[9999] font-mono text-xs">
      {/* Collapsed badge */}
      <AnimatePresence mode="wait">
        {!isExpanded && (
          <motion.button
            key="collapsed"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg shadow-lg hover:bg-muted transition-colors"
          >
            <Bug className="w-4 h-4 text-primary" />
            <span className={`w-2 h-2 rounded-full ${stateColors[auth.state]}`} />
            <span className="text-muted-foreground">{auth.state}</span>
            <ChevronUp className="w-3 h-3 text-muted-foreground" />
          </motion.button>
        )}

        {isExpanded && (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-80 bg-card border border-border rounded-lg shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 bg-muted/50 border-b border-border">
              <div className="flex items-center gap-2">
                <Bug className="w-4 h-4 text-primary" />
                <span className="font-semibold text-foreground">Auth Debug</span>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 rounded hover:bg-muted transition-colors"
              >
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* State indicator */}
            <div className="p-3 border-b border-border">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">State</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${stateColors[auth.state]}`} />
                <span className="text-foreground font-medium">{auth.state}</span>
              </div>
              {auth.lastEvent && (
                <div className="text-muted-foreground mt-1">
                  Last event: <span className="text-foreground">{auth.lastEvent}</span>
                </div>
              )}
            </div>

            {/* User info */}
            <div className="p-3 border-b border-border">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">User</span>
              </div>
              {auth.user ? (
                <div className="space-y-1">
                  <div className="text-foreground truncate">{auth.user.email}</div>
                  <div className="text-muted-foreground text-[10px] truncate">
                    ID: {auth.user.id}
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground">No user</div>
              )}
            </div>

            {/* Session info */}
            <div className="p-3 border-b border-border">
              <div className="flex items-center gap-2 mb-2">
                <Key className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Session</span>
              </div>
              {auth.session ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-foreground">
                      Expires in: {sessionExpiresIn !== null ? formatExpiresIn(sessionExpiresIn) : 'Unknown'}
                    </span>
                  </div>
                  <div className="text-muted-foreground text-[10px]">
                    Token: {auth.session.access_token.slice(0, 20)}...
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground">No session</div>
              )}
            </div>

            {/* Flags */}
            <div className="p-3 border-b border-border">
              <div className="space-y-1 text-[10px]">
                <div className="flex items-center justify-between">
                  <span>isLoading</span>
                  <span className={auth.isLoading ? 'text-yellow-500' : 'text-muted-foreground'}>
                    {String(auth.isLoading)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>hasLocalProgress</span>
                  <span className={auth.hasLocalProgress ? 'text-primary' : 'text-muted-foreground'}>
                    {String(auth.hasLocalProgress)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>isAuthenticated</span>
                  <span className={auth.isAuthenticated ? 'text-green-500' : 'text-muted-foreground'}>
                    {String(auth.isAuthenticated)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>canAccessProtectedRoutes</span>
                  <span className={auth.canAccessProtectedRoutes ? 'text-green-500' : 'text-muted-foreground'}>
                    {String(auth.canAccessProtectedRoutes)}
                  </span>
                </div>
              </div>
            </div>

            {/* Error */}
            {auth.error && (
              <div className="p-3 border-b border-border bg-destructive/10">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{auth.error.message}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="p-3 space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs"
                onClick={() => auth.refreshSession()}
                disabled={!auth.session}
              >
                <RefreshCw className="w-3 h-3 mr-2" />
                Refresh Session
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs text-destructive hover:text-destructive"
                onClick={() => auth.signOut()}
                disabled={!auth.isAuthenticated}
              >
                <LogOut className="w-3 h-3 mr-2" />
                Sign Out
              </Button>
            </div>

            {/* LocalStorage viewer */}
            <div className="p-3 bg-muted/30">
              <div className="text-muted-foreground mb-2">LocalStorage Keys</div>
              <div className="space-y-1 text-[10px]">
                {['conclusiv_onboarding', 'conclusiv_usage', 'conclusiv_first_build_completed', 'conclusiv_subscription'].map(key => {
                  const value = localStorage.getItem(key);
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-muted-foreground truncate max-w-[60%]">{key.replace('conclusiv_', '')}</span>
                      <span className={value ? 'text-primary' : 'text-muted-foreground'}>
                        {value ? 'set' : 'empty'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


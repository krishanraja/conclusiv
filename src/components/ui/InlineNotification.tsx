/**
 * InlineNotification - A professional, non-intrusive notification system
 * Replaces toast popups with subtle inline feedback
 */

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle, Info, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';
import { setNotificationCallback } from '@/hooks/use-toast';

// ============================================================================
// Types
// ============================================================================

type NotificationType = 'success' | 'error' | 'info' | 'loading';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

interface NotificationContextType {
  notify: (type: NotificationType, message: string, duration?: number) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
  success: (message: string) => string;
  error: (message: string) => string;
  info: (message: string) => string;
  loading: (message: string) => string;
}

// ============================================================================
// Context
// ============================================================================

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

// ============================================================================
// Provider
// ============================================================================

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const haptics = useHaptics();

  const notify = useCallback((type: NotificationType, message: string, duration = 3000) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Haptic feedback based on type
    if (type === 'success') haptics.success();
    else if (type === 'error') haptics.error();
    else haptics.light();

    setNotifications(prev => [...prev, { id, type, message, duration }]);

    // Auto-dismiss after duration (except for loading)
    if (type !== 'loading' && duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, duration);
    }

    return id;
  }, [haptics]);

  // Connect toast compatibility layer
  useEffect(() => {
    setNotificationCallback((type, message) => {
      notify(type, message);
    });
    return () => {
      setNotificationCallback(null);
    };
  }, [notify]);

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const value: NotificationContextType = {
    notify,
    dismiss,
    dismissAll,
    success: (message) => notify('success', message),
    error: (message) => notify('error', message, 5000),
    info: (message) => notify('info', message),
    loading: (message) => notify('loading', message, 0),
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer notifications={notifications} onDismiss={dismiss} />
    </NotificationContext.Provider>
  );
};

// ============================================================================
// Notification Container
// ============================================================================

interface NotificationContainerProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

const NotificationContainer = ({ notifications, onDismiss }: NotificationContainerProps) => {
  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.slice(-3).map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onDismiss={() => onDismiss(notification.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// Individual Notification
// ============================================================================

interface NotificationItemProps {
  notification: Notification;
  onDismiss: () => void;
}

const NotificationItem = ({ notification, onDismiss }: NotificationItemProps) => {
  const { type, message } = notification;

  const icons: Record<NotificationType, ReactNode> = {
    success: <Check className="w-4 h-4" />,
    error: <AlertCircle className="w-4 h-4" />,
    info: <Info className="w-4 h-4" />,
    loading: <Loader2 className="w-4 h-4 animate-spin" />,
  };

  const styles: Record<NotificationType, string> = {
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    error: 'bg-red-500/10 border-red-500/30 text-red-400',
    info: 'bg-primary/10 border-primary/30 text-primary',
    loading: 'bg-muted border-border text-muted-foreground',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={cn(
        "pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-full border shadow-lg backdrop-blur-md max-w-[90vw]",
        styles[type]
      )}
    >
      <span className="flex-shrink-0">{icons[type]}</span>
      <span className="text-sm font-medium truncate">{message}</span>
      {type !== 'loading' && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-0.5 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </motion.div>
  );
};

// ============================================================================
// Standalone Inline Status Component
// For embedding directly in UI rather than global notifications
// ============================================================================

interface InlineStatusProps {
  type: NotificationType;
  message: string;
  className?: string;
  onDismiss?: () => void;
}

export const InlineStatus = ({ type, message, className, onDismiss }: InlineStatusProps) => {
  const icons: Record<NotificationType, ReactNode> = {
    success: <Check className="w-4 h-4" />,
    error: <AlertCircle className="w-4 h-4" />,
    info: <Info className="w-4 h-4" />,
    loading: <Loader2 className="w-4 h-4 animate-spin" />,
  };

  const styles: Record<NotificationType, string> = {
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    error: 'bg-red-500/10 border-red-500/20 text-red-400',
    info: 'bg-primary/10 border-primary/20 text-primary',
    loading: 'bg-muted/50 border-border text-muted-foreground',
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm",
        styles[type],
        className
      )}
    >
      <span className="flex-shrink-0">{icons[type]}</span>
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-0.5 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </motion.div>
  );
};

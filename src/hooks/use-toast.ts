/**
 * useToast - Compatibility layer that bridges old toast API to inline notifications
 * 
 * DEPRECATED: This hook now uses the inline notification system.
 * For new code, use useNotification from @/components/ui/InlineNotification
 */

import * as React from "react";

// Simple notification state that doesn't show toasts
// but maintains API compatibility
interface ToastState {
  toasts: never[];
}

const emptyState: ToastState = { toasts: [] };

interface ToastProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: 'default' | 'destructive';
}

// Global notification callback - will be connected to NotificationProvider
let notificationCallback: ((type: 'success' | 'error' | 'info', message: string) => void) | null = null;

export const setNotificationCallback = (cb: typeof notificationCallback) => {
  notificationCallback = cb;
};

function toast(props: ToastProps) {
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Convert toast to notification
  const message = props.title 
    ? `${props.title}${props.description ? `: ${props.description}` : ''}`
    : String(props.description || '');
    
  const type = props.variant === 'destructive' ? 'error' : 'info';
  
  // Log to console for debugging (silent fallback when NotificationProvider not available)
  if (notificationCallback) {
    notificationCallback(type, message);
  } else {
    // Silent - no toasts, no console spam
    // The UI will show status through other means (inline status, etc.)
  }
  
  return {
    id,
    dismiss: () => {},
    update: () => {},
  };
}

function useToast() {
  return {
    ...emptyState,
    toast,
    dismiss: () => {},
  };
}

export { useToast, toast };

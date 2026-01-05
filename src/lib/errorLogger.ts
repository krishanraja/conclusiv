import { supabase } from "@/integrations/supabase/client";

export interface ErrorLog {
  error_message: string;
  error_stack?: string;
  error_name?: string;
  component_name?: string;
  user_agent?: string;
  url?: string;
  user_id?: string;
  error_id?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Logs client-side errors to Supabase for monitoring
 * Falls back silently if logging fails to prevent error loops
 */
export const logError = async (error: Error | string, context?: {
  component?: string;
  errorId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> => {
  try {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'string' ? undefined : error.stack;
    const errorName = typeof error === 'string' ? 'Unknown' : error.name;

    // Get user ID if available
    const { data: { user } } = await supabase.auth.getUser();
    
    const errorLog: ErrorLog = {
      error_message: errorMessage,
      error_stack: errorStack,
      error_name: errorName,
      component_name: context?.component,
      user_agent: navigator.userAgent,
      url: window.location.href,
      user_id: user?.id,
      error_id: context?.errorId,
      metadata: context?.metadata,
    };

    // Try to log to Supabase (if table exists)
    // This will fail silently if the table doesn't exist, which is fine
    try {
      await supabase.from('error_logs').insert([errorLog]);
    } catch (dbError) {
      // Table might not exist - that's okay, we'll just log to console
      console.warn('[errorLogger] Could not log to database:', dbError);
    }

    // Always log to console for development
    if (process.env.NODE_ENV === 'development') {
      console.group('🔴 Error Logged');
      console.log('Message:', errorMessage);
      console.log('Component:', context?.component || 'Unknown');
      console.log('Error ID:', context?.errorId);
      console.log('Metadata:', context?.metadata);
      console.groupEnd();
    }
  } catch (logError) {
    // Silently fail to prevent error loops
    console.warn('[errorLogger] Failed to log error:', logError);
  }
};

/**
 * Logs API/network errors with additional context
 */
export const logAPIError = async (
  endpoint: string,
  error: Error | string,
  requestData?: Record<string, unknown>
): Promise<void> => {
  await logError(typeof error === 'string' ? new Error(error) : error, {
    component: 'API',
    metadata: {
      endpoint,
      requestData,
      timestamp: new Date().toISOString(),
    },
  });
};

/**
 * Sets up global error handlers for unhandled errors
 */
export const setupGlobalErrorHandlers = (): (() => void) => {
  // Handle unhandled promise rejections
  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    logError(
      event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason)),
      {
        component: 'Global',
        metadata: {
          type: 'unhandledRejection',
        },
      }
    );
  };

  // Handle uncaught errors
  const handleError = (event: ErrorEvent) => {
    logError(
      new Error(event.message),
      {
        component: 'Global',
        metadata: {
          type: 'uncaughtError',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      }
    );
  };

  window.addEventListener('unhandledrejection', handleUnhandledRejection);
  window.addEventListener('error', handleError);

  // Return cleanup function
  return () => {
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    window.removeEventListener('error', handleError);
  };
};

/**
 * Structured Logging Utility
 * 
 * Provides consistent logging format with session tracking.
 * Format: { level, message, context, timestamp, sessionId }
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context: LogContext;
  timestamp: string;
  sessionId: string;
}

// Session ID management
const getSessionId = (): string => {
  if (typeof window === 'undefined') return 'server';
  
  let sessionId = sessionStorage.getItem('log_session_id');
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('log_session_id', sessionId);
  }
  return sessionId;
};

// Check if we're in development mode
const isDev = (): boolean => {
  return import.meta.env.DEV || import.meta.env.MODE === 'development';
};

// Format and output log entry
const log = (level: LogLevel, message: string, context: LogContext = {}): LogEntry => {
  const entry: LogEntry = {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
  };

  // Console output based on level
  const formattedMessage = `[${entry.level.toUpperCase()}] ${entry.message}`;
  
  switch (level) {
    case 'debug':
      if (isDev()) {
        console.debug(formattedMessage, entry);
      }
      break;
    case 'info':
      console.info(formattedMessage, entry);
      break;
    case 'warn':
      console.warn(formattedMessage, entry);
      break;
    case 'error':
      console.error(formattedMessage, entry);
      break;
  }

  return entry;
};

// Public API
export const logger = {
  debug: (message: string, context?: LogContext) => log('debug', message, context),
  info: (message: string, context?: LogContext) => log('info', message, context),
  warn: (message: string, context?: LogContext) => log('warn', message, context),
  error: (message: string, context?: LogContext) => log('error', message, context),
  
  // Get current session ID for correlation
  getSessionId,
  
  // Log with explicit error object handling
  logError: (message: string, error: unknown, context?: LogContext) => {
    const errorContext: LogContext = {
      ...context,
      error: error instanceof Error 
        ? { name: error.name, message: error.message, stack: error.stack }
        : error,
    };
    return log('error', message, errorContext);
  },

  // Log API call with timing
  logApiCall: (endpoint: string, method: string, context?: LogContext) => {
    return log('info', `API Call: ${method} ${endpoint}`, { endpoint, method, ...context });
  },

  // Log user action
  logAction: (action: string, context?: LogContext) => {
    return log('info', `User Action: ${action}`, { action, ...context });
  },
};

export type { LogLevel, LogContext, LogEntry };

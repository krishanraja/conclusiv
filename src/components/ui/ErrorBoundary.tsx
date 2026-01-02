import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, RotateCcw } from "lucide-react";
import { Button } from "./button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /** Optional name for better error tracking */
  name?: string;
  /** If true, shows a compact inline error instead of full-page */
  inline?: boolean;
  /** Callback when error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

// Generate a unique error ID for tracking
const generateErrorId = () => `err_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// Store recent errors for debugging
const recentErrors: { id: string; error: string; stack?: string; component?: string; timestamp: number }[] = [];
const MAX_STORED_ERRORS = 10;

export const getRecentErrors = () => [...recentErrors];
export const clearRecentErrors = () => { recentErrors.length = 0; };

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorId: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error, errorId: generateErrorId() };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { name, onError } = this.props;
    const errorId = this.state.errorId || generateErrorId();
    
    // Enhanced logging with structured data
    console.error(`[ErrorBoundary${name ? `:${name}` : ''}] Error ID: ${errorId}`);
    console.error('[ErrorBoundary] Error:', error.message);
    console.error('[ErrorBoundary] Stack:', error.stack);
    console.error('[ErrorBoundary] Component Stack:', errorInfo.componentStack);
    
    // Store error for debugging
    recentErrors.unshift({
      id: errorId,
      error: error.message,
      stack: error.stack,
      component: errorInfo.componentStack?.split('\n')[1]?.trim(),
      timestamp: Date.now(),
    });
    if (recentErrors.length > MAX_STORED_ERRORS) {
      recentErrors.pop();
    }
    
    this.setState({ errorInfo, errorId });
    
    // Call optional error callback
    onError?.(error, errorInfo);
    
    // Log to console in a way that's easy to copy
    console.group(`🔴 Error Report (${errorId})`);
    console.log('Message:', error.message);
    console.log('Name:', name || 'Root');
    console.log('Time:', new Date().toISOString());
    console.groupEnd();
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, errorId: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Inline/compact error display for component-level boundaries
      if (this.props.inline) {
        return (
          <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {this.props.name ? `${this.props.name} failed to load` : 'Something went wrong'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {this.state.error?.message || 'An unexpected error occurred'}
                </p>
                {this.state.errorId && (
                  <p className="text-[10px] text-muted-foreground/60 mt-1 font-mono">
                    Error ID: {this.state.errorId}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={this.handleReset}
                className="shrink-0 h-8 px-2"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="w-full max-w-md text-center space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <h1 className="text-xl font-semibold text-foreground">
                Something went wrong
              </h1>
              <p className="text-sm text-muted-foreground">
                We're sorry, but something unexpected happened. Please try refreshing the page.
              </p>
              {this.state.errorId && (
                <p className="text-xs text-muted-foreground/60 font-mono">
                  Error ID: {this.state.errorId}
                </p>
              )}
            </div>

            {/* Error details (development only) */}
            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="text-left p-4 rounded-lg bg-muted/50 border border-border overflow-auto max-h-40">
                <p className="text-xs font-mono text-destructive break-all">
                  {this.state.error.message}
                </p>
                {this.state.errorInfo && (
                  <pre className="text-xs font-mono text-muted-foreground mt-2 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack?.slice(0, 500)}
                  </pre>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Button onClick={this.handleReload} variant="shimmer" className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Page
              </Button>
              <Button onClick={this.handleGoHome} variant="outline" className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Go to Home
              </Button>
            </div>

            {/* Help */}
            <p className="text-xs text-muted-foreground">
              If this problem persists,{" "}
              <a href="/contact" className="text-primary hover:underline">
                contact support
              </a>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * A lightweight error boundary for wrapping individual components/sections.
 * Shows inline error with retry option instead of full-page error.
 */
export const SectionErrorBoundary = ({ 
  children, 
  name,
  onError,
}: { 
  children: ReactNode; 
  name: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}) => (
  <ErrorBoundary name={name} inline onError={onError}>
    {children}
  </ErrorBoundary>
);

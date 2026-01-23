'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { loggerUtils } from '@/lib/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  resetKeys?: Array<string | number>
  resetOnPropsChange?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
}

/**
 * Error Boundary component to catch React errors
 * 
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate a unique error ID for tracking
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    return {
      hasError: true,
      error,
      errorId,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo,
    })

    // Report error
    this.reportError(error, errorInfo)

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props
    const { hasError } = this.state

    // Reset error boundary if resetKeys change
    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
      )

      if (hasResetKeyChanged) {
        this.resetErrorBoundary()
      }
    }

    // Reset on any prop change if enabled
    if (hasError && resetOnPropsChange && prevProps !== this.props) {
      this.resetErrorBoundary()
    }
  }

  reportError = (error: Error, errorInfo: ErrorInfo) => {
    const { errorId } = this.state

    // Log error with structured logging
    loggerUtils.logError(error, {
      errorId,
      componentStack: errorInfo.componentStack,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      type: 'react_error_boundary',
    })
    
    // TODO: Integrate with error reporting service (e.g., Sentry, LogRocket, etc.)
    // Example:
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error, {
    //     contexts: {
    //       react: {
    //         componentStack: errorInfo.componentStack,
    //       },
    //     },
    //     tags: {
    //       errorId,
    //     },
    //   })
    // }
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    })
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard'
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
              <CardDescription>
                We encountered an unexpected error. Don't worry, your data is safe.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="rounded-lg bg-muted p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Bug className="h-4 w-4" />
                    <span className="text-sm font-semibold">Development Error Details</span>
                  </div>
                  <pre className="overflow-auto text-xs">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error.toString()}
                    </div>
                    {this.state.error.stack && (
                      <div className="mb-2">
                        <strong>Stack:</strong>
                        <pre className="mt-1 whitespace-pre-wrap">{this.state.error.stack}</pre>
                      </div>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 whitespace-pre-wrap text-xs">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </pre>
                </div>
              )}

              {this.state.errorId && (
                <div className="text-sm text-muted-foreground">
                  Error ID: <code className="rounded bg-muted px-1 py-0.5">{this.state.errorId}</code>
                </div>
              )}

              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <p className="text-sm">
                  If this problem persists, please contact support with the error ID above.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={this.resetErrorBoundary}
                className="flex-1"
                variant="default"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button
                onClick={this.handleReload}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload Page
              </Button>
              <Button
                onClick={this.handleGoHome}
                variant="ghost"
                className="flex-1"
              >
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Button>
            </CardFooter>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Higher-order component to wrap a component with ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`

  return WrappedComponent
}

/**
 * Hook to manually trigger error boundary (for testing or manual error handling)
 */
export function useErrorHandler() {
  return React.useCallback((error: Error, errorInfo?: ErrorInfo) => {
    // This will be caught by the nearest ErrorBoundary
    throw error
  }, [])
}

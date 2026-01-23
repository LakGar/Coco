'use client'

import { ErrorBoundary } from './error-boundary'

interface ErrorBoundaryWrapperProps {
  children: React.ReactNode
}

/**
 * Client component wrapper for ErrorBoundary
 * Use this in Server Components (like layouts)
 */
export function ErrorBoundaryWrapper({ children }: ErrorBoundaryWrapperProps) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Additional error reporting can be added here
        // This runs in addition to the default error reporting
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

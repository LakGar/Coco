import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary, withErrorBoundary, useErrorHandler } from '@/components/error-boundary'

// Component that throws an error
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

// Mock console.error to avoid noise in tests
const originalError = console.error
beforeAll(() => {
  console.error = jest.fn()
})

afterAll(() => {
  console.error = originalError
})

describe('ErrorBoundary', () => {
  test('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  test('catches errors and displays fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
    expect(screen.getByText(/We encountered an unexpected error/i)).toBeInTheDocument()
  })

  test('shows error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText(/Development Error Details/i)).toBeInTheDocument()
    // Use getAllByText since "Test error" appears multiple times (error message and stack trace)
    const errorTexts = screen.getAllByText(/Test error/i)
    expect(errorTexts.length).toBeGreaterThan(0)

    process.env.NODE_ENV = originalEnv
  })

  test('hides error details in production mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.queryByText(/Development Error Details/i)).not.toBeInTheDocument()
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()

    process.env.NODE_ENV = originalEnv
  })

  test('displays error ID', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText(/Error ID:/i)).toBeInTheDocument()
  })

  test('reset button clears error state', () => {
    const TestComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) {
        throw new Error('Test error')
      }
      return <div>No error</div>
    }

    const { rerender } = render(
      <ErrorBoundary>
        <TestComponent shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()

    const resetButton = screen.getByRole('button', { name: /Try Again/i })
    
    // Click reset button - this should reset the error boundary state
    fireEvent.click(resetButton)

    // Re-render with no error - the error boundary should now render children
    rerender(
      <ErrorBoundary>
        <TestComponent shouldThrow={false} />
      </ErrorBoundary>
    )

    // After reset, the error boundary should render children normally
    expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument()
    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  test('calls onError callback when error occurs', () => {
    const onError = jest.fn()

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(onError).toHaveBeenCalled()
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    )
  })

  test('resets on resetKeys change', () => {
    const { rerender } = render(
      <ErrorBoundary resetKeys={['key1']}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()

    // Change resetKeys
    rerender(
      <ErrorBoundary resetKeys={['key2']}>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument()
  })

  test('uses custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom error message')).toBeInTheDocument()
    expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument()
  })
})

describe('withErrorBoundary HOC', () => {
  test('wraps component with ErrorBoundary', () => {
    const TestComponent = () => <div>Test</div>
    const WrappedComponent = withErrorBoundary(TestComponent)

    render(<WrappedComponent />)

    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  test('catches errors in wrapped component', () => {
    const TestComponent = () => {
      throw new Error('Component error')
    }
    const WrappedComponent = withErrorBoundary(TestComponent)

    render(<WrappedComponent />)

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
  })
})

describe('useErrorHandler hook', () => {
  test('throws error when called', () => {
    const TestComponent = () => {
      const handleError = useErrorHandler()
      
      React.useEffect(() => {
        handleError(new Error('Hook error'))
      }, [handleError])

      return <div>Test</div>
    }

    render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
  })
})

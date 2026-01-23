import { NextResponse } from 'next/server'
import { log, loggerUtils } from './logger'

/**
 * Environment detection
 */
const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

/**
 * Error types for categorization
 */
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT',
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK',
  INTERNAL = 'INTERNAL',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Standardized error response structure
 */
export interface ErrorResponse {
  error: string
  message?: string
  details?: string | Record<string, unknown>
  code?: string
  timestamp?: string
}

/**
 * Error context for logging
 */
export interface ErrorContext {
  userId?: string
  teamId?: string
  endpoint?: string
  method?: string
  [key: string]: unknown
}

/**
 * Sanitizes error messages based on environment
 */
function sanitizeErrorMessage(error: unknown, errorType: ErrorType): string {
  if (isDevelopment) {
    // In development, show full error messages
    if (error instanceof Error) {
      return error.message
    }
    return String(error)
  }

  // In production, return safe, user-friendly messages
  switch (errorType) {
    case ErrorType.VALIDATION:
      return 'Invalid input provided'
    case ErrorType.AUTHENTICATION:
      return 'Authentication required'
    case ErrorType.AUTHORIZATION:
      return 'Insufficient permissions'
    case ErrorType.NOT_FOUND:
      return 'Resource not found'
    case ErrorType.RATE_LIMIT:
      return 'Too many requests. Please try again later.'
    case ErrorType.DATABASE:
      return 'Database operation failed'
    case ErrorType.NETWORK:
      return 'Network error occurred'
    case ErrorType.INTERNAL:
      return 'An internal error occurred'
    default:
      return 'An error occurred'
  }
}

/**
 * Extracts safe error details for response
 */
function getErrorDetails(error: unknown, errorType: ErrorType): string | Record<string, unknown> | undefined {
  if (isDevelopment) {
    // In development, include full error details
    if (error instanceof Error) {
      return {
        message: error.message,
        stack: error.stack,
        name: error.name,
      }
    }
    return String(error)
  }

  // In production, only include safe details
  switch (errorType) {
    case ErrorType.VALIDATION:
      // Validation errors are safe to show in production
      if (error && typeof error === 'object' && 'issues' in error) {
        return error as Record<string, unknown>
      }
      return undefined
    case ErrorType.RATE_LIMIT:
      // Rate limit errors can include retry information
      return undefined
    default:
      // Don't expose internal error details in production
      return undefined
  }
}

/**
 * Determines error type from error instance
 */
function determineErrorType(error: unknown): ErrorType {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    const name = error.name.toLowerCase()

    if (name.includes('zod') || message.includes('validation')) {
      return ErrorType.VALIDATION
    }
    if (message.includes('unauthorized') || message.includes('authentication')) {
      return ErrorType.AUTHENTICATION
    }
    if (message.includes('forbidden') || message.includes('permission')) {
      return ErrorType.AUTHORIZATION
    }
    if (message.includes('not found')) {
      return ErrorType.NOT_FOUND
    }
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return ErrorType.RATE_LIMIT
    }
    if (message.includes('prisma') || message.includes('database')) {
      return ErrorType.DATABASE
    }
    if (message.includes('network') || message.includes('fetch')) {
      return ErrorType.NETWORK
    }
  }

  return ErrorType.UNKNOWN
}

/**
 * Logs error with context
 */
function logError(
  error: unknown,
  errorType: ErrorType,
  context?: ErrorContext
): void {
  loggerUtils.logError(error, {
    errorType,
    ...context,
  })
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  error: unknown,
  status: number = 500,
  errorType?: ErrorType,
  context?: ErrorContext
): NextResponse<ErrorResponse> {
  const type = errorType || determineErrorType(error)
  const message = sanitizeErrorMessage(error, type)
  const details = getErrorDetails(error, type)

  // Log the error
  logError(error, type, context)

  // Build response
  const response: ErrorResponse = {
    error: message,
    ...(details && { details }),
    code: type,
    timestamp: new Date().toISOString(),
  }

  // Add message field for consistency
  if (message !== response.error) {
    response.message = message
  }

  return NextResponse.json(response, { status })
}

/**
 * Helper for validation errors
 */
export function createValidationErrorResponse(
  error: unknown,
  context?: ErrorContext
): NextResponse<ErrorResponse> {
  return createErrorResponse(error, 400, ErrorType.VALIDATION, context)
}

/**
 * Helper for authentication errors
 */
export function createAuthenticationErrorResponse(
  message: string = 'Authentication required',
  context?: ErrorContext
): NextResponse<ErrorResponse> {
  return createErrorResponse(new Error(message), 401, ErrorType.AUTHENTICATION, context)
}

/**
 * Helper for authorization errors
 */
export function createAuthorizationErrorResponse(
  message: string = 'Insufficient permissions',
  context?: ErrorContext
): NextResponse<ErrorResponse> {
  return createErrorResponse(new Error(message), 403, ErrorType.AUTHORIZATION, context)
}

/**
 * Helper for not found errors
 */
export function createNotFoundErrorResponse(
  resource: string = 'Resource',
  context?: ErrorContext
): NextResponse<ErrorResponse> {
  return createErrorResponse(
    new Error(`${resource} not found`),
    404,
    ErrorType.NOT_FOUND,
    context
  )
}

/**
 * Helper for rate limit errors
 */
export function createRateLimitErrorResponse(
  context?: ErrorContext
): NextResponse<ErrorResponse> {
  return createErrorResponse(
    new Error('Rate limit exceeded'),
    429,
    ErrorType.RATE_LIMIT,
    context
  )
}

/**
 * Helper for internal server errors
 */
export function createInternalErrorResponse(
  error: unknown,
  context?: ErrorContext
): NextResponse<ErrorResponse> {
  return createErrorResponse(error, 500, ErrorType.INTERNAL, context)
}

/**
 * Wrapper for async route handlers with error handling
 */
export function withErrorHandler<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>,
  context?: ErrorContext
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      return createInternalErrorResponse(error, context)
    }
  }
}

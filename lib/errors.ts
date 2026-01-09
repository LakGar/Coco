/**
 * Error handling utilities for server actions and API routes
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, "AUTHENTICATION_ERROR", 401);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Insufficient permissions") {
    super(message, "AUTHORIZATION_ERROR", 403);
    this.name = "AuthorizationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Rate limit exceeded") {
    super(message, "RATE_LIMIT_EXCEEDED", 429);
    this.name = "RateLimitError";
  }
}

/**
 * Format error for client response
 */
export function formatError(error: unknown): {
  error: string;
  code?: string;
  statusCode: number;
} {
  if (error instanceof AppError) {
    return {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
    };
  }

  if (error instanceof Error) {
    // Don't expose internal errors in production
    if (process.env.NODE_ENV === "production") {
      return {
        error: "An error occurred",
        code: "INTERNAL_ERROR",
        statusCode: 500,
      };
    }
    return {
      error: error.message,
      code: "INTERNAL_ERROR",
      statusCode: 500,
    };
  }

  return {
    error: "An unknown error occurred",
    code: "UNKNOWN_ERROR",
    statusCode: 500,
  };
}

/**
 * Type-safe result wrapper for server actions
 */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string; statusCode: number };

/**
 * Wrap async server action with error handling
 */
export async function actionHandler<T>(
  fn: () => Promise<T>
): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    const formatted = formatError(error);
    return {
      success: false,
      error: formatted.error,
      code: formatted.code,
      statusCode: formatted.statusCode,
    };
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { AccessLevel } from '@prisma/client'
import {
  requireTeamAccess,
  extractTeamId,
  isAuthError,
  type AuthResult,
} from './auth-middleware'
import {
  rateLimit,
  addRateLimitHeaders,
  type RateLimitResult,
} from './rate-limit'
import {
  validateRequest,
} from './validations'
import {
  createValidationErrorResponse,
  createRateLimitErrorResponse,
  createInternalErrorResponse,
  type ErrorContext,
} from './error-handler'

/**
 * Context passed to route handlers
 */
export interface RouteContext {
  user: AuthResult['user']
  teamId: string
  membership: {
    id: string
    teamId: string
    userId: string | null
    teamRole: string
    isAdmin: boolean
    accessLevel: AccessLevel
  }
  rateLimitResult: RateLimitResult
}

/**
 * Route handler function type
 */
export type RouteHandler<T = any> = (
  req: Request | NextRequest,
  context: RouteContext & { validatedData?: any },
  params: Record<string, string>
) => Promise<NextResponse<T>>

/**
 * Options for creating an API route handler
 */
export interface RouteHandlerOptions {
  /**
   * Required access level (default: 'FULL' for write, 'READ_ONLY' for read)
   */
  requiredAccessLevel?: AccessLevel
  /**
   * Validation schema for request body (optional)
   */
  schema?: z.ZodSchema<any>
  /**
   * HTTP method for rate limiting
   */
  method?: string
  /**
   * Custom error context
   */
  errorContext?: Partial<ErrorContext>
}

/**
 * Creates a route handler with built-in auth, rate limiting, validation, and error handling
 * 
 * @example
 * ```typescript
 * export const GET = createRouteHandler(
 *   async (req, context, params) => {
 *     const { teamId, user } = context
 *     // Your handler logic here
 *     return NextResponse.json({ data: 'result' })
 *   },
 *   { requiredAccessLevel: 'READ_ONLY', method: 'GET' }
 * )
 * ```
 */
export function createRouteHandler<T = any>(
  handler: RouteHandler<T>,
  options: RouteHandlerOptions = {}
): (
  req: Request | NextRequest,
  params: { teamId: string } | Promise<{ teamId: string }> | Record<string, string> | Promise<Record<string, string>>
) => Promise<NextResponse> {
  const {
    requiredAccessLevel = 'FULL',
    schema,
    method = 'GET',
    errorContext = {},
  } = options

  return async (req, params) => {
    try {
      // Extract teamId from params (handles both sync and async)
      const resolvedParams = params instanceof Promise ? await params : params
      const teamId = 'teamId' in resolvedParams 
        ? resolvedParams.teamId 
        : resolvedParams as any as string

      // Check authorization
      const authResult = await requireTeamAccess(teamId, requiredAccessLevel)

      if (isAuthError(authResult)) {
        return authResult.response
      }

      const { user, membership } = authResult

      // Rate limiting
      const rateLimitResult = await rateLimit(
        req as Request,
        method,
        user.clerkId || user.id
      )

      if (!rateLimitResult.success) {
        const response = createRateLimitErrorResponse({
          endpoint: errorContext.endpoint || req.url,
          method,
          teamId,
          userId: user.id,
          ...errorContext,
        })
        addRateLimitHeaders(
          response.headers,
          rateLimitResult.limit,
          rateLimitResult.remaining,
          rateLimitResult.reset
        )
        return response
      }

      // Validate request body if schema provided
      let validatedData: any = undefined
      if (schema) {
        const validation = await validateRequest(req as Request, schema)
        if (validation.error) {
          return createValidationErrorResponse(validation.error, {
            endpoint: errorContext.endpoint || req.url,
            method,
            teamId,
            userId: user.id,
            ...errorContext,
          })
        }
        validatedData = validation.data
      }

      // Create context for handler
      const context: RouteContext & { validatedData?: any } = {
        user,
        teamId,
        membership,
        rateLimitResult,
        ...(validatedData !== undefined && { validatedData }),
      }

      // Call the handler
      const response = await handler(req, context, resolvedParams as Record<string, string>)

      // Add rate limit headers to response
      if (response instanceof NextResponse) {
        addRateLimitHeaders(
          response.headers,
          rateLimitResult.limit,
          rateLimitResult.remaining,
          rateLimitResult.reset
        )
      }

      return response
    } catch (error) {
      const resolvedParams = params instanceof Promise ? await params : params
      const teamId = 'teamId' in resolvedParams 
        ? resolvedParams.teamId 
        : (resolvedParams as any as string)

      return createInternalErrorResponse(error, {
        endpoint: errorContext.endpoint || (req as Request).url,
        method,
        teamId,
        ...errorContext,
      })
    }
  }
}

/**
 * Helper to add rate limit headers to a response
 */
export function withRateLimitHeaders(
  response: NextResponse,
  rateLimitResult: RateLimitResult
): NextResponse {
  addRateLimitHeaders(
    response.headers,
    rateLimitResult.limit,
    rateLimitResult.remaining,
    rateLimitResult.reset
  )
  return response
}

/**
 * Helper to create a successful JSON response with rate limit headers
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200,
  rateLimitResult?: RateLimitResult
): NextResponse<T> {
  const response = NextResponse.json(data, { status })
  if (rateLimitResult) {
    withRateLimitHeaders(response, rateLimitResult)
  }
  return response
}

/**
 * Helper to create a created (201) response with rate limit headers
 */
export function createCreatedResponse<T>(
  data: T,
  rateLimitResult?: RateLimitResult
): NextResponse<T> {
  return createSuccessResponse(data, 201, rateLimitResult)
}

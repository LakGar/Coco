/**
 * Helper function to wrap API route handlers with rate limiting
 * This reduces code duplication across routes
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { rateLimit, addRateLimitHeaders } from "./rate-limit"
import { loggerUtils } from "./logger"

type RouteHandler = (
  req: NextRequest | Request,
  params: any
) => Promise<NextResponse>

export function withRateLimit(
  handler: RouteHandler,
  method: string = "GET"
): RouteHandler {
  return async (
    req: NextRequest | Request,
    params: any
  ): Promise<NextResponse> => {
    try {
      const { userId } = await auth()
      
      // Rate limiting
      const rateLimitResult = await rateLimit(req as Request, method, userId || null)
      
      if (!rateLimitResult.success) {
        const response = NextResponse.json(
          {
            error: "Too many requests",
            message: "Rate limit exceeded. Please try again later.",
          },
          { status: 429 }
        )
        addRateLimitHeaders(
          response.headers,
          rateLimitResult.limit,
          rateLimitResult.remaining,
          rateLimitResult.reset
        )
        return response
      }

      // Call the actual handler
      const response = await handler(req, params)
      
      // Add rate limit headers to successful responses
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
      loggerUtils.logError(error, { type: "rate_limit_wrapper_error", method })
      // If rate limiting fails, still call the handler (fail open)
      return handler(req, params)
    }
  }
}


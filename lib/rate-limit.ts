import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { log, loggerUtils } from "./logger"

// Initialize Redis client
// For production, use UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
// For local development, you can use a local Redis instance or Upstash free tier
// Only initialize if credentials are provided to avoid errors
let redis: Redis | null = null
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  } catch (error) {
    loggerUtils.logError(error, { type: "redis_init_error" })
  }
}

// Rate limit configurations for different endpoint types
// Only create if Redis is available
const createRateLimiters = () => {
  if (!redis) {
    return null
  }
  
  return {
    // Strict limits for authentication endpoints
    auth: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 requests per 15 minutes
      analytics: true,
      prefix: "@ratelimit/auth",
    }),

    // Moderate limits for write operations (POST, PATCH, DELETE)
    write: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "1 m"), // 30 requests per minute
      analytics: true,
      prefix: "@ratelimit/write",
    }),

    // More lenient limits for read operations (GET)
    read: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests per minute
      analytics: true,
      prefix: "@ratelimit/read",
    }),

    // Very strict limits for sensitive operations (e.g., delete, permissions)
    sensitive: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute
      analytics: true,
      prefix: "@ratelimit/sensitive",
    }),
  }
}

const rateLimiters = createRateLimiters()

// Helper function to get rate limiter based on HTTP method and path
export function getRateLimiter(method: string, path: string): Ratelimit | null {
  if (!rateLimiters) {
    return null
  }

  // Authentication routes
  if (path.includes("/auth") || path.includes("/sign-in") || path.includes("/sign-up")) {
    return rateLimiters.auth
  }

  // Sensitive operations
  if (
    method === "DELETE" ||
    path.includes("/permissions") ||
    path.includes("/members") ||
    path.includes("/invite")
  ) {
    return rateLimiters.sensitive
  }

  // Write operations
  if (method === "POST" || method === "PATCH" || method === "PUT") {
    return rateLimiters.write
  }

  // Read operations (default)
  return rateLimiters.read
}

// Helper function to get identifier for rate limiting
// Uses userId if available, otherwise falls back to IP address
export function getRateLimitIdentifier(userId: string | null, ip: string | null): string {
  if (userId) {
    return `user:${userId}`
  }
  if (ip) {
    return `ip:${ip}`
  }
  return "anonymous"
}

// Rate limit result type
export type RateLimitResult = {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

// Rate limit middleware for Next.js API routes
export async function rateLimit(
  request: Request,
  method: string,
  userId: string | null = null
): Promise<RateLimitResult> {
  // Skip rate limiting if Redis is not configured (for local development)
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    log.warn({ type: "rate_limit_disabled" }, "Rate limiting disabled: Redis credentials not set")
    return {
      success: true,
      limit: Infinity,
      remaining: Infinity,
      reset: Date.now() + 60000,
    }
  }

  try {
    const path = new URL(request.url).pathname
    const limiter = getRateLimiter(method, path)
    
    // If no limiter (Redis not configured), allow the request
    if (!limiter) {
      return {
        success: true,
        limit: Infinity,
        remaining: Infinity,
        reset: Date.now() + 60000,
      }
    }
    
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || 
               request.headers.get("x-real-ip") || 
               "unknown"
    
    const identifier = getRateLimitIdentifier(userId, ip)
    const result = await limiter.limit(identifier)

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    }
  } catch (error) {
    // If rate limiting fails, allow the request (fail open)
    // Log the error for monitoring
    loggerUtils.logError(error, { type: "rate_limit_error", method, path: new URL(request.url).pathname })
    return {
      success: true,
      limit: Infinity,
      remaining: Infinity,
      reset: Date.now() + 60000,
    }
  }
}

// Helper to add rate limit headers to response
export function addRateLimitHeaders(
  headers: Headers,
  limit: number,
  remaining: number,
  reset: number
): void {
  headers.set("X-RateLimit-Limit", limit.toString())
  headers.set("X-RateLimit-Remaining", remaining.toString())
  headers.set("X-RateLimit-Reset", reset.toString())
}


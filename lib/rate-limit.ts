/**
 * Rate limiting utility
 * 
 * NOTE: This is a simple in-memory implementation for development.
 * For production, use Redis or a dedicated rate limiting service.
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

const store: RateLimitStore = {};

/**
 * Simple in-memory rate limiter
 * 
 * @param identifier - Unique identifier (IP, user ID, etc.)
 * @param maxRequests - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns true if allowed, false if rate limited
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minute default
): boolean {
  const now = Date.now();
  const record = store[identifier];

  // No record or window expired
  if (!record || now > record.resetAt) {
    store[identifier] = {
      count: 1,
      resetAt: now + windowMs,
    };
    return true;
  }

  // Within window
  if (record.count < maxRequests) {
    record.count++;
    return true;
  }

  // Rate limited
  return false;
}

/**
 * Get remaining requests for an identifier
 */
export function getRemainingRequests(
  identifier: string,
  maxRequests: number = 10
): number {
  const record = store[identifier];
  if (!record) return maxRequests;
  return Math.max(0, maxRequests - record.count);
}

/**
 * Clear rate limit for an identifier (useful for testing)
 */
export function clearRateLimit(identifier: string): void {
  delete store[identifier];
}

/**
 * Clear all rate limits (useful for testing)
 */
export function clearAllRateLimits(): void {
  Object.keys(store).forEach((key) => delete store[key]);
}

/**
 * Get client identifier from request
 * In production, use a more sophisticated method (IP + user agent hash, etc.)
 */
export function getClientIdentifier(request: Request): string {
  // Try to get IP from headers (works with proxies/load balancers)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback (not reliable in production)
  return "unknown";
}

/**
 * Rate limit middleware helper
 */
export function rateLimitMiddleware(
  maxRequests: number = 10,
  windowMs: number = 60000
) {
  return (request: Request): { allowed: boolean; remaining: number } => {
    const identifier = getClientIdentifier(request);
    const allowed = checkRateLimit(identifier, maxRequests, windowMs);
    const remaining = getRemainingRequests(identifier, maxRequests);

    return { allowed, remaining };
  };
}


/**
 * Server action utilities and helpers
 */

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { actionHandler, ActionResult, AuthenticationError } from "./errors";
import { rateLimitMiddleware } from "./rate-limit";

/**
 * Get authenticated user from server action
 * Throws AuthenticationError if not authenticated
 */
export async function getAuthenticatedUser() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthenticationError("Authentication required");
  }

  return { user, supabase };
}

/**
 * Wrap server action with authentication check
 */
export function withAuth<T extends any[], R>(
  fn: (user: Awaited<ReturnType<typeof getAuthenticatedUser>>, ...args: T) => Promise<R>
) {
  return async (...args: T): Promise<ActionResult<R>> => {
    return actionHandler(async () => {
      const auth = await getAuthenticatedUser();
      return fn(auth, ...args);
    });
  };
}

/**
 * Wrap server action with rate limiting
 */
export function withRateLimit<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  maxRequests: number = 10,
  windowMs: number = 60000
) {
  return async (request: Request, ...args: T): Promise<ActionResult<R>> => {
    const rateLimit = rateLimitMiddleware(maxRequests, windowMs);
    const { allowed, remaining } = rateLimit(request);

    if (!allowed) {
      return {
        success: false,
        error: "Rate limit exceeded. Please try again later.",
        code: "RATE_LIMIT_EXCEEDED",
        statusCode: 429,
      };
    }

    return actionHandler(() => fn(...args));
  };
}

/**
 * Combine auth + rate limit + error handling
 */
export function withAuthAndRateLimit<T extends any[], R>(
  fn: (user: Awaited<ReturnType<typeof getAuthenticatedUser>>, ...args: T) => Promise<R>,
  maxRequests: number = 10,
  windowMs: number = 60000
) {
  return async (request: Request, ...args: T): Promise<ActionResult<R>> => {
    const rateLimit = rateLimitMiddleware(maxRequests, windowMs);
    const { allowed } = rateLimit(request);

    if (!allowed) {
      return {
        success: false,
        error: "Rate limit exceeded. Please try again later.",
        code: "RATE_LIMIT_EXCEEDED",
        statusCode: 429,
      };
    }

    return actionHandler(async () => {
      const auth = await getAuthenticatedUser();
      return fn(auth, ...args);
    });
  };
}


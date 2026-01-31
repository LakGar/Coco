import { NextResponse } from "next/server";

/**
 * Validates cron request auth for Vercel Cron and manual calls.
 * - Vercel sends: Authorization: Bearer CRON_SECRET
 * - Manual/test: ?secret=CRON_SECRET
 * Returns null if authorized, or a 401 NextResponse if not.
 */
export function validateCronSecret(req: Request): NextResponse | null {
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) return null;

  const url = new URL(req.url);
  const querySecret = url.searchParams.get("secret");
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  const provided = bearerToken || querySecret;
  if (provided !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

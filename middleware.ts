import { createClient } from "@/utils/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Public routes that don't require authentication
 */
const PUBLIC_ROUTES = [
  "/",
  "/signin",
  "/auth/callback",
  "/auth/auth-code-error",
];

/**
 * Protected routes that require authentication
 * All routes under /app (except public ones) are protected by default
 */
const PROTECTED_ROUTE_PREFIXES = ["/dashboard", "/app", "/settings", "/profile"];

/**
 * Onboarding route - accessible when authenticated but needs completion
 */
const ONBOARDING_ROUTE = "/onboarding";

/**
 * Check if a path is public
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route));
}

/**
 * Check if a path is protected
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Check if user needs onboarding (missing profile or display_name)
 */
async function needsOnboarding(supabase: ReturnType<typeof createClient>["supabase"]): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  return !profile || !profile.display_name;
}

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);
  const pathname = request.nextUrl.pathname;

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return response;
  }

  // Allow onboarding route
  if (pathname === ONBOARDING_ROUTE || pathname.startsWith(`${ONBOARDING_ROUTE}/`)) {
    // If not authenticated, redirect to signin
    if (!user) {
      const signInUrl = new URL("/signin", request.url);
      signInUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(signInUrl);
    }
    return response;
  }

  // Protect routes that require authentication
  if (isProtectedRoute(pathname) && !user) {
    const signInUrl = new URL("/signin", request.url);
    signInUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // If authenticated, check if onboarding is needed
  if (user) {
    const needsOnboardingCheck = await needsOnboarding(supabase);
    
    // Redirect to onboarding if needed (unless already on onboarding or public route)
    if (needsOnboardingCheck && pathname !== ONBOARDING_ROUTE && !isPublicRoute(pathname)) {
      return NextResponse.redirect(new URL(ONBOARDING_ROUTE, request.url));
    }

    // If user is authenticated and tries to access signin, redirect to home
    if (pathname === "/signin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately if needed)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};


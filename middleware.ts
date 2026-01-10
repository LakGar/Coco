import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { hasCompletedOnboarding, getOnboardingRedirect } from "@/lib/auth/onboarding";

// Public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to sign in
  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }

  // Check onboarding for authenticated users (except onboarding page itself and API routes)
  const isOnboardingPage = req.nextUrl.pathname === "/onboarding";
  const isApiRoute = req.nextUrl.pathname.startsWith("/api");
  
  if (!isOnboardingPage && !isApiRoute) {
    try {
      // Check if Supabase is configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        // Supabase not configured - skip onboarding check
        console.warn("Supabase not configured - skipping onboarding check");
        return NextResponse.next();
      }
      
      const completed = await hasCompletedOnboarding();
      
      if (!completed) {
        // User hasn't completed onboarding - redirect to onboarding
        const onboardingUrl = new URL(getOnboardingRedirect(), req.url);
        onboardingUrl.searchParams.set("redirect_url", req.url);
        return NextResponse.redirect(onboardingUrl);
      }
    } catch (error) {
      // If there's an error checking onboarding (e.g., user not synced yet, env vars missing),
      // allow them through - they'll be redirected once synced
      console.error("Error checking onboarding status:", error);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};


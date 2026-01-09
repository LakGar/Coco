import { NextResponse } from "next/server";
import { cookies } from "next/headers";
// The client you created from the Server-Side Auth instructions
import { createClient } from "@/utils/supabase/server";
import { needsOnboarding } from "@/utils/supabase/profile";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Check if this is a PKCE error (code verifier not found)
  // This happens when link is opened in embedded browser (Gmail, etc.)
  if (
    error === "pkce_code_verifier_not_found" ||
    errorDescription?.includes("PKCE code verifier") ||
    errorDescription?.includes("code verifier not found")
  ) {
    // Redirect to a client-side page that can handle this
    const callbackPageUrl = new URL("/auth/callback", origin);
    searchParams.forEach((value, key) => {
      callbackPageUrl.searchParams.set(key, value);
    });
    return NextResponse.redirect(callbackPageUrl);
  }

  // Handle error cases (expired link, etc.)
  if (error) {
    // Redirect to signin with error message
    const signInUrl = new URL("/signin", origin);
    if (error === "otp_expired" || errorDescription?.includes("expired")) {
      signInUrl.searchParams.set("error", "link_expired");
      signInUrl.searchParams.set(
        "message",
        "The verification link has expired. Please request a new code."
      );
    } else {
      signInUrl.searchParams.set("error", error);
      signInUrl.searchParams.set(
        "message",
        errorDescription || "Authentication failed"
      );
    }
    return NextResponse.redirect(signInUrl);
  }

  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get("next") ?? "/";
  if (!next.startsWith("/")) {
    // if "next" is not a relative URL, use the default
    next = "/";
  }

  if (code) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // For email magic links, we can exchange the code directly without PKCE
    // The code exchange should work server-side even if PKCE verifier is missing
    const { error: exchangeError, data } =
      await supabase.auth.exchangeCodeForSession(code);

    // If exchange fails with PKCE error, try to get the user from the code directly
    if (
      exchangeError &&
      exchangeError.message?.includes("PKCE code verifier")
    ) {
      // The code might still be valid, try to get user info from it
      // This is a fallback for when PKCE verifier is missing (Gmail embedded browser)
      console.warn("PKCE error detected, attempting alternative verification");

      // Redirect to client-side page that can handle this
      const callbackPageUrl = new URL("/auth/callback", origin);
      callbackPageUrl.searchParams.set("code", code);
      if (next !== "/") callbackPageUrl.searchParams.set("next", next);
      return NextResponse.redirect(callbackPageUrl);
    }

    if (!exchangeError && data?.session) {
      // Check if user needs onboarding
      const needsOnboardingCheck = await needsOnboarding();

      // If user needs onboarding, redirect there instead
      if (needsOnboardingCheck) {
        next = "/onboarding";
      } else if (next === "/") {
        // If no specific next URL and onboarding is complete, go to dashboard
        next = "/dashboard";
      }

      const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    } else if (exchangeError) {
      // Exchange failed - redirect to signin with error
      const signInUrl = new URL("/signin", origin);
      signInUrl.searchParams.set("error", "verification_failed");
      signInUrl.searchParams.set(
        "message",
        exchangeError.message || "Failed to verify code"
      );
      return NextResponse.redirect(signInUrl);
    }
  }

  // No code provided - redirect to signin
  const signInUrl = new URL("/signin", origin);
  signInUrl.searchParams.set("error", "no_code");
  signInUrl.searchParams.set("message", "No verification code provided");
  return NextResponse.redirect(signInUrl);
}

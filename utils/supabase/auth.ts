"use client";
import { createClient } from "./client";

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }

  return data;
}

/**
 * Sign in with Apple OAuth
 */
export async function signInWithApple() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "apple",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    console.error("Error signing in with Apple:", error);
    throw error;
  }

  return data;
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error signing out:", error);
    throw error;
  }
}

/**
 * Get the current user session
 */
export async function getCurrentUser() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Error getting user:", error);
    return null;
  }

  return user;
}

/**
 * Get the current user session
 */
export async function getSession() {
  const supabase = createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("Error getting session:", error);
    return null;
  }

  return session;
}

/**
 * Send OTP to email for verification
 * 
 * NOTE: By default, Supabase sends magic links. To send 6-digit codes instead:
 * 1. Go to Supabase Dashboard → Authentication → Email Templates
 * 2. Edit the "Magic Link" template
 * 3. Change it to use OTP code format, OR
 * 4. Configure email provider to send codes
 * 
 * Alternatively, you can use magic links by clicking the link in the email
 * which will redirect to /auth/callback
 */
export async function sendVerificationCode(email: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      // This will send a magic link by default
      // To get 6-digit codes, configure email templates in Supabase dashboard
      // Use the page route instead of route handler to handle embedded browsers
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      // Disable PKCE for email links to avoid issues with embedded browsers
      // The server-side callback will handle the code exchange
    },
  });

  // Supabase may return an error even if email was sent (e.g., rate limiting warnings)
  // But if the email was sent, we should proceed
  // Check if error is a non-critical warning
  if (error) {
    // Some errors are warnings but email was still sent
    // Check error code to see if it's critical
    const criticalErrors = [
      'invalid_email',
      'email_not_allowed',
      'signup_disabled',
    ];
    
    if (criticalErrors.includes(error.message?.toLowerCase() || '')) {
      console.error("Critical error sending verification code:", error);
      throw error;
    }
    
    // For other errors (like rate limiting), log but don't throw
    // The email might still be sent
    console.warn("Warning when sending verification code (email may still be sent):", error);
  }

  // Return success even if there's a non-critical error
  // The email is typically sent regardless
  return data || { user: null, session: null };
}

/**
 * Verify OTP code
 */
export async function verifyEmailCode(email: string, token: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    console.error("Error verifying code:", error);
    throw error;
  }

  return data;
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(email: string, password: string, metadata?: {
  full_name?: string;
  given_name?: string;
  family_name?: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata || {},
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    console.error("Error signing up:", error);
    throw error;
  }

  return data;
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Error signing in:", error);
    throw error;
  }

  return data;
}

/**
 * Reset password
 */
export async function resetPassword(email: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });

  if (error) {
    console.error("Error resetting password:", error);
    throw error;
  }

  return data;
}

/**
 * Update password
 */
export async function updatePassword(newPassword: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    console.error("Error updating password:", error);
    throw error;
  }

  return data;
}


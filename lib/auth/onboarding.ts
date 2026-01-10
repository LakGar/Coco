import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";

/**
 * Check if the current user has completed onboarding
 * Currently checks if display_name is set in user_profiles
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return false;
  }

  const supabase = getSupabaseAdmin();

  // Get the Supabase user ID
  const { data: mapping } = await supabase
    .from("clerk_user_mappings")
    .select("supabase_user_id")
    .eq("clerk_user_id", clerkUserId)
    .single();

  if (!mapping) {
    // User not synced yet - consider them as not onboarded
    return false;
  }

  // Check if user has completed onboarding (has display_name)
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name")
    .eq("user_id", mapping.supabase_user_id)
    .single();

  // User has completed onboarding if display_name is set
  return !!profile?.display_name;
}

/**
 * Get the onboarding redirect URL
 */
export function getOnboardingRedirect(): string {
  return "/onboarding";
}

/**
 * Get the dashboard redirect URL
 */
export function getDashboardRedirect(): string {
  return "/dashboard";
}


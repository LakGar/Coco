/**
 * Server-side profile utilities
 * For use in Server Components, Server Actions, and Route Handlers
 */

import { cookies } from "next/headers";
import { createClient } from "./server";

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  full_name: string | null;
  given_name: string | null;
  family_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get user profile (server-side)
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return null;
    }
    console.error("Error fetching profile:", error);
    return null;
  }

  return data;
}

/**
 * Get current user's profile (server-side)
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return getProfile(user.id);
}

/**
 * Check if user needs onboarding (missing profile or display_name)
 */
export async function needsOnboarding(): Promise<boolean> {
  const profile = await getCurrentProfile();
  return !profile || !profile.display_name;
}

/**
 * Update profile display name
 */
export async function updateDisplayName(
  userId: string,
  displayName: string
): Promise<Profile | null> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  const { data, error } = await supabase
    .from("user_profiles")
    .update({ display_name: displayName })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating display name:", error);
    return null;
  }

  return data;
}


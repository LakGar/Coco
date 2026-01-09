/**
 * Server-side Supabase client for use in Server Actions
 * This is a convenience wrapper around the existing server client
 */

import { cookies } from "next/headers";
import { createClient } from "./server";

/**
 * Get Supabase client for server actions
 * This automatically handles cookie management
 */
export async function getServerSupabaseClient() {
  const cookieStore = cookies();
  return createClient(cookieStore);
}

/**
 * Get authenticated user in server action
 * Returns null if not authenticated
 */
export async function getServerUser() {
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return { user, supabase };
}


import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Get Supabase Admin client (bypasses RLS)
 * Use this for administrative operations like creating users
 */
export function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL are required for admin operations");
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Get Supabase client for server-side usage
 * This creates a client that works with Clerk sessions
 * 
 * IMPORTANT: For RLS to work, you need to authenticate with Supabase Auth.
 * Use getSupabaseWithClerk() instead, which handles the authentication.
 */
export async function getSupabaseServer() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required");
  }
  
  const cookieStore = await cookies();
  
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}

/**
 * Get Supabase client with Clerk user context
 * 
 * IMPORTANT: This uses the admin client which bypasses RLS.
 * Use manual authorization checks (see checkPatientAccess) or
 * use client-side Supabase client with proper session for RLS.
 * 
 * For server-side with RLS, consider:
 * 1. Using client-side Supabase client after authenticating
 * 2. Implementing custom JWT generation
 * 3. Using manual authorization checks
 */
export async function getSupabaseWithClerk() {
  const { userId: clerkUserId } = await auth();
  
  if (!clerkUserId) {
    // No Clerk user - return unauthenticated client
    return getSupabaseServer();
  }

  // Get the Supabase user ID for this Clerk user
  const adminClient = getSupabaseAdmin();
  const { data: mapping } = await adminClient
    .from("clerk_user_mappings")
    .select("supabase_user_id, email")
    .eq("clerk_user_id", clerkUserId)
    .single();

  if (!mapping) {
    // User not synced yet - return unauthenticated client
    console.warn(`No Supabase mapping found for Clerk user: ${clerkUserId}`);
    return getSupabaseServer();
  }

  // Return admin client with user context stored
  // Note: Admin client bypasses RLS, so add manual checks where needed
  // Store the user ID in a way we can access it later if needed
  return adminClient;
}

/**
 * Get the Supabase user ID for the current Clerk user
 */
export async function getSupabaseUserId(): Promise<string | null> {
  const { userId: clerkUserId } = await auth();
  
  if (!clerkUserId) {
    return null;
  }

  const adminClient = getSupabaseAdmin();
  const { data: mapping } = await adminClient
    .from("clerk_user_mappings")
    .select("supabase_user_id")
    .eq("clerk_user_id", clerkUserId)
    .single();

  return mapping?.supabase_user_id || null;
}

/**
 * Check if the current Clerk user has access to a patient
 * Use this for manual authorization checks when using admin client
 */
export async function checkPatientAccess(patientId: string): Promise<boolean> {
  const supabaseUserId = await getSupabaseUserId();
  
  if (!supabaseUserId) {
    return false;
  }

  const adminClient = getSupabaseAdmin();
  const { data } = await adminClient
    .from("patient_memberships")
    .select("id")
    .eq("patient_id", patientId)
    .eq("user_id", supabaseUserId)
    .eq("status", "active")
    .single();

  return !!data;
}

/**
 * Client-side Supabase client
 * Note: For client-side, you'll need to authenticate with Supabase Auth
 * after Clerk authentication. Consider creating an API route that handles this.
 */
export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required");
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
}


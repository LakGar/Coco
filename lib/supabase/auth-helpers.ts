import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "./client";

/**
 * Get the Supabase user ID for the current Clerk user
 * Returns null if not authenticated or not synced
 */
export async function getCurrentSupabaseUserId(): Promise<string | null> {
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
 * Check if the current user has access to a patient
 * Returns true if user is an active member of the patient's care circle
 */
export async function canAccessPatient(patientId: string): Promise<boolean> {
  const supabaseUserId = await getCurrentSupabaseUserId();
  
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
 * Check if the current user has editor access (owner or caregiver) to a patient
 */
export async function canEditPatient(patientId: string): Promise<boolean> {
  const supabaseUserId = await getCurrentSupabaseUserId();
  
  if (!supabaseUserId) {
    return false;
  }

  const adminClient = getSupabaseAdmin();
  const { data } = await adminClient
    .from("patient_memberships")
    .select("role")
    .eq("patient_id", patientId)
    .eq("user_id", supabaseUserId)
    .eq("status", "active")
    .in("role", ["owner", "caregiver"])
    .single();

  return !!data;
}

/**
 * Check if the current user is the owner of a patient
 */
export async function isPatientOwner(patientId: string): Promise<boolean> {
  const supabaseUserId = await getCurrentSupabaseUserId();
  
  if (!supabaseUserId) {
    return false;
  }

  const adminClient = getSupabaseAdmin();
  const { data } = await adminClient
    .from("patients")
    .select("owner_user_id")
    .eq("id", patientId)
    .eq("owner_user_id", supabaseUserId)
    .single();

  return !!data;
}

/**
 * Get all patient IDs the current user has access to
 */
export async function getAccessiblePatientIds(): Promise<string[]> {
  const supabaseUserId = await getCurrentSupabaseUserId();
  
  if (!supabaseUserId) {
    return [];
  }

  const adminClient = getSupabaseAdmin();
  const { data } = await adminClient
    .from("patient_memberships")
    .select("patient_id")
    .eq("user_id", supabaseUserId)
    .eq("status", "active");

  return data?.map((m) => m.patient_id) || [];
}


/**
 * Server-side patient utilities
 * For use in Server Components, Server Actions, and Route Handlers
 */

import { cookies } from "next/headers";
import { createClient } from "./server";
import crypto from "crypto";

export interface Patient {
  id: string;
  created_at: string;
  updated_at: string;
  first_name: string;
  archived: boolean;
  created_by: string;
}

export interface PatientMembership {
  patient_id: string;
  user_id: string;
  role: "owner" | "caregiver" | "viewer";
  status: "accepted" | "pending";
  invited_by: string | null;
  created_at: string;
}

export interface PatientInvite {
  id: string;
  patient_id: string;
  email: string;
  role: "caregiver" | "viewer";
  token_hash: string;
  expires_at: string;
  created_by: string;
  created_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
}

/**
 * Hash a token for storage
 */
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Get all patients the current user has access to
 */
export async function getAccessiblePatients(): Promise<Patient[]> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // RLS will filter to only patients where user has accepted membership
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching patients:", error);
    return [];
  }

  return data || [];
}

/**
 * Get a single patient by ID (if user has access)
 */
export async function getPatient(patientId: string): Promise<Patient | null> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", patientId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("Error fetching patient:", error);
    return null;
  }

  return data;
}

/**
 * Create a new patient
 */
export async function createPatient(
  first_name: string
): Promise<Patient | null> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  // Create patient
  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .insert({
      first_name,
      created_by: user.id,
    })
    .select()
    .single();

  if (patientError || !patient) {
    console.error("Error creating patient:", patientError);
    return null;
  }

  // Automatically create owner membership
  const { error: membershipError } = await supabase
    .from("patient_memberships")
    .insert({
      patient_id: patient.id,
      user_id: user.id,
      role: "owner",
      status: "accepted",
    });

  if (membershipError) {
    console.error("Error creating membership:", membershipError);
    // Patient was created but membership failed - this is a problem
    // In production, you might want to rollback or handle this differently
  }

  return patient;
}

/**
 * Update a patient
 */
export async function updatePatient(
  patientId: string,
  updates: { first_name?: string; archived?: boolean }
): Promise<Patient | null> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("patients")
    .update(updates)
    .eq("id", patientId)
    .select()
    .single();

  if (error) {
    console.error("Error updating patient:", error);
    return null;
  }

  return data;
}

/**
 * Get memberships for a patient
 */
export async function getPatientMemberships(
  patientId: string
): Promise<PatientMembership[]> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("patient_memberships")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching memberships:", error);
    return [];
  }

  return data || [];
}

/**
 * Check if user is owner of a patient
 */
export async function isPatientOwner(patientId: string): Promise<boolean> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data, error } = await supabase
    .from("patient_memberships")
    .select("role")
    .eq("patient_id", patientId)
    .eq("user_id", user.id)
    .eq("status", "accepted")
    .eq("role", "owner")
    .single();

  if (error || !data) {
    return false;
  }

  return true;
}

/**
 * Invite a caregiver to a patient
 * Returns the invite token (show once, then store only hash)
 */
export async function inviteCaregiver(
  patientId: string,
  email: string,
  role: "caregiver" | "viewer"
): Promise<{ inviteId: string; token: string } | null> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  // Check if user is owner
  const isOwner = await isPatientOwner(patientId);
  if (!isOwner) {
    throw new Error("Only owners can invite caregivers");
  }

  // Generate secure token
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);

  // Set expiration (7 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Create invite
  const { data: invite, error } = await supabase
    .from("patient_invites")
    .insert({
      patient_id: patientId,
      email: email.toLowerCase().trim(),
      role,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
      created_by: user.id,
    })
    .select()
    .single();

  if (error || !invite) {
    console.error("Error creating invite:", error);
    return null;
  }

  // Note: We can't check if user exists server-side without admin API
  // The membership will be created when they accept the invite
  // For now, we'll create a pending membership entry when they accept

  return {
    inviteId: invite.id,
    token,
  };
}

/**
 * Get invites for a patient
 */
export async function getPatientInvites(
  patientId: string
): Promise<PatientInvite[]> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("patient_invites")
    .select("*")
    .eq("patient_id", patientId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching invites:", error);
    return [];
  }

  return data || [];
}

/**
 * Accept an invite by token
 */
export async function acceptInvite(token: string): Promise<{
  success: boolean;
  patientId?: string;
  error?: string;
}> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Authentication required" };
  }

  const tokenHash = hashToken(token);

  // Find invite
  const { data: invite, error: inviteError } = await supabase
    .from("patient_invites")
    .select("*")
    .eq("token_hash", tokenHash)
    .is("revoked_at", null)
    .is("accepted_at", null)
    .single();

  if (inviteError || !invite) {
    return { success: false, error: "Invalid or expired invite" };
  }

  // Check expiration
  if (new Date(invite.expires_at) < new Date()) {
    return { success: false, error: "Invite has expired" };
  }

  // Check email matches
  if (invite.email.toLowerCase() !== user.email?.toLowerCase()) {
    return {
      success: false,
      error: "This invite was sent to a different email address",
    };
  }

  // Update invite as accepted
  const { error: updateError } = await supabase
    .from("patient_invites")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invite.id);

  if (updateError) {
    console.error("Error updating invite:", updateError);
  }

  // Create or update membership to accepted
  const { error: membershipError } = await supabase
    .from("patient_memberships")
    .upsert(
      {
        patient_id: invite.patient_id,
        user_id: user.id,
        role: invite.role,
        status: "accepted",
        invited_by: invite.created_by,
      },
      {
        onConflict: "patient_id,user_id",
      }
    );

  if (membershipError) {
    console.error("Error creating membership:", membershipError);
    return { success: false, error: "Failed to accept invite" };
  }

  return { success: true, patientId: invite.patient_id };
}


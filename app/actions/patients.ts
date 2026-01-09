"use server";

import { getAuthenticatedUser } from "@/lib/server-actions";
import {
  createPatient,
  updatePatient,
  getPatient,
  inviteCaregiver,
  acceptInvite,
  isPatientOwner,
} from "@/utils/supabase/patients";
import { actionHandler, ActionResult } from "@/lib/errors";
import {
  createPatientSchema,
  updatePatientSchema,
  inviteCaregiverSchema,
  acceptInviteSchema,
  safeParse,
} from "@/lib/validation";

/**
 * Create a new patient
 */
export async function createPatientAction(
  first_name: string
): Promise<ActionResult<{ patientId: string }>> {
  return actionHandler(async () => {
    const { user } = await getAuthenticatedUser();

    const validation = safeParse(createPatientSchema, { first_name });
    if (!validation.success) {
      throw new Error(validation.error);
    }

    const patient = await createPatient(validation.data.first_name);
    if (!patient) {
      throw new Error("Failed to create patient");
    }

    return { patientId: patient.id };
  });
}

/**
 * Update a patient
 */
export async function updatePatientAction(
  patientId: string,
  updates: { first_name?: string; archived?: boolean }
): Promise<ActionResult<{ success: boolean }>> {
  return actionHandler(async () => {
    await getAuthenticatedUser();

    // Verify user has access (RLS will enforce, but check ownership for updates)
    const isOwner = await isPatientOwner(patientId);
    if (!isOwner) {
      throw new Error("Only owners can update patients");
    }

    const validation = safeParse(updatePatientSchema, updates);
    if (!validation.success) {
      throw new Error(validation.error);
    }

    const updated = await updatePatient(patientId, validation.data);
    if (!updated) {
      throw new Error("Failed to update patient");
    }

    return { success: true };
  });
}

/**
 * Invite a caregiver to a patient
 */
export async function inviteCaregiverAction(
  patientId: string,
  email: string,
  role: "caregiver" | "viewer"
): Promise<ActionResult<{ inviteToken: string; inviteUrl: string }>> {
  return actionHandler(async () => {
    await getAuthenticatedUser();

    // Verify user is owner
    const isOwner = await isPatientOwner(patientId);
    if (!isOwner) {
      throw new Error("Only owners can invite caregivers");
    }

    const validation = safeParse(inviteCaregiverSchema, { email, role });
    if (!validation.success) {
      throw new Error(validation.error);
    }

    const result = await inviteCaregiver(
      patientId,
      validation.data.email,
      validation.data.role
    );

    if (!result) {
      throw new Error("Failed to create invite");
    }

    // Build invite URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteUrl = `${baseUrl}/dashboard/invites/${result.token}`;

    return {
      inviteToken: result.token,
      inviteUrl,
    };
  });
}

/**
 * Accept an invite
 */
export async function acceptInviteAction(
  token: string
): Promise<ActionResult<{ patientId: string }>> {
  return actionHandler(async () => {
    await getAuthenticatedUser();

    const validation = safeParse(acceptInviteSchema, { token });
    if (!validation.success) {
      throw new Error(validation.error);
    }

    const result = await acceptInvite(validation.data.token);
    if (!result.success) {
      throw new Error(result.error || "Failed to accept invite");
    }

    return { patientId: result.patientId! };
  });
}


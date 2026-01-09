"use server";

import { getAuthenticatedUser } from "@/lib/server-actions";
import { updateDisplayName } from "@/utils/supabase/profile";
import { actionHandler, ActionResult } from "@/lib/errors";

/**
 * Validate display name
 */
function validateDisplayName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { valid: false, error: "Display name is required" };
  }
  if (trimmed.length > 100) {
    return { valid: false, error: "Display name is too long (max 100 characters)" };
  }
  return { valid: true };
}

/**
 * Update user display name
 */
export async function updateUserDisplayName(
  displayName: string
): Promise<ActionResult<{ success: boolean }>> {
  return actionHandler(async () => {
    const { user } = await getAuthenticatedUser();
    
    const validation = validateDisplayName(displayName);
    if (!validation.valid) {
      throw new Error(validation.error || "Invalid display name");
    }

    const updated = await updateDisplayName(user.id, displayName.trim());
    if (!updated) {
      throw new Error("Failed to update display name");
    }

    return { success: true };
  });
}



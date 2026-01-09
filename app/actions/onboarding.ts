"use server";

import { getAuthenticatedUser } from "@/lib/server-actions";
import { updateDisplayName, updateAvatarUrl } from "@/utils/supabase/profile";
import { uploadAvatar } from "@/utils/supabase/storage";
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

/**
 * Upload and update user avatar
 */
export async function uploadUserAvatar(
  formData: FormData
): Promise<ActionResult<{ avatarUrl: string }>> {
  return actionHandler(async () => {
    const { user } = await getAuthenticatedUser();
    
    const file = formData.get("avatar") as File | null;
    if (!file) {
      throw new Error("No file provided");
    }

    // Upload to storage
    const uploadResult = await uploadAvatar(user.id, file);
    if (!uploadResult) {
      throw new Error("Failed to upload avatar");
    }

    // Update profile with avatar URL
    const updated = await updateAvatarUrl(user.id, uploadResult.url);
    if (!updated) {
      throw new Error("Failed to update avatar URL");
    }

    return { avatarUrl: uploadResult.url };
  });
}



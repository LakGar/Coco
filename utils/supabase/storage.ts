/**
 * Supabase Storage utilities for file uploads
 */

import { createClient } from "./server";
import { cookies } from "next/headers";

const AVATAR_BUCKET = "avatars";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

/**
 * Upload avatar image to Supabase Storage
 */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<{ url: string } | null> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // Validate file
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File size must be less than 5MB");
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("File must be a JPEG, PNG, or WebP image");
  }

  // Generate unique filename
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  // Upload to Supabase Storage
  // Note: Supabase Storage accepts File/Blob directly
  const { data, error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(filePath, file, {
      contentType: file.type,
      upsert: true, // Replace existing file if it exists
    });

  if (error) {
    console.error("Error uploading avatar:", error);
    throw new Error("Failed to upload avatar");
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filePath);

  return { url: publicUrl };
}

/**
 * Delete avatar from Supabase Storage
 */
export async function deleteAvatar(userId: string): Promise<boolean> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  // List all files for this user
  const { data: files, error: listError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .list(userId);

  if (listError) {
    console.error("Error listing avatar files:", listError);
    return false;
  }

  // Delete all files for this user
  const filePaths = files.map((file) => `${userId}/${file.name}`);
  const { error: deleteError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .remove(filePaths);

  if (deleteError) {
    console.error("Error deleting avatar:", deleteError);
    return false;
  }

  return true;
}


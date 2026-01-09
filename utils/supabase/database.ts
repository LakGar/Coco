"use client";
import { createClient } from "./client";

/**
 * Database utility functions for user data management
 */

// ============================================
// USER PROFILES
// ============================================

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  given_name: string | null;
  family_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get user profile by user ID
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }

  return data;
}

/**
 * Get current user's profile
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return getUserProfile(user.id);
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<UserProfile, "id" | "email" | "created_at" | "updated_at">>
): Promise<UserProfile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating user profile:", error);
    return null;
  }

  return data;
}

// ============================================
// USER SETTINGS
// ============================================

export interface UserSetting {
  id: string;
  user_id: string;
  key: string;
  value: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Get user setting by key
 */
export async function getUserSetting(
  userId: string,
  key: string
): Promise<UserSetting | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .eq("key", key)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return null;
    }
    console.error("Error fetching user setting:", error);
    return null;
  }

  return data;
}

/**
 * Get all user settings
 */
export async function getUserSettings(userId: string): Promise<UserSetting[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching user settings:", error);
    return [];
  }

  return data || [];
}

/**
 * Set user setting
 */
export async function setUserSetting(
  userId: string,
  key: string,
  value: Record<string, any>
): Promise<UserSetting | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_settings")
    .upsert(
      {
        user_id: userId,
        key,
        value,
      },
      {
        onConflict: "user_id,key",
      }
    )
    .select()
    .single();

  if (error) {
    console.error("Error setting user setting:", error);
    return null;
  }

  return data;
}

/**
 * Delete user setting
 */
export async function deleteUserSetting(
  userId: string,
  key: string
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from("user_settings")
    .delete()
    .eq("user_id", userId)
    .eq("key", key);

  if (error) {
    console.error("Error deleting user setting:", error);
    return false;
  }

  return true;
}

// ============================================
// CONSENTS
// ============================================

export interface Consent {
  id: string;
  user_id: string;
  consent_type: string;
  version: string;
  granted: boolean;
  granted_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get user consent by type and version
 */
export async function getUserConsent(
  userId: string,
  consentType: string,
  version: string
): Promise<Consent | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("consents")
    .select("*")
    .eq("user_id", userId)
    .eq("consent_type", consentType)
    .eq("version", version)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("Error fetching user consent:", error);
    return null;
  }

  return data;
}

/**
 * Get all user consents
 */
export async function getUserConsents(userId: string): Promise<Consent[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("consents")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user consents:", error);
    return [];
  }

  return data || [];
}

/**
 * Grant consent
 */
export async function grantConsent(
  userId: string,
  consentType: string,
  version: string
): Promise<Consent | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("consents")
    .upsert(
      {
        user_id: userId,
        consent_type: consentType,
        version,
        granted: true,
        granted_at: new Date().toISOString(),
        revoked_at: null,
      },
      {
        onConflict: "user_id,consent_type,version",
      }
    )
    .select()
    .single();

  if (error) {
    console.error("Error granting consent:", error);
    return null;
  }

  return data;
}

/**
 * Revoke consent
 */
export async function revokeConsent(
  userId: string,
  consentType: string,
  version: string
): Promise<Consent | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("consents")
    .update({
      granted: false,
      revoked_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("consent_type", consentType)
    .eq("version", version)
    .select()
    .single();

  if (error) {
    console.error("Error revoking consent:", error);
    return null;
  }

  return data;
}


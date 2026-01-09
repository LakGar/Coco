/**
 * Input validation schemas and utilities
 * Uses Zod for runtime type-safe validation
 */

import { z } from "zod";

// ============================================
// AUTH VALIDATION SCHEMAS
// ============================================

export const emailSchema = z
  .string()
  .email("Invalid email address")
  .min(1, "Email is required")
  .max(255, "Email is too long")
  .toLowerCase()
  .trim();

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain at least one uppercase letter, one lowercase letter, and one number"
  );

export const otpCodeSchema = z
  .string()
  .length(6, "Verification code must be 6 digits")
  .regex(/^\d{6}$/, "Verification code must be 6 digits");

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  full_name: z.string().max(255, "Name is too long").trim().optional(),
  given_name: z.string().max(100, "Given name is too long").trim().optional(),
  family_name: z.string().max(100, "Family name is too long").trim().optional(),
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const verifyEmailSchema = z.object({
  email: emailSchema,
  token: otpCodeSchema,
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
});

// ============================================
// PATIENT VALIDATION SCHEMAS
// ============================================

export const patientFirstNameSchema = z
  .string()
  .min(1, "First name is required")
  .max(100, "First name is too long")
  .trim();

export const createPatientSchema = z.object({
  first_name: patientFirstNameSchema,
  archived: z.boolean().optional().default(false),
});

export const updatePatientSchema = z.object({
  first_name: patientFirstNameSchema.optional(),
  archived: z.boolean().optional(),
});

export const inviteCaregiverSchema = z.object({
  email: emailSchema,
  role: z.enum(["caregiver", "viewer"] as const),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1, "Invite token is required"),
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Safe parse with error formatting
 */
export function safeParse<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const firstError = result.error.issues[0];
  return {
    success: false,
    error: firstError?.message || "Validation failed",
  };
}

/**
 * Parse and throw on error (for server-side use)
 */
export function parseOrThrow<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}


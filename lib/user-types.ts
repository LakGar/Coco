/**
 * Prisma User shape returned by /api/user/profile (and used for current user display).
 * Use this so all components that show the current user image use the same Prisma-backed data.
 */
export interface PrismaUserProfile {
  id: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  imageUrl: string | null;
}

/**
 * Formatted current user for nav/header avatars.
 * imageUrl is the display URL (Prisma imageUrl with Clerk fallback, may include cache-busting).
 */
export interface CurrentUserDisplay {
  name: string;
  email: string;
  imageUrl: string;
}

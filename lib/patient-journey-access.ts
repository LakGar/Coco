import type { CareTeamMember, TeamRole } from "@prisma/client";

export type MemberLike = Pick<
  CareTeamMember,
  "isAdmin" | "teamRole" | "accessLevel"
>;

/**
 * Only Admins + Physicians can access Patient Journey.
 * Caregiver, Family, Patient get no access (403).
 */
export function canAccessPatientJourney(member: MemberLike): boolean {
  if (member.isAdmin === true) return true;
  if (member.teamRole === "PHYSICIAN") return true;
  return false;
}

/**
 * Can edit journey (sections, manual entries): Admin OR (Physician with FULL access).
 */
export function canEditPatientJourney(member: MemberLike): boolean {
  if (member.isAdmin === true) return true;
  if (member.teamRole === "PHYSICIAN" && member.accessLevel === "FULL")
    return true;
  return false;
}

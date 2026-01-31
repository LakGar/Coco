import { NextResponse } from "next/server";
import {
  requireTeamAccess,
  extractTeamId,
  isAuthError,
} from "@/lib/auth-middleware";
import {
  canAccessPatientJourney,
  canEditPatientJourney,
} from "@/lib/patient-journey-access";
import { createInternalErrorResponse } from "@/lib/error-handler";

/**
 * GET /api/teams/[teamId]/journey/access
 * Returns { canAccess, canEdit } for Patient Journey. Used to show/hide nav.
 */
export async function GET(
  req: Request,
  { params }: { params: { teamId: string } | Promise<{ teamId: string }> },
) {
  try {
    const teamId = await extractTeamId(params);
    const authResult = await requireTeamAccess(teamId, "READ_ONLY");

    if (isAuthError(authResult)) {
      return authResult.response;
    }

    const { membership } = authResult;

    const canAccess = canAccessPatientJourney(membership);
    const canEdit = canEditPatientJourney(membership);

    return NextResponse.json({ canAccess, canEdit });
  } catch (error) {
    const teamId = await extractTeamId(params);
    return createInternalErrorResponse(error, {
      endpoint: "/api/teams/[teamId]/journey/access",
      method: "GET",
      teamId,
    });
  }
}

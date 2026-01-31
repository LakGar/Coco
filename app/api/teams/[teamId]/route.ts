import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  requireTeamAccess,
  extractTeamId,
  isAuthError,
} from "@/lib/auth-middleware";
import { createInternalErrorResponse } from "@/lib/error-handler";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";
import { rateLimit, addRateLimitHeaders } from "@/lib/rate-limit";

/**
 * DELETE /api/teams/[teamId]
 * Delete the entire team and all its data. Admin only.
 * Deletes all members first, then the team (cascades to tasks, routines, notes, etc.).
 */
export async function DELETE(
  req: Request,
  { params }: { params: { teamId: string } | Promise<{ teamId: string }> },
) {
  try {
    const teamId = await extractTeamId(params);
    const authResult = await requireTeamAccess(teamId, "FULL");

    if (isAuthError(authResult)) {
      return authResult.response;
    }

    const { user, membership } = authResult;

    if (!membership.isAdmin) {
      return NextResponse.json(
        { error: "Only admins can delete the team." },
        { status: 403 },
      );
    }

    const rateLimitResult = await rateLimit(
      req,
      "DELETE",
      user.clerkId || user.id,
    );
    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        {
          error: "Too many requests",
          message: "Rate limit exceeded. Please try again later.",
        },
        { status: 429 },
      );
      addRateLimitHeaders(
        response.headers,
        rateLimitResult.limit,
        rateLimitResult.remaining,
        rateLimitResult.reset,
      );
      return response;
    }

    const team = await prisma.careTeam.findUnique({
      where: { id: teamId },
      select: { name: true },
    });

    await createAuditLog({
      teamId,
      actorId: user.id,
      action: AUDIT_ACTIONS.TEAM_DELETED,
      entityType: "CareTeam",
      entityId: teamId,
      metadata: { teamName: team?.name },
    });

    await prisma.careTeamMember.deleteMany({
      where: { teamId },
    });

    await prisma.careTeam.delete({
      where: { id: teamId },
    });

    const response = NextResponse.json({ success: true });
    addRateLimitHeaders(
      response.headers,
      rateLimitResult.limit,
      rateLimitResult.remaining,
      rateLimitResult.reset,
    );
    return response;
  } catch (error) {
    const teamId = await extractTeamId(params);
    return createInternalErrorResponse(error, {
      endpoint: "/api/teams/[teamId]",
      method: "DELETE",
      teamId,
    });
  }
}

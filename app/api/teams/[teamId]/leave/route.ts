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
 * POST /api/teams/[teamId]/leave
 * Remove the current user's membership (leave the team).
 * If the user is the only admin, returns 400 with code ONLY_ADMIN so the client
 * can prompt them to assign another admin first.
 */
export async function POST(
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

    const rateLimitResult = await rateLimit(
      req,
      "POST",
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

    // If user is admin, check if they're the only admin
    if (membership.isAdmin) {
      const adminCount = await prisma.careTeamMember.count({
        where: {
          teamId,
          userId: { not: null },
          isAdmin: true,
        },
      });
      if (adminCount <= 1) {
        return NextResponse.json(
          {
            error:
              "You are the only admin. Assign another admin before leaving the team.",
            code: "ONLY_ADMIN_CANNOT_LEAVE",
          },
          { status: 400 },
        );
      }
    }

    await createAuditLog({
      teamId,
      actorId: user.id,
      action: AUDIT_ACTIONS.MEMBER_LEFT,
      entityType: "CareTeamMember",
      entityId: membership.id,
      metadata: {},
    });

    await prisma.careTeamMember.delete({
      where: { id: membership.id },
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
      endpoint: "/api/teams/[teamId]/leave",
      method: "POST",
      teamId,
    });
  }
}

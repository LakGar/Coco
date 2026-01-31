import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  requireTeamAccess,
  extractTeamId,
  isAuthError,
} from "@/lib/auth-middleware";
import { canAccessPatientJourney } from "@/lib/patient-journey-access";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";
import { createInternalErrorResponse } from "@/lib/error-handler";
import { rateLimit, addRateLimitHeaders } from "@/lib/rate-limit";
import { computeSnapshotForTeam } from "@/lib/patient-journey-snapshot";

/**
 * POST /api/teams/[teamId]/journey/snapshot
 * Compute and store snapshot for 7 or 30 days. Access: Admin or Physician.
 * Body: { rangeDays: 7 | 30 }
 */
export async function POST(
  req: Request,
  { params }: { params: { teamId: string } | Promise<{ teamId: string }> },
) {
  try {
    const teamId = await extractTeamId(params);

    const authResult = await requireTeamAccess(teamId, "READ_ONLY");
    if (isAuthError(authResult)) {
      return authResult.response;
    }

    const { user, membership } = authResult;
    if (!canAccessPatientJourney(membership)) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message:
            "Patient Journey is only available to Admins and Physicians.",
        },
        { status: 403 },
      );
    }

    const rateLimitResult = await rateLimit(
      req,
      "POST",
      user.clerkId || user.id,
    );
    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { error: "Too many requests", message: "Rate limit exceeded." },
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

    const body = await req.json().catch(() => ({}));
    const rangeDays = body.rangeDays === 30 ? 30 : 7;

    let journey = await prisma.patientJourney.findUnique({
      where: { teamId },
    });

    if (!journey) {
      const team = await prisma.careTeam.findUnique({
        where: { id: teamId },
        select: { name: true },
      });
      if (!team) {
        return NextResponse.json(
          { error: "Not found", message: "Team not found." },
          { status: 404 },
        );
      }
      journey = await prisma.patientJourney.create({
        data: {
          teamId,
          title: "Patient Journey",
          patientDisplayName: team.name?.replace(/'s Care Team$/, "") ?? null,
          createdById: user.id,
        },
      });
    }

    const data = await computeSnapshotForTeam(teamId, rangeDays as 7 | 30);

    await prisma.journeySnapshot.upsert({
      where: {
        journeyId_rangeDays: { journeyId: journey.id, rangeDays },
      },
      create: {
        journeyId: journey.id,
        rangeDays,
        data: data as unknown as object,
      },
      update: {
        computedAt: new Date(),
        data: data as unknown as object,
      },
    });

    await createAuditLog({
      teamId,
      actorId: user.id,
      action: AUDIT_ACTIONS.JOURNEY_SNAPSHOT_COMPUTED,
      entityType: "JourneySnapshot",
      entityId: journey.id,
      metadata: { rangeDays },
    });

    const response = NextResponse.json({
      success: true,
      rangeDays,
      computedAt: new Date().toISOString(),
    });

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
      endpoint: "/api/teams/[teamId]/journey/snapshot",
      method: "POST",
      teamId,
    });
  }
}

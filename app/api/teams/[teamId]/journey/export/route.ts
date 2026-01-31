import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  requireTeamAccess,
  extractTeamId,
  isAuthError,
} from "@/lib/auth-middleware";
import { canAccessPatientJourney } from "@/lib/patient-journey-access";
import { createInternalErrorResponse } from "@/lib/error-handler";
import { subDays } from "date-fns";

/**
 * GET /api/teams/[teamId]/journey/export?rangeDays=30
 * Export 30-day (or 7-day) journey as JSON: snapshot + timeline entries.
 * Access: Admin or Physician only.
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

    const { searchParams } = new URL(req.url);
    const rangeDays = Math.min(
      Math.max(parseInt(searchParams.get("rangeDays") ?? "30", 10) || 30, 7),
      30,
    );
    const since = subDays(new Date(), rangeDays);

    const journey = await prisma.patientJourney.findUnique({
      where: { teamId },
      include: {
        snapshots: { where: { rangeDays } },
        team: { select: { name: true } },
      },
    });

    if (!journey) {
      return NextResponse.json(
        { error: "Not found", message: "Patient Journey not found." },
        { status: 404 },
      );
    }

    const entries = await prisma.journeyEntry.findMany({
      where: {
        journeyId: journey.id,
        occurredAt: { gte: since },
      },
      orderBy: { occurredAt: "asc" },
      include: {
        author: {
          select: { id: true, name: true, firstName: true, lastName: true },
        },
      },
    });

    const snapshot = journey.snapshots[0];
    const exportData = {
      exportedAt: new Date().toISOString(),
      rangeDays,
      journey: {
        id: journey.id,
        title: journey.title,
        patientDisplayName: journey.patientDisplayName,
        teamName: journey.team?.name,
      },
      snapshot: snapshot
        ? {
            computedAt: snapshot.computedAt,
            data: snapshot.data,
          }
        : null,
      timeline: entries.map((e) => ({
        id: e.id,
        type: e.type,
        title: e.title,
        content: e.content,
        author: e.author
          ? e.author.name ||
            [e.author.firstName, e.author.lastName].filter(Boolean).join(" ")
          : "System",
        occurredAt: e.occurredAt,
        linkedEntityType: e.linkedEntityType,
        linkedEntityId: e.linkedEntityId,
      })),
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="patient-journey-${rangeDays}d-${formatExportDate()}.json"`,
      },
    });
  } catch (error) {
    const teamId = await extractTeamId(params);
    return createInternalErrorResponse(error, {
      endpoint: "/api/teams/[teamId]/journey/export",
      method: "GET",
      teamId,
    });
  }
}

function formatExportDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

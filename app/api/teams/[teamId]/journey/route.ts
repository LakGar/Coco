import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  requireTeamAccess,
  extractTeamId,
  isAuthError,
} from "@/lib/auth-middleware";
import { canAccessPatientJourney } from "@/lib/patient-journey-access";
import { createInternalErrorResponse } from "@/lib/error-handler";
import { rateLimit, addRateLimitHeaders } from "@/lib/rate-limit";
import { computeSnapshotForTeam } from "@/lib/patient-journey-snapshot";

const DEFAULT_SECTION_KEYS = [
  { key: "BASICS", title: "Basics" },
  { key: "SAFETY", title: "Safety" },
  { key: "TRIGGERS", title: "Triggers" },
  { key: "BASELINE", title: "Baseline" },
  { key: "PROVIDERS", title: "Providers" },
  { key: "GOALS", title: "Goals" },
  { key: "MEDICATIONS", title: "Medications" },
];

const STALE_SNAPSHOT_MS = 12 * 60 * 60 * 1000; // 12 hours

/**
 * GET /api/teams/[teamId]/journey
 * Returns Patient Journey (sections, snapshots 7 & 30, paginated entries).
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
      "GET",
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

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("entriesCursor") ?? undefined;
    const limit = Math.min(
      parseInt(searchParams.get("limit") ?? "20", 10) || 20,
      50,
    );

    let journey = await prisma.patientJourney.findUnique({
      where: { teamId },
      include: {
        sections: {
          orderBy: { key: "asc" },
          include: {
            updatedBy: {
              select: { id: true, name: true, firstName: true, lastName: true },
            },
          },
        },
        snapshots: true,
        team: { select: { name: true, patientId: true } },
      },
    });

    if (!journey) {
      const team = await prisma.careTeam.findUnique({
        where: { id: teamId },
        select: { name: true, patientId: true },
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
          sections: {
            create: DEFAULT_SECTION_KEYS.map(({ key, title }) => ({
              key,
              title,
              content: {},
              updatedById: user.id,
            })),
          },
        },
        include: {
          sections: {
            orderBy: { key: "asc" },
            include: {
              updatedBy: {
                select: {
                  id: true,
                  name: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          snapshots: true,
          team: { select: { name: true, patientId: true } },
        },
      });
    }

    const now = new Date();
    const snapshotsToCompute: (7 | 30)[] = [];
    for (const rangeDays of [7, 30] as const) {
      const snap = journey.snapshots.find((s) => s.rangeDays === rangeDays);
      if (
        !snap ||
        now.getTime() - new Date(snap.computedAt).getTime() > STALE_SNAPSHOT_MS
      ) {
        snapshotsToCompute.push(rangeDays);
      }
    }

    if (snapshotsToCompute.length > 0) {
      for (const rangeDays of snapshotsToCompute) {
        const data = await computeSnapshotForTeam(teamId, rangeDays);
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
            computedAt: now,
            data: data as unknown as object,
          },
        });
      }
      const updated = await prisma.patientJourney.findUnique({
        where: { id: journey.id },
        include: { snapshots: true },
      });
      if (updated) journey.snapshots = updated.snapshots;
    }

    const entries = await prisma.journeyEntry.findMany({
      where: { journeyId: journey.id },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { occurredAt: "desc" },
      include: {
        author: {
          select: { id: true, name: true, firstName: true, lastName: true },
        },
      },
    });

    const hasMore = entries.length > limit;
    const items = hasMore ? entries.slice(0, limit) : entries;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    const response = NextResponse.json({
      journey: {
        id: journey.id,
        teamId: journey.teamId,
        title: journey.title,
        patientDisplayName: journey.patientDisplayName,
        sections: journey.sections.map((s) => ({
          id: s.id,
          key: s.key,
          title: s.title,
          content: s.content,
          version: s.version,
          updatedAt: s.updatedAt,
          updatedBy: s.updatedBy
            ? {
                id: s.updatedBy.id,
                name:
                  s.updatedBy.name ||
                  [s.updatedBy.firstName, s.updatedBy.lastName]
                    .filter(Boolean)
                    .join(" "),
              }
            : null,
        })),
        snapshots: journey.snapshots.map((s) => ({
          rangeDays: s.rangeDays,
          computedAt: s.computedAt,
          data: s.data,
        })),
      },
      entries: { items, nextCursor, hasMore },
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
      endpoint: "/api/teams/[teamId]/journey",
      method: "GET",
      teamId,
    });
  }
}

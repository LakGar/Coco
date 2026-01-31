import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  requireTeamAccess,
  extractTeamId,
  isAuthError,
} from "@/lib/auth-middleware";
import { canEditPatientJourney } from "@/lib/patient-journey-access";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";
import { createInternalErrorResponse } from "@/lib/error-handler";
import { rateLimit, addRateLimitHeaders } from "@/lib/rate-limit";
import { JourneyEntryType } from "@prisma/client";

const VALID_TYPES: JourneyEntryType[] = [
  "UPDATE",
  "MILESTONE",
  "MED_CHANGE",
  "APPOINTMENT",
  "BEHAVIOR",
  "SAFETY",
  "MOOD_EVENT",
  "ROUTINE_EVENT",
  "TASK_EVENT",
  "BURDEN_EVENT",
  "NOTE_EVENT",
];

/**
 * POST /api/teams/[teamId]/journey/entries
 * Create a manual journey entry. Access: Admin or Physician with FULL.
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
    if (!canEditPatientJourney(membership)) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message:
            "Only Admins and Physicians with full access can add Patient Journey entries.",
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

    const body = await req.json();
    const {
      type,
      title,
      content,
      occurredAt,
      linkedEntityType,
      linkedEntityId,
    } = body as {
      type?: string;
      title?: string;
      content?: string | Record<string, unknown>;
      occurredAt?: string;
      linkedEntityType?: string;
      linkedEntityId?: string;
    };

    if (!type || !title) {
      return NextResponse.json(
        { error: "Bad request", message: "type and title are required." },
        { status: 400 },
      );
    }

    if (!VALID_TYPES.includes(type as JourneyEntryType)) {
      return NextResponse.json(
        { error: "Bad request", message: "Invalid entry type." },
        { status: 400 },
      );
    }

    const journey = await prisma.patientJourney.findUnique({
      where: { teamId },
    });

    if (!journey) {
      return NextResponse.json(
        { error: "Not found", message: "Patient Journey not found." },
        { status: 404 },
      );
    }

    const occurred = occurredAt != null ? new Date(occurredAt) : new Date();
    const contentJson =
      typeof content === "string" ? { text: content } : (content ?? {});

    const entry = await prisma.journeyEntry.create({
      data: {
        journeyId: journey.id,
        type: type as JourneyEntryType,
        title,
        content: contentJson as object,
        authorId: user.id,
        linkedEntityType: linkedEntityType ?? null,
        linkedEntityId: linkedEntityId ?? null,
        occurredAt: occurred,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
      },
    });

    await createAuditLog({
      teamId,
      actorId: user.id,
      action: AUDIT_ACTIONS.JOURNEY_ENTRY_CREATED,
      entityType: "JourneyEntry",
      entityId: entry.id,
      metadata: { type: entry.type, title: entry.title },
    });

    const response = NextResponse.json({
      entry: {
        id: entry.id,
        type: entry.type,
        title: entry.title,
        content: entry.content,
        authorId: entry.authorId,
        author: entry.author
          ? {
              id: entry.author.id,
              name:
                entry.author.name ||
                [entry.author.firstName, entry.author.lastName]
                  .filter(Boolean)
                  .join(" "),
              imageUrl: entry.author.imageUrl,
            }
          : null,
        linkedEntityType: entry.linkedEntityType,
        linkedEntityId: entry.linkedEntityId,
        occurredAt: entry.occurredAt,
        createdAt: entry.createdAt,
      },
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
      endpoint: "/api/teams/[teamId]/journey/entries",
      method: "POST",
      teamId,
    });
  }
}

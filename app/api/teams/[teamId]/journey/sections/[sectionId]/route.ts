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

/**
 * PATCH /api/teams/[teamId]/journey/sections/[sectionId]
 * Update a journey section (creates revision). Access: Admin or Physician with FULL.
 */
export async function PATCH(
  req: Request,
  {
    params,
  }: {
    params:
      | { teamId: string; sectionId: string }
      | Promise<{ teamId: string; sectionId: string }>;
  },
) {
  try {
    const { teamId, sectionId } =
      params instanceof Promise ? await params : params;

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
            "Only Admins and Physicians with full access can edit the Patient Journey.",
        },
        { status: 403 },
      );
    }

    const rateLimitResult = await rateLimit(
      req,
      "PATCH",
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
    const content = body.content as Record<string, unknown> | null | undefined;
    if (content === undefined) {
      return NextResponse.json(
        { error: "Bad request", message: "content is required." },
        { status: 400 },
      );
    }

    const section = await prisma.journeySection.findFirst({
      where: { id: sectionId, journey: { teamId } },
      include: { journey: true },
    });

    if (!section) {
      return NextResponse.json(
        { error: "Not found", message: "Section not found." },
        { status: 404 },
      );
    }

    const previousContent = section.content as object;
    const newContent = content ?? {};

    await prisma.$transaction([
      prisma.journeySectionRevision.create({
        data: {
          sectionId: section.id,
          previousContent: previousContent as object,
          newContent: newContent as object,
          editedById: user.id,
        },
      }),
      prisma.journeySection.update({
        where: { id: section.id },
        data: {
          content: newContent as object,
          updatedById: user.id,
          version: { increment: 1 },
        },
      }),
    ]);

    await createAuditLog({
      teamId,
      actorId: user.id,
      action: AUDIT_ACTIONS.JOURNEY_SECTION_UPDATED,
      entityType: "JourneySection",
      entityId: section.id,
      metadata: { sectionKey: section.key },
    });

    const updated = await prisma.journeySection.findUnique({
      where: { id: section.id },
      include: {
        updatedBy: {
          select: { id: true, name: true, firstName: true, lastName: true },
        },
      },
    });

    const response = NextResponse.json({
      section: updated
        ? {
            id: updated.id,
            key: updated.key,
            title: updated.title,
            content: updated.content,
            version: updated.version,
            updatedAt: updated.updatedAt,
            updatedBy: updated.updatedBy
              ? {
                  id: updated.updatedBy.id,
                  name:
                    updated.updatedBy.name ||
                    [updated.updatedBy.firstName, updated.updatedBy.lastName]
                      .filter(Boolean)
                      .join(" "),
                }
              : null,
          }
        : null,
    });

    addRateLimitHeaders(
      response.headers,
      rateLimitResult.limit,
      rateLimitResult.remaining,
      rateLimitResult.reset,
    );
    return response;
  } catch (error) {
    const paramsRes =
      typeof params === "object" && "then" in params
        ? await (params as Promise<{ teamId: string }>)
        : (params as { teamId: string });
    return createInternalErrorResponse(error, {
      endpoint: "/api/teams/[teamId]/journey/sections/[sectionId]",
      method: "PATCH",
      teamId: paramsRes.teamId,
    });
  }
}

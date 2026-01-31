import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, addRateLimitHeaders } from "@/lib/rate-limit";
import { createMoodSchema, validateRequest } from "@/lib/validations";
import {
  requireTeamAccess,
  extractTeamId,
  isAuthError,
} from "@/lib/auth-middleware";
import {
  createValidationErrorResponse,
  createInternalErrorResponse,
} from "@/lib/error-handler";
import { createSystemJourneyEntry } from "@/lib/patient-journey-entries";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";

// GET /api/teams/[teamId]/moods - Get moods for a team
export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } | Promise<{ teamId: string }> },
) {
  try {
    // Extract teamId and check authorization
    const teamId = await extractTeamId(params);
    const authResult = await requireTeamAccess(teamId, "READ_ONLY"); // Read operations allow READ_ONLY

    if (isAuthError(authResult)) {
      return authResult.response;
    }

    const { user } = authResult;

    // Rate limiting
    const rateLimitResult = await rateLimit(
      request,
      "GET",
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

    // Get moods for this team, ordered by most recent first
    const moods = await prisma.mood.findMany({
      where: {
        teamId,
      },
      include: {
        loggedBy: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        observedAt: "desc",
      },
      take: 30, // Last 30 mood entries
    });

    const response = NextResponse.json(moods);
    addRateLimitHeaders(
      response.headers,
      rateLimitResult.limit,
      rateLimitResult.remaining,
      rateLimitResult.reset,
    );
    return response;
  } catch (error) {
    const teamId = await extractTeamId(params).catch(() => "unknown");
    return createInternalErrorResponse(error, {
      endpoint: "/api/teams/[teamId]/moods",
      method: "GET",
      teamId,
    });
  }
}

// POST /api/teams/[teamId]/moods - Create a new mood entry
export async function POST(
  request: NextRequest,
  { params }: { params: { teamId: string } | Promise<{ teamId: string }> },
) {
  try {
    // Extract teamId and check authorization
    const teamId = await extractTeamId(params);
    const authResult = await requireTeamAccess(teamId, "FULL"); // Creating moods requires FULL access

    if (isAuthError(authResult)) {
      return authResult.response;
    }

    const { user } = authResult;

    // Rate limiting
    const rateLimitResult = await rateLimit(
      request,
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

    // Validate request body
    const validation = await validateRequest(request, createMoodSchema);
    if (validation.error) {
      return createValidationErrorResponse(validation.error, {
        endpoint: "/api/teams/[teamId]/moods",
        method: "POST",
        teamId,
      });
    }
    const { rating, notes, observedAt } = validation.data;

    // Create mood entry
    const observed = observedAt ? new Date(observedAt) : new Date();
    const mood = await prisma.mood.create({
      data: {
        teamId,
        loggedById: user.id,
        rating: rating as any, // Type assertion for enum
        notes: notes || null,
        observedAt: observed,
      },
      include: {
        loggedBy: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true,
          },
        },
      },
    });

    // Journey timeline: create MOOD_EVENT when agitated, or 3+ moods in 6h, or positive→agitated same day
    const AGITATED = ["ANXIOUS", "IRRITABLE", "RESTLESS", "CONFUSED"];
    const POSITIVE_NEUTRAL = ["CALM", "CONTENT", "NEUTRAL", "RELAXED"];
    const isAgitated = AGITATED.includes(mood.rating);
    const sixHoursAgo = new Date(observed.getTime() - 6 * 60 * 60 * 1000);
    const sameDayStart = new Date(observed);
    sameDayStart.setHours(0, 0, 0, 0);
    const sameDayEnd = new Date(sameDayStart);
    sameDayEnd.setHours(23, 59, 59, 999);

    const [countLast6h, previousSameDay] = await Promise.all([
      prisma.mood.count({
        where: { teamId, observedAt: { gte: sixHoursAgo, lte: observed } },
      }),
      prisma.mood.findFirst({
        where: {
          teamId,
          id: { not: mood.id },
          observedAt: { gte: sameDayStart, lte: sameDayEnd },
        },
        orderBy: { observedAt: "desc" },
        select: { rating: true },
      }),
    ]);
    const wasPositiveThenAgitated =
      previousSameDay &&
      POSITIVE_NEUTRAL.includes(previousSameDay.rating) &&
      isAgitated;
    if (isAgitated || countLast6h >= 3 || wasPositiveThenAgitated) {
      await createSystemJourneyEntry({
        teamId,
        type: "MOOD_EVENT",
        title: isAgitated
          ? "Agitated mood logged"
          : countLast6h >= 3
            ? "Multiple mood logs in 6h"
            : "Mood shift to agitated",
        content: { rating: mood.rating, notes: mood.notes ?? undefined },
        linkedEntityType: "Mood",
        linkedEntityId: mood.id,
        occurredAt: observed,
      });
    }

    await createAuditLog({
      teamId,
      actorId: user.id,
      action: AUDIT_ACTIONS.MOOD_LOGGED,
      entityType: "Mood",
      entityId: mood.id,
      metadata: { rating: mood.rating, observedAt: observed.toISOString() },
    });

    const response = NextResponse.json(mood, { status: 201 });
    addRateLimitHeaders(
      response.headers,
      rateLimitResult.limit,
      rateLimitResult.remaining,
      rateLimitResult.reset,
    );
    return response;
  } catch (error) {
    const teamId = await extractTeamId(params).catch(() => "unknown");
    return createInternalErrorResponse(error, {
      endpoint: "/api/teams/[teamId]/moods",
      method: "POST",
      teamId,
    });
  }
}

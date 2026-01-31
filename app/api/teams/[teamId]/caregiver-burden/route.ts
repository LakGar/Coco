import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { rateLimit, addRateLimitHeaders } from "@/lib/rate-limit";
import {
  requireTeamAccess,
  extractTeamId,
  isAuthError,
} from "@/lib/auth-middleware";
import {
  createValidationErrorResponse,
  createInternalErrorResponse,
} from "@/lib/error-handler";
import { z } from "zod";
import { calculateBurdenLevel } from "@/lib/zbi-questions";
import { log } from "@/lib/logger";
import { createSystemJourneyEntry } from "@/lib/patient-journey-entries";

const caregiverBurdenSchema = z.object({
  responses: z.record(z.string(), z.number().min(0).max(4)),
  notes: z.string().max(5000).optional().nullable(),
});

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

    const { user } = authResult;

    // Rate limiting
    const rateLimitResult = await rateLimit(
      req,
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

    // Get all caregiver burden scales for this user in this team
    const scales = await prisma.caregiverBurdenScale.findMany({
      where: {
        teamId: teamId,
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10, // Get last 10 assessments
    });

    const response = NextResponse.json({ scales });
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
      endpoint: "/api/teams/[teamId]/caregiver-burden",
      method: "GET",
      teamId,
    });
  }
}

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

    // Only caregivers and family members with admin access can complete the questionnaire
    if (
      !membership.isAdmin ||
      (membership.teamRole !== "CAREGIVER" && membership.teamRole !== "FAMILY")
    ) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message:
            "Only caregivers and family members with admin access can complete this questionnaire.",
        },
        { status: 403 },
      );
    }

    // Rate limiting
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

    // Validate request body
    const body = await req.json();
    const validation = caregiverBurdenSchema.safeParse(body);

    if (!validation.success) {
      return createValidationErrorResponse(validation.error, {
        endpoint: "/api/teams/[teamId]/caregiver-burden",
        method: "POST",
        teamId,
        userId: user.id,
      });
    }

    const { responses } = validation.data;

    // Calculate total score
    const totalScore = Object.values(responses).reduce(
      (sum, score) => sum + (score as number),
      0,
    );
    const burdenLevel = calculateBurdenLevel(totalScore);

    // Create caregiver burden scale record
    const scale = await prisma.caregiverBurdenScale.create({
      data: {
        teamId: teamId,
        userId: user.id,
        responses: responses as any, // JSON field
        totalScore,
        burdenLevel,
      },
    });

    log.info(
      {
        type: "caregiver_burden_scale_created",
        teamId,
        userId: user.id,
        totalScore,
        burdenLevel,
      },
      "Caregiver burden scale completed",
    );

    // Journey timeline: always create BURDEN_EVENT with delta
    const previous = await prisma.caregiverBurdenScale.findFirst({
      where: { teamId, id: { not: scale.id } },
      orderBy: { createdAt: "desc" },
      select: { totalScore: true },
    });
    const delta = previous != null ? totalScore - previous.totalScore : null;
    await createSystemJourneyEntry({
      teamId,
      type: "BURDEN_EVENT",
      title: "Burden scale completed",
      content: { totalScore, burdenLevel, delta },
      linkedEntityType: "CaregiverBurdenScale",
      linkedEntityId: scale.id,
      occurredAt: scale.createdAt,
    });

    const response = NextResponse.json({ scale }, { status: 201 });
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
      endpoint: "/api/teams/[teamId]/caregiver-burden",
      method: "POST",
      teamId,
    });
  }
}

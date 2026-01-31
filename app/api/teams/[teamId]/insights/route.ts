import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  requireTeamAccess,
  extractTeamId,
  isAuthError,
} from "@/lib/auth-middleware";
import { createInternalErrorResponse } from "@/lib/error-handler";
import { rateLimit, addRateLimitHeaders } from "@/lib/rate-limit";
import {
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  endOfWeek,
} from "date-fns";

/**
 * GET /api/teams/[teamId]/insights
 * Returns aggregated stats for the team (tasks, medications, activity).
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

    const { user } = authResult;

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

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekStart = startOfWeek(subDays(now, 7), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const next7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      tasksCompletedToday,
      tasksCompletedThisWeek,
      tasksDueToday,
      tasksOverdue,
      tasksDueNext7Days,
      tasksByType,
      medicationsTotal,
      medicationsDoneThisWeek,
      recentAuditCount,
      memberCount,
    ] = await Promise.all([
      prisma.task.count({
        where: {
          teamId,
          status: "DONE",
          updatedAt: { gte: todayStart, lte: todayEnd },
          isPersonal: false,
        },
      }),
      prisma.task.count({
        where: {
          teamId,
          status: "DONE",
          updatedAt: { gte: weekStart, lte: now },
          isPersonal: false,
        },
      }),
      prisma.task.count({
        where: {
          teamId,
          status: { not: "DONE" },
          dueDate: { gte: todayStart, lte: todayEnd },
          isPersonal: false,
        },
      }),
      prisma.task.count({
        where: {
          teamId,
          status: { not: "DONE" },
          dueDate: { lt: todayStart },
          isPersonal: false,
        },
      }),
      prisma.task.findMany({
        where: {
          teamId,
          status: { not: "DONE" },
          dueDate: { gte: now, lte: next7d },
          isPersonal: false,
        },
        select: { id: true, name: true, dueDate: true, type: true },
        orderBy: { dueDate: "asc" },
        take: 10,
      }),
      prisma.task.groupBy({
        by: ["type"],
        where: {
          teamId,
          status: { not: "DONE" },
          isPersonal: false,
          type: { not: null },
        },
        _count: { id: true },
      }),
      prisma.task.count({
        where: {
          teamId,
          type: "MEDICATION",
          isPersonal: false,
        },
      }),
      prisma.task.count({
        where: {
          teamId,
          type: "MEDICATION",
          status: "DONE",
          updatedAt: { gte: weekStart, lte: now },
          isPersonal: false,
        },
      }),
      prisma.auditLog.count({
        where: { teamId },
      }),
      prisma.careTeamMember.count({
        where: { teamId, userId: { not: null } },
      }),
    ]);

    const typeCounts = Object.fromEntries(
      tasksByType.map((g) => [g.type ?? "OTHER", g._count.id]),
    );

    const insights = {
      tasksCompletedToday,
      tasksCompletedThisWeek,
      tasksDueToday,
      tasksOverdue,
      tasksDueNext7Days: tasksDueNext7Days.map((t) => ({
        id: t.id,
        name: t.name,
        dueDate: t.dueDate?.toISOString() ?? null,
        type: t.type,
      })),
      tasksByType: typeCounts,
      medicationsTotal,
      medicationsDoneThisWeek,
      medicationsAdherencePercent:
        medicationsTotal > 0
          ? Math.round((medicationsDoneThisWeek / medicationsTotal) * 100)
          : null,
      recentAuditCount,
      memberCount,
    };

    const response = NextResponse.json(insights);
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
      endpoint: "/api/teams/[teamId]/insights",
      method: "GET",
      teamId,
    });
  }
}

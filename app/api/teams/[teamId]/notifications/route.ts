import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { rateLimit, addRateLimitHeaders } from "@/lib/rate-limit";
import {
  requireTeamAccess,
  extractTeamId,
  isAuthError,
} from "@/lib/auth-middleware";
import { createInternalErrorResponse } from "@/lib/error-handler";

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

    // Get notifications for this user in this team
    const notifications = await prisma.notification.findMany({
      where: {
        teamId: teamId,
        userId: user.id,
      },
      orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
      take: 100, // Limit to 100 most recent
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    const response = NextResponse.json({ notifications, unreadCount });
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
      endpoint: "/api/teams/[teamId]/notifications",
      method: "GET",
      teamId,
    });
  }
}

export async function PATCH(
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
      "PATCH",
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

    const body = await req.json();
    const { action, notificationIds } = body;

    if (action === "markAllRead") {
      // Mark all unread notifications as read for this user in this team
      await prisma.notification.updateMany({
        where: {
          teamId: teamId,
          userId: user.id,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return NextResponse.json({ success: true });
    }

    if (action === "markRead" && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          teamId: teamId,
          userId: user.id,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Invalid action or missing notificationIds" },
      { status: 400 },
    );
  } catch (error) {
    const teamId = await extractTeamId(params);
    return createInternalErrorResponse(error, {
      endpoint: "/api/teams/[teamId]/notifications",
      method: "PATCH",
      teamId,
    });
  }
}

export async function DELETE(
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
      "DELETE",
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
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Missing notification id" },
        { status: 400 },
      );
    }

    await prisma.notification.deleteMany({
      where: {
        id,
        teamId,
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const teamId = await extractTeamId(params);
    return createInternalErrorResponse(error, {
      endpoint: "/api/teams/[teamId]/notifications",
      method: "DELETE",
      teamId,
    });
  }
}

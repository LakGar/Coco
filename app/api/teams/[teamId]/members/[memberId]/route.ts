import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { AccessLevel } from "@prisma/client";
import {
  requireTeamAccess,
  extractTeamId,
  isAuthError,
} from "@/lib/auth-middleware";
import {
  createValidationErrorResponse,
  createNotFoundErrorResponse,
  createInternalErrorResponse,
} from "@/lib/error-handler";
import { rateLimit, addRateLimitHeaders } from "@/lib/rate-limit";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";
import { createAndNotify } from "@/lib/notifications";

export async function PATCH(
  req: Request,
  {
    params,
  }: {
    params:
      | { teamId: string; memberId: string }
      | Promise<{ teamId: string; memberId: string }>;
  },
) {
  try {
    // Extract teamId and check authorization (admin required)
    const resolvedParams = params instanceof Promise ? await params : params;
    const { teamId, memberId } = resolvedParams;
    const authResult = await requireTeamAccess(teamId, "FULL"); // Need FULL access, but admin check is separate

    if (isAuthError(authResult)) {
      return authResult.response;
    }

    const { user, membership } = authResult;

    // Verify current user is an admin of this team
    if (!membership.isAdmin) {
      return NextResponse.json(
        { error: "Only admins can update member permissions" },
        { status: 403 },
      );
    }

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

    // Parse request body
    const body = await req.json();
    const { accessLevel, isAdmin } = body;

    // Validate accessLevel if provided
    if (accessLevel && !["FULL", "READ_ONLY"].includes(accessLevel)) {
      return createValidationErrorResponse(
        new Error("Invalid access level. Must be FULL or READ_ONLY") as any,
        {
          endpoint: "/api/teams/[teamId]/members/[memberId]",
          method: "PATCH",
          teamId,
          memberId,
        },
      );
    }

    // Find the member to update
    const memberToUpdate = await prisma.careTeamMember.findFirst({
      where: {
        teamId: teamId,
        userId: memberId,
      },
    });

    if (!memberToUpdate) {
      return createNotFoundErrorResponse("Member not found in this team", {
        endpoint: "/api/teams/[teamId]/members/[memberId]",
        method: "PATCH",
        teamId,
        memberId,
      });
    }

    // Find the team creator (first admin by joinedAt date)
    const teamCreator = await prisma.careTeamMember.findFirst({
      where: {
        teamId: teamId,
        isAdmin: true,
      },
      orderBy: {
        joinedAt: "asc",
      },
    });

    // Prevent removing admin from the team creator
    if (memberToUpdate.id === teamCreator?.id && isAdmin === false) {
      return createValidationErrorResponse(
        new Error("Cannot remove admin status from the team creator") as any,
        {
          endpoint: "/api/teams/[teamId]/members/[memberId]",
          method: "PATCH",
          teamId,
          memberId,
        },
      );
    }

    // Prevent admin from removing their own admin status (unless they're the creator, which is already handled above)
    if (memberToUpdate.userId === user.id && isAdmin === false) {
      return createValidationErrorResponse(
        new Error("You cannot remove your own admin status") as any,
        {
          endpoint: "/api/teams/[teamId]/members/[memberId]",
          method: "PATCH",
          teamId,
          memberId,
        },
      );
    }

    const updatedMember = await prisma.careTeamMember.update({
      where: { id: memberToUpdate.id },
      data: {
        ...(accessLevel && { accessLevel: accessLevel as AccessLevel }),
        ...(typeof isAdmin === "boolean" && { isAdmin }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true,
            role: true,
          },
        },
      },
    });

    await createAuditLog({
      teamId,
      actorId: user.id,
      action: AUDIT_ACTIONS.PERMISSION_CHANGED,
      entityType: "CareTeamMember",
      entityId: memberToUpdate.id,
      metadata: {
        targetUserId: memberToUpdate.userId,
        isAdmin: updatedMember.isAdmin,
        accessLevel: updatedMember.accessLevel,
      },
    });

    if (memberToUpdate.userId) {
      await createAndNotify({
        teamId,
        userId: memberToUpdate.userId,
        type: "PERMISSION_CHANGE",
        title: "Your permissions were updated",
        message: `Your team permissions have been changed. You are now ${updatedMember.isAdmin ? "an admin" : "a member"} with ${updatedMember.accessLevel} access.`,
        linkUrl: "/dashboard/team/permissions",
        linkLabel: "View permissions",
      }).catch(() => {});
    }

    const response = NextResponse.json({
      success: true,
      member: {
        id: updatedMember.user!.id,
        name:
          updatedMember.user!.name ||
          `${updatedMember.user!.firstName || ""} ${updatedMember.user!.lastName || ""}`.trim() ||
          updatedMember.user!.email,
        email: updatedMember.user!.email,
        image: updatedMember.user!.imageUrl || undefined,
        role: updatedMember.teamRole,
        isAdmin: updatedMember.isAdmin,
        accessLevel: updatedMember.accessLevel,
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
    const resolvedParams = params instanceof Promise ? await params : params;
    const { teamId } = resolvedParams;
    return createInternalErrorResponse(error, {
      endpoint: "/api/teams/[teamId]/members/[memberId]",
      method: "PATCH",
      teamId,
    });
  }
}

export async function DELETE(
  req: Request,
  {
    params,
  }: {
    params:
      | { teamId: string; memberId: string }
      | Promise<{ teamId: string; memberId: string }>;
  },
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const { teamId, memberId } = resolvedParams;
    const authResult = await requireTeamAccess(teamId, "FULL");

    if (isAuthError(authResult)) {
      return authResult.response;
    }

    const { user, membership } = authResult;

    // Only admins can remove members
    if (!membership.isAdmin) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Only admins can remove team members.",
        },
        { status: 403 },
      );
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(
      req,
      "DELETE",
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

    // Find the member to remove
    const memberToRemove = await prisma.careTeamMember.findFirst({
      where: {
        teamId: teamId,
        userId: memberId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!memberToRemove) {
      return createNotFoundErrorResponse("Member not found in this team", {
        endpoint: "/api/teams/[teamId]/members/[memberId]",
        method: "DELETE",
        teamId,
        memberId,
      });
    }

    // Prevent removing yourself
    if (memberToRemove.userId === user.id) {
      return NextResponse.json(
        { error: "You cannot remove yourself from the team" },
        { status: 400 },
      );
    }

    // Find the team creator (first admin by joinedAt date)
    const teamCreator = await prisma.careTeamMember.findFirst({
      where: {
        teamId: teamId,
        isAdmin: true,
      },
      orderBy: {
        joinedAt: "asc",
      },
    });

    // Prevent removing the team creator
    if (memberToRemove.id === teamCreator?.id) {
      return NextResponse.json(
        { error: "Cannot remove the team creator" },
        { status: 400 },
      );
    }

    const removedName =
      memberToRemove.user?.name || memberToRemove.user?.email || memberId;
    await createAuditLog({
      teamId,
      actorId: user.id,
      action: AUDIT_ACTIONS.MEMBER_REMOVED,
      entityType: "CareTeamMember",
      entityId: memberToRemove.id,
      metadata: { removedUserId: memberId, removedName },
    });

    await prisma.careTeamMember.delete({
      where: { id: memberToRemove.id },
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
    const resolvedParams = params instanceof Promise ? await params : params;
    return createInternalErrorResponse(error, {
      endpoint: "/api/teams/[teamId]/members/[memberId]",
      method: "DELETE",
      teamId: resolvedParams.teamId,
      memberId: resolvedParams.memberId,
    });
  }
}

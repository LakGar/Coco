import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  requireTeamAccess,
  extractTeamId,
  isAuthError,
} from "@/lib/auth-middleware";
import {
  createInternalErrorResponse,
  createValidationErrorResponse,
} from "@/lib/error-handler";
import { rateLimit, addRateLimitHeaders } from "@/lib/rate-limit";
import {
  inviteTeamMemberSchema,
  validateRequest,
  formatZodError,
} from "@/lib/validations";
import { sendInviteEmail } from "@/lib/email";
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit";
import { TeamRole, AccessLevel } from "@prisma/client";
import { randomBytes } from "crypto";
import { getDefaultPermissionsForAccessLevel } from "@/lib/permission-helpers";

export async function GET(
  req: Request,
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

    // Get all team members
    const team = await prisma.careTeam.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: {
            userId: { not: null }, // Only accepted members
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
          orderBy: {
            joinedAt: "asc",
          },
          // Include all permission fields
        },
        patient: {
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

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Format members for the frontend
    const members = team.members.map((member) => ({
      id: member.user!.id,
      name:
        member.user!.name ||
        `${member.user!.firstName || ""} ${member.user!.lastName || ""}`.trim() ||
        member.user!.email,
      email: member.user!.email,
      image: member.user!.imageUrl || undefined,
      role: member.teamRole,
      isAdmin: member.isAdmin,
      accessLevel: member.accessLevel,
      joinedAt: member.joinedAt.toISOString(),
      // Include granular permissions
      canViewTasks: member.canViewTasks,
      canCreateTasks: member.canCreateTasks,
      canEditTasks: member.canEditTasks,
      canDeleteTasks: member.canDeleteTasks,
      canViewNotes: member.canViewNotes,
      canCreateNotes: member.canCreateNotes,
      canEditNotes: member.canEditNotes,
      canDeleteNotes: member.canDeleteNotes,
      canViewRoutines: member.canViewRoutines,
      canCreateRoutines: member.canCreateRoutines,
      canEditRoutines: member.canEditRoutines,
      canDeleteRoutines: member.canDeleteRoutines,
      canViewContacts: member.canViewContacts,
      canCreateContacts: member.canCreateContacts,
      canEditContacts: member.canEditContacts,
      canDeleteContacts: member.canDeleteContacts,
      canViewMoods: member.canViewMoods,
      canCreateMoods: member.canCreateMoods,
      canViewBurdenScales: member.canViewBurdenScales,
      canCreateBurdenScales: member.canCreateBurdenScales,
      canViewMembers: member.canViewMembers,
      canInviteMembers: member.canInviteMembers,
      canRemoveMembers: member.canRemoveMembers,
      canManagePermissions: member.canManagePermissions,
    }));

    // Add patient if exists
    const patient = team.patient
      ? {
          id: team.patient.id,
          name:
            team.patient.name ||
            `${team.patient.firstName || ""} ${team.patient.lastName || ""}`.trim() ||
            team.patient.email,
          email: team.patient.email,
          image: team.patient.imageUrl || undefined,
          role: "PATIENT" as const,
          isAdmin: false,
          accessLevel: "FULL" as const,
          joinedAt: team.createdAt.toISOString(),
        }
      : null;

    // Find the team creator (first admin by joinedAt date)
    const teamCreator = await prisma.careTeamMember.findFirst({
      where: {
        teamId: teamId,
        isAdmin: true,
      },
      orderBy: {
        joinedAt: "asc",
      },
      select: {
        userId: true,
      },
    });

    // Get current user's membership with all permissions
    const currentUserMembership = await prisma.careTeamMember.findFirst({
      where: {
        teamId: teamId,
        userId: user.id,
      },
    });

    const response = NextResponse.json({
      team: {
        id: team.id,
        name: team.name,
        patientId: team.patientId,
      },
      members: members.map((m) => ({
        ...m,
        isTeamCreator: m.id === teamCreator?.userId,
      })),
      patient,
      currentUser: {
        id: user.id,
        isAdmin: authResult.membership.isAdmin,
        accessLevel: authResult.membership.accessLevel,
        // Include all granular permissions for current user
        canViewTasks: currentUserMembership?.canViewTasks ?? true,
        canCreateTasks: currentUserMembership?.canCreateTasks ?? true,
        canEditTasks: currentUserMembership?.canEditTasks ?? true,
        canDeleteTasks: currentUserMembership?.canDeleteTasks ?? true,
        canViewNotes: currentUserMembership?.canViewNotes ?? true,
        canCreateNotes: currentUserMembership?.canCreateNotes ?? true,
        canEditNotes: currentUserMembership?.canEditNotes ?? true,
        canDeleteNotes: currentUserMembership?.canDeleteNotes ?? true,
        canViewRoutines: currentUserMembership?.canViewRoutines ?? true,
        canCreateRoutines: currentUserMembership?.canCreateRoutines ?? true,
        canEditRoutines: currentUserMembership?.canEditRoutines ?? true,
        canDeleteRoutines: currentUserMembership?.canDeleteRoutines ?? true,
        canViewContacts: currentUserMembership?.canViewContacts ?? true,
        canCreateContacts: currentUserMembership?.canCreateContacts ?? true,
        canEditContacts: currentUserMembership?.canEditContacts ?? true,
        canDeleteContacts: currentUserMembership?.canDeleteContacts ?? true,
        canViewMoods: currentUserMembership?.canViewMoods ?? true,
        canCreateMoods: currentUserMembership?.canCreateMoods ?? true,
        canViewBurdenScales: currentUserMembership?.canViewBurdenScales ?? true,
        canCreateBurdenScales:
          currentUserMembership?.canCreateBurdenScales ?? true,
        canViewMembers: currentUserMembership?.canViewMembers ?? true,
        canInviteMembers: currentUserMembership?.canInviteMembers ?? false,
        canRemoveMembers: currentUserMembership?.canRemoveMembers ?? false,
        canManagePermissions:
          currentUserMembership?.canManagePermissions ?? false,
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
    const teamId = await extractTeamId(params).catch(() => "unknown");
    return createInternalErrorResponse(error, {
      endpoint: "/api/teams/[teamId]/members",
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
    // Extract teamId and check authorization (admin or FULL access required)
    const teamId = await extractTeamId(params);
    const authResult = await requireTeamAccess(teamId, "FULL");

    if (isAuthError(authResult)) {
      return authResult.response;
    }

    const { user, membership } = authResult;

    // Verify current user is an admin or has FULL access
    if (!membership.isAdmin && membership.accessLevel !== "FULL") {
      return NextResponse.json(
        {
          error:
            "Only admins or members with full access can invite team members",
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
    const validation = await validateRequest(req, inviteTeamMemberSchema);
    if (validation.error) {
      return createValidationErrorResponse(validation.error, {
        endpoint: "/api/teams/[teamId]/members",
        method: "POST",
        teamId,
      });
    }

    const { email, name, teamRole, isAdmin, accessLevel } = validation.data;

    // Check if team exists
    const team = await prisma.careTeam.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    // Check if user is already a member of this team
    if (existingUser) {
      const existingMembership = await prisma.careTeamMember.findFirst({
        where: {
          teamId,
          userId: existingUser.id,
        },
      });

      if (existingMembership) {
        return NextResponse.json(
          { error: "User is already a member of this team" },
          { status: 409 },
        );
      }
    }

    // Check if there's already a pending invite for this email
    const existingInvite = await prisma.careTeamMember.findFirst({
      where: {
        teamId,
        inviteEmail: email,
        acceptedAt: null,
      },
    });

    if (existingInvite) {
      // Check if invite is expired (7 days)
      if (existingInvite.invitedAt) {
        const daysSinceInvite = Math.floor(
          (Date.now() - existingInvite.invitedAt.getTime()) /
            (1000 * 60 * 60 * 24),
        );
        if (daysSinceInvite <= 7) {
          return NextResponse.json(
            {
              error:
                "An invitation has already been sent to this email address",
            },
            { status: 409 },
          );
        }
      }
    }

    // Generate unique invite code
    const inviteCode = randomBytes(32).toString("hex");

    // Get default permissions based on access level
    const defaultPermissions = getDefaultPermissionsForAccessLevel(
      (accessLevel || "FULL") as AccessLevel,
      isAdmin || false,
    );

    // Create team member with invite and default permissions
    const teamMember = await prisma.careTeamMember.create({
      data: {
        teamId,
        userId: existingUser?.id || null,
        teamRole: teamRole as TeamRole,
        isAdmin: isAdmin || false,
        accessLevel: (accessLevel || "FULL") as AccessLevel,
        inviteCode,
        inviteEmail: email,
        invitedName: name,
        invitedAt: new Date(),
        // Set default permissions based on access level
        ...defaultPermissions,
      },
      include: {
        team: {
          select: {
            name: true,
          },
        },
      },
    });

    // Send invite email
    const inviterName =
      user.name ||
      `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
      user.email;
    const emailResult = await sendInviteEmail({
      to: email,
      inviteCode,
      inviterName,
      teamName: team.name,
      role: teamRole,
      isPatient: teamRole === "PATIENT",
      invitedName: name,
    });

    if (!emailResult.success) {
      console.warn("Failed to send invite email:", emailResult.error);
    }

    await createAuditLog({
      teamId,
      actorId: user.id,
      action: AUDIT_ACTIONS.INVITE_SENT,
      entityType: "Invite",
      entityId: teamMember.id,
      metadata: { email, name, teamRole },
    });

    const response = NextResponse.json({
      success: true,
      member: {
        id: teamMember.id,
        email,
        name,
        teamRole,
        isAdmin: teamMember.isAdmin,
        accessLevel: teamMember.accessLevel,
        inviteCode,
        invitedAt: teamMember.invitedAt?.toISOString(),
        emailSent: emailResult.success,
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
    const teamId = await extractTeamId(params).catch(() => "unknown");
    return createInternalErrorResponse(error, {
      endpoint: "/api/teams/[teamId]/members",
      method: "POST",
      teamId,
    });
  }
}

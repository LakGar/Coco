import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
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
import { z } from "zod";
import { enforceReadOnlyRestrictions } from "@/lib/permission-helpers";

const permissionsSchema = z.object({
  // Tasks permissions
  canViewTasks: z.boolean().optional(),
  canCreateTasks: z.boolean().optional(),
  canEditTasks: z.boolean().optional(),
  canDeleteTasks: z.boolean().optional(),
  // Notes permissions
  canViewNotes: z.boolean().optional(),
  canCreateNotes: z.boolean().optional(),
  canEditNotes: z.boolean().optional(),
  canDeleteNotes: z.boolean().optional(),
  // Routines permissions
  canViewRoutines: z.boolean().optional(),
  canCreateRoutines: z.boolean().optional(),
  canEditRoutines: z.boolean().optional(),
  canDeleteRoutines: z.boolean().optional(),
  // Contacts permissions
  canViewContacts: z.boolean().optional(),
  canCreateContacts: z.boolean().optional(),
  canEditContacts: z.boolean().optional(),
  canDeleteContacts: z.boolean().optional(),
  // Moods permissions
  canViewMoods: z.boolean().optional(),
  canCreateMoods: z.boolean().optional(),
  // Caregiver Burden permissions
  canViewBurdenScales: z.boolean().optional(),
  canCreateBurdenScales: z.boolean().optional(),
  // Team management permissions
  canViewMembers: z.boolean().optional(),
  canInviteMembers: z.boolean().optional(),
  canRemoveMembers: z.boolean().optional(),
  canManagePermissions: z.boolean().optional(),
});

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
    const resolvedParams = params instanceof Promise ? await params : params;
    const { teamId, memberId } = resolvedParams;
    const authResult = await requireTeamAccess(teamId, "FULL");

    if (isAuthError(authResult)) {
      return authResult.response;
    }

    const { user, membership } = authResult;

    // Only admins can manage permissions
    if (!membership.isAdmin) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Only admins can manage permissions.",
        },
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

    // Validate request body
    const body = await req.json();
    const validation = permissionsSchema.safeParse(body);

    if (!validation.success) {
      return createValidationErrorResponse(validation.error, {
        endpoint: "/api/teams/[teamId]/members/[memberId]/permissions",
        method: "PATCH",
        teamId,
        memberId,
        userId: user.id,
      });
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
        endpoint: "/api/teams/[teamId]/members/[memberId]/permissions",
        method: "PATCH",
        teamId,
        memberId,
      });
    }

    // Admins have all permissions - don't allow changing admin permissions
    if (memberToUpdate.isAdmin) {
      return NextResponse.json(
        {
          error:
            "Cannot modify permissions for admins. Admins have full access.",
        },
        { status: 400 },
      );
    }

    // Enforce READ_ONLY restrictions if access level is READ_ONLY
    const enforcedPermissions = enforceReadOnlyRestrictions(
      validation.data,
      memberToUpdate.accessLevel,
      memberToUpdate.isAdmin,
    );

    // Update permissions
    const updatedMember = await prisma.careTeamMember.update({
      where: { id: memberToUpdate.id },
      data: {
        ...(enforcedPermissions.canViewTasks !== undefined && {
          canViewTasks: enforcedPermissions.canViewTasks,
        }),
        ...(enforcedPermissions.canCreateTasks !== undefined && {
          canCreateTasks: enforcedPermissions.canCreateTasks,
        }),
        ...(enforcedPermissions.canEditTasks !== undefined && {
          canEditTasks: enforcedPermissions.canEditTasks,
        }),
        ...(enforcedPermissions.canDeleteTasks !== undefined && {
          canDeleteTasks: enforcedPermissions.canDeleteTasks,
        }),
        ...(enforcedPermissions.canViewNotes !== undefined && {
          canViewNotes: enforcedPermissions.canViewNotes,
        }),
        ...(enforcedPermissions.canCreateNotes !== undefined && {
          canCreateNotes: enforcedPermissions.canCreateNotes,
        }),
        ...(enforcedPermissions.canEditNotes !== undefined && {
          canEditNotes: enforcedPermissions.canEditNotes,
        }),
        ...(enforcedPermissions.canDeleteNotes !== undefined && {
          canDeleteNotes: enforcedPermissions.canDeleteNotes,
        }),
        ...(enforcedPermissions.canViewRoutines !== undefined && {
          canViewRoutines: enforcedPermissions.canViewRoutines,
        }),
        ...(enforcedPermissions.canCreateRoutines !== undefined && {
          canCreateRoutines: enforcedPermissions.canCreateRoutines,
        }),
        ...(enforcedPermissions.canEditRoutines !== undefined && {
          canEditRoutines: enforcedPermissions.canEditRoutines,
        }),
        ...(enforcedPermissions.canDeleteRoutines !== undefined && {
          canDeleteRoutines: enforcedPermissions.canDeleteRoutines,
        }),
        ...(enforcedPermissions.canViewContacts !== undefined && {
          canViewContacts: enforcedPermissions.canViewContacts,
        }),
        ...(enforcedPermissions.canCreateContacts !== undefined && {
          canCreateContacts: enforcedPermissions.canCreateContacts,
        }),
        ...(enforcedPermissions.canEditContacts !== undefined && {
          canEditContacts: enforcedPermissions.canEditContacts,
        }),
        ...(enforcedPermissions.canDeleteContacts !== undefined && {
          canDeleteContacts: enforcedPermissions.canDeleteContacts,
        }),
        ...(enforcedPermissions.canViewMoods !== undefined && {
          canViewMoods: enforcedPermissions.canViewMoods,
        }),
        ...(enforcedPermissions.canCreateMoods !== undefined && {
          canCreateMoods: enforcedPermissions.canCreateMoods,
        }),
        ...(enforcedPermissions.canViewBurdenScales !== undefined && {
          canViewBurdenScales: enforcedPermissions.canViewBurdenScales,
        }),
        ...(enforcedPermissions.canCreateBurdenScales !== undefined && {
          canCreateBurdenScales: enforcedPermissions.canCreateBurdenScales,
        }),
        ...(enforcedPermissions.canViewMembers !== undefined && {
          canViewMembers: enforcedPermissions.canViewMembers,
        }),
        ...(enforcedPermissions.canInviteMembers !== undefined && {
          canInviteMembers: enforcedPermissions.canInviteMembers,
        }),
        ...(enforcedPermissions.canRemoveMembers !== undefined && {
          canRemoveMembers: enforcedPermissions.canRemoveMembers,
        }),
        ...(enforcedPermissions.canManagePermissions !== undefined && {
          canManagePermissions: enforcedPermissions.canManagePermissions,
        }),
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
        canViewTasks: updatedMember.canViewTasks,
        canCreateTasks: updatedMember.canCreateTasks,
        canEditTasks: updatedMember.canEditTasks,
        canDeleteTasks: updatedMember.canDeleteTasks,
        canViewNotes: updatedMember.canViewNotes,
        canCreateNotes: updatedMember.canCreateNotes,
        canEditNotes: updatedMember.canEditNotes,
        canDeleteNotes: updatedMember.canDeleteNotes,
        canViewRoutines: updatedMember.canViewRoutines,
        canCreateRoutines: updatedMember.canCreateRoutines,
        canEditRoutines: updatedMember.canEditRoutines,
        canDeleteRoutines: updatedMember.canDeleteRoutines,
        canViewContacts: updatedMember.canViewContacts,
        canCreateContacts: updatedMember.canCreateContacts,
        canEditContacts: updatedMember.canEditContacts,
        canDeleteContacts: updatedMember.canDeleteContacts,
        canViewMoods: updatedMember.canViewMoods,
        canCreateMoods: updatedMember.canCreateMoods,
        canViewBurdenScales: updatedMember.canViewBurdenScales,
        canCreateBurdenScales: updatedMember.canCreateBurdenScales,
        canViewMembers: updatedMember.canViewMembers,
        canInviteMembers: updatedMember.canInviteMembers,
        canRemoveMembers: updatedMember.canRemoveMembers,
        canManagePermissions: updatedMember.canManagePermissions,
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
    return createInternalErrorResponse(error, {
      endpoint: "/api/teams/[teamId]/members/[memberId]/permissions",
      method: "PATCH",
      teamId: resolvedParams.teamId,
      memberId: resolvedParams.memberId,
    });
  }
}

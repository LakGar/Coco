import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { requireTeamAccess, extractTeamId, isAuthError } from '@/lib/auth-middleware'
import { createValidationErrorResponse, createInternalErrorResponse } from '@/lib/error-handler'
import { rateLimit, addRateLimitHeaders } from '@/lib/rate-limit'
import { sendInviteEmail } from '@/lib/email'
import { z } from 'zod'
import { log, loggerUtils } from '@/lib/logger'

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().max(200).optional().nullable(),
  role: z.enum(["CAREGIVER", "FAMILY", "PHYSICIAN"]),
  accessLevel: z.enum(["FULL", "READ_ONLY"]),
})

export async function POST(
  req: Request,
  { params }: { params: { teamId: string } | Promise<{ teamId: string }> }
) {
  try {
    const teamId = await extractTeamId(params)
    const authResult = await requireTeamAccess(teamId, "FULL")

    if (isAuthError(authResult)) {
      return authResult.response
    }

    const { user, membership } = authResult

    // Only admins can invite members
    if (!membership.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Only admins can invite team members.' },
        { status: 403 }
      )
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(req, "POST", user.clerkId || user.id)
    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
        },
        { status: 429 }
      )
      addRateLimitHeaders(response.headers, rateLimitResult.limit, rateLimitResult.remaining, rateLimitResult.reset)
      return response
    }

    // Validate request body
    const body = await req.json()
    const validation = inviteSchema.safeParse(body)

    if (!validation.success) {
      return createValidationErrorResponse(validation.error, {
        endpoint: "/api/teams/[teamId]/invites",
        method: "POST",
        teamId,
        userId: user.id,
      })
    }

    const { email, name, role, accessLevel } = validation.data

    // Check if user is already a member
    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim() },
      include: {
        teamMemberships: {
          where: { teamId },
        },
      },
    })

    if (existingUser && existingUser.teamMemberships.length > 0) {
      return NextResponse.json(
        { error: 'User is already a member of this team' },
        { status: 409 }
      )
    }

    // Check if there's already a pending invite for this email
    const existingInvite = await prisma.careTeamMember.findFirst({
      where: {
        teamId,
        inviteEmail: email.trim(),
        userId: null, // Pending invite
        acceptedAt: null,
      },
    })

    if (existingInvite) {
      return NextResponse.json(
        { error: 'An invitation has already been sent to this email address' },
        { status: 409 }
      )
    }

    // Get team info
    const team = await prisma.careTeam.findUnique({
      where: { id: teamId },
      select: { name: true },
    })

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }

    // Generate invite code
    const inviteCode = randomBytes(16).toString('hex')
    const invitedName = name?.trim() || email.split('@')[0]

    // Create invite
    const invite = await prisma.careTeamMember.create({
      data: {
        teamId: teamId,
        userId: null, // Will be set when they accept
        teamRole: role,
        isAdmin: false, // New members are not admins by default
        accessLevel: accessLevel,
        // Set default permissions based on access level
        canViewTasks: true,
        canCreateTasks: accessLevel === 'FULL',
        canEditTasks: accessLevel === 'FULL',
        canDeleteTasks: false, // Only admins can delete
        canViewNotes: true,
        canCreateNotes: accessLevel === 'FULL',
        canEditNotes: accessLevel === 'FULL',
        canDeleteNotes: false,
        canViewRoutines: true,
        canCreateRoutines: accessLevel === 'FULL',
        canEditRoutines: accessLevel === 'FULL',
        canDeleteRoutines: false,
        canViewContacts: true,
        canCreateContacts: accessLevel === 'FULL',
        canEditContacts: accessLevel === 'FULL',
        canDeleteContacts: false,
        canViewMoods: true,
        canCreateMoods: accessLevel === 'FULL',
        canViewBurdenScales: accessLevel === 'FULL',
        canCreateBurdenScales: false, // Only caregivers/family with admin
        canViewMembers: true,
        canInviteMembers: false,
        canRemoveMembers: false,
        canManagePermissions: false,
        inviteCode: inviteCode,
        inviteEmail: email.trim(),
        invitedName: invitedName,
        invitedAt: new Date(),
      },
    })

    // Send invite email
    try {
      const inviterName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Team Admin'
      await sendInviteEmail({
        to: email.trim(),
        inviteCode: inviteCode,
        inviterName: inviterName,
        teamName: team.name,
        role: role,
        isPatient: false,
        invitedName: invitedName,
      })
      log.info({ type: 'team_invite_sent', teamId, email: email.trim(), inviteCode }, 'Team member invite sent')
    } catch (error) {
      loggerUtils.logError(error, { type: 'team_invite_email_error', teamId, email: email.trim() })
      // Don't fail the request if email fails - invite is still created
    }

    const response = NextResponse.json({
      success: true,
      invite: {
        id: invite.id,
        email: invite.inviteEmail,
        code: invite.inviteCode,
      },
    }, { status: 201 })
    addRateLimitHeaders(response.headers, rateLimitResult.limit, rateLimitResult.remaining, rateLimitResult.reset)
    return response
  } catch (error) {
    const teamId = await extractTeamId(params)
    return createInternalErrorResponse(error, {
      endpoint: "/api/teams/[teamId]/invites",
      method: "POST",
      teamId,
    })
  }
}

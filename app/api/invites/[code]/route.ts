import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { createInternalErrorResponse } from '@/lib/error-handler'

export async function GET(
  req: Request,
  { params }: { params: { code: string } | Promise<{ code: string }> }
) {
  try {
    // Handle both sync and async params (Next.js 16.1.3 vs 15+)
    const resolvedParams = params instanceof Promise ? await params : params
    const { code } = resolvedParams

    if (!code) {
      return NextResponse.json(
        { error: 'Invite code is required' },
        { status: 400 }
      )
    }

    // Find the invite by code
    const invite = await prisma.careTeamMember.findUnique({
      where: { inviteCode: code },
      include: {
        team: {
          include: {
            members: {
              where: {
                isAdmin: true,
                userId: { not: null },
              },
              include: {
                user: true,
              },
              take: 1,
            },
          },
        },
      },
    })

    if (!invite) {
      return NextResponse.json(
        { error: 'Invite not found or invalid' },
        { status: 404 }
      )
    }

    // Check if invite is expired (7 days)
    if (invite.invitedAt) {
      const daysSinceInvite = Math.floor(
        (Date.now() - invite.invitedAt.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysSinceInvite > 7) {
        return NextResponse.json(
          { error: 'This invitation has expired' },
          { status: 410 }
        )
      }
    }

    // Check if already accepted
    if (invite.acceptedAt) {
      return NextResponse.json(
        { error: 'This invitation has already been accepted' },
        { status: 409 }
      )
    }

    // Get inviter name (first admin user in the team)
    const adminMember = invite.team.members[0]
    const inviterName = adminMember?.user?.name || 
                       adminMember?.user?.firstName || 
                       'Team Admin'

    // Determine role display
    const roleDisplay = invite.isAdmin ? 'Admin' : 'Team Member'

    return NextResponse.json({
      teamName: invite.team.name,
      inviterName: inviterName,
      role: invite.teamRole,
      roleDisplay: roleDisplay,
      email: invite.inviteEmail || '',
      invitedName: invite.invitedName || '',
      invitedAt: invite.invitedAt?.toISOString() || null,
      isAdmin: invite.isAdmin,
      accessLevel: invite.accessLevel,
    })
  } catch (error) {
    const resolvedParams = params instanceof Promise ? await params : params
    const { code } = resolvedParams
    return createInternalErrorResponse(error, {
      endpoint: "/api/invites/[code]",
      method: "GET",
      inviteCode: code,
    })
  }
}


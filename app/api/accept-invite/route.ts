import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { log, loggerUtils } from '@/lib/logger'
import { createInternalErrorResponse } from '@/lib/error-handler'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json(
        { error: 'User not found in Clerk' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const { inviteCode } = body

    if (!inviteCode) {
      return NextResponse.json(
        { error: 'Invite code is required' },
        { status: 400 }
      )
    }

    // Find the invite
    const invite = await prisma.careTeamMember.findUnique({
      where: { inviteCode },
      include: {
        team: true,
      },
    })

    if (!invite) {
      return NextResponse.json(
        { error: 'Invite not found or invalid' },
        { status: 404 }
      )
    }

    // Log for debugging
    log.debug({ type: 'accept_invite_lookup', inviteId: invite.id, inviteCode: invite.inviteCode, teamId: invite.teamId }, 'Initial invite lookup')

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

    // Use a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Verify the invite hasn't been accepted by someone else (check first)
      const currentInvite = await tx.careTeamMember.findUnique({
        where: { inviteCode },
        select: {
          id: true,
          userId: true,
          teamRole: true,
          teamId: true,
          acceptedAt: true,
          inviteCode: true,
          inviteEmail: true,
        },
      })

      if (!currentInvite) {
        throw new Error('Invite not found')
      }

      // Log for debugging
      log.debug({ type: 'accept_invite_processing', inviteId: currentInvite.id, inviteCode: currentInvite.inviteCode, teamRole: currentInvite.teamRole }, 'Processing invite')

      if (currentInvite.acceptedAt) {
        throw new Error('This invitation has already been accepted')
      }

      if (currentInvite.userId) {
        throw new Error('This invitation has already been linked to a user')
      }

      // Check if user already exists in database
      let user = await tx.user.findUnique({
        where: { clerkId: userId },
      })

      if (!user) {
        // Create user in database
        user = await tx.user.create({
          data: {
            clerkId: userId,
            email: clerkUser.emailAddresses[0]?.emailAddress || '',
            firstName: clerkUser.firstName || null,
            lastName: clerkUser.lastName || null,
            name: clerkUser.firstName && clerkUser.lastName
              ? `${clerkUser.firstName} ${clerkUser.lastName}`
              : clerkUser.firstName || clerkUser.lastName || null,
            imageUrl: clerkUser.imageUrl || null,
            role: currentInvite.teamRole === 'PATIENT' ? 'PATIENT' : 'CAREGIVER', // Default role
            onboardingComplete: false, // They still need to fill out profile info
          },
        })
      }

      // Update the SPECIFIC invite record by ID to ensure we're updating the exact record
      // Initialize permissions based on access level (if not already set)
      const updatedMember = await tx.careTeamMember.update({
        where: { id: currentInvite.id }, // Use the ID from the record we just fetched to ensure exact match
        data: {
          userId: user.id,
          acceptedAt: new Date(),
          // Set default permissions if not already set (for existing invites)
          canViewTasks: true,
          canCreateTasks: currentInvite.accessLevel === 'FULL' ? true : undefined,
          canEditTasks: currentInvite.accessLevel === 'FULL' ? true : undefined,
          canDeleteTasks: false, // Only admins can delete
          canViewNotes: true,
          canCreateNotes: currentInvite.accessLevel === 'FULL' ? true : undefined,
          canEditNotes: currentInvite.accessLevel === 'FULL' ? true : undefined,
          canDeleteNotes: false,
          canViewRoutines: true,
          canCreateRoutines: currentInvite.accessLevel === 'FULL' ? true : undefined,
          canEditRoutines: currentInvite.accessLevel === 'FULL' ? true : undefined,
          canDeleteRoutines: false,
          canViewContacts: true,
          canCreateContacts: currentInvite.accessLevel === 'FULL' ? true : undefined,
          canEditContacts: currentInvite.accessLevel === 'FULL' ? true : undefined,
          canDeleteContacts: false,
          canViewMoods: true,
          canCreateMoods: currentInvite.accessLevel === 'FULL' ? true : undefined,
          canViewBurdenScales: currentInvite.accessLevel === 'FULL' ? true : undefined,
          canCreateBurdenScales: false, // Only caregivers/family with admin
          canViewMembers: true,
          canInviteMembers: false,
          canRemoveMembers: false,
          canManagePermissions: false,
        },
      })

      // Double-check: Verify the update was correct
      const verifyUpdate = await tx.careTeamMember.findUnique({
        where: { id: currentInvite.id },
        select: {
          id: true,
          userId: true,
          teamRole: true,
          inviteCode: true,
        },
      })

      log.debug({ type: 'accept_invite_verification', inviteId: verifyUpdate?.id, userId: verifyUpdate?.userId, expectedUserId: user.id, match: verifyUpdate?.userId === user.id }, 'After update verification')

      if (!verifyUpdate || verifyUpdate.userId !== user.id) {
        loggerUtils.logError(new Error('Update verification failed'), { type: 'accept_invite_verification_failed', verifyUpdate, expectedUserId: user.id })
        throw new Error('Failed to update invite record correctly')
      }

      if (verifyUpdate.teamRole !== currentInvite.teamRole) {
        loggerUtils.logError(new Error('Role mismatch'), { type: 'accept_invite_role_mismatch', expectedRole: currentInvite.teamRole, actualRole: verifyUpdate.teamRole })
        throw new Error('Invite role mismatch - wrong record updated')
      }

      // If this is a patient invite, update the CareTeam's patientId
      if (currentInvite.teamRole === 'PATIENT') {
        // Get the current team to check if patientId is already set
        const team = await tx.careTeam.findUnique({
          where: { id: currentInvite.teamId },
          select: { patientId: true },
        })

        // Only update if patientId is not already set
        if (team && !team.patientId) {
          await tx.careTeam.update({
            where: { id: currentInvite.teamId },
            data: {
              patientId: user.id,
            },
          })
        }
      }

      return { user, updatedMember }
    })

    return NextResponse.json({
      success: true,
      message: 'Invite accepted successfully',
      teamId: invite.teamId,
      teamName: invite.team.name,
      role: invite.teamRole,
    })
  } catch (error) {
    return createInternalErrorResponse(error, {
      endpoint: "/api/accept-invite",
      method: "POST",
    })
  }
}


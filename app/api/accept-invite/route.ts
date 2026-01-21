import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

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
    console.log(`[ACCEPT-INVITE] Initial invite lookup:`, {
      inviteId: invite.id,
      inviteCode: invite.inviteCode,
      teamRole: invite.teamRole,
      teamId: invite.teamId,
      userId: invite.userId,
      inviteEmail: invite.inviteEmail,
      requestedCode: inviteCode,
    })

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
      console.log(`[ACCEPT-INVITE] Processing invite:`, {
        inviteId: currentInvite.id,
        inviteCode: currentInvite.inviteCode,
        teamRole: currentInvite.teamRole,
        currentUserId: currentInvite.userId,
        acceptedAt: currentInvite.acceptedAt,
        clerkUserId: userId,
      })

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
      const updatedMember = await tx.careTeamMember.update({
        where: { id: currentInvite.id }, // Use the ID from the record we just fetched to ensure exact match
        data: {
          userId: user.id,
          acceptedAt: new Date(),
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

      console.log(`[ACCEPT-INVITE] After update verification:`, {
        inviteId: verifyUpdate?.id,
        inviteCode: verifyUpdate?.inviteCode,
        teamRole: verifyUpdate?.teamRole,
        userId: verifyUpdate?.userId,
        expectedUserId: user.id,
        match: verifyUpdate?.userId === user.id,
      })

      if (!verifyUpdate || verifyUpdate.userId !== user.id) {
        console.error(`[ACCEPT-INVITE] ERROR: Update verification failed!`, {
          verifyUpdate,
          expectedUserId: user.id,
        })
        throw new Error('Failed to update invite record correctly')
      }

      if (verifyUpdate.teamRole !== currentInvite.teamRole) {
        console.error(`[ACCEPT-INVITE] ERROR: Role mismatch!`, {
          expectedRole: currentInvite.teamRole,
          actualRole: verifyUpdate.teamRole,
        })
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
    console.error('Error accepting invite:', error)
    return NextResponse.json(
      {
        error: 'Error accepting invite',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}


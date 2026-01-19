import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { sendInviteEmail } from '@/lib/email'

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
    const {
      firstName,
      lastName,
      role,
      city,
      state,
      patientName,
      patientEmail,
      teamMembers,
    } = body

    // Validate required fields
    if (!firstName || !lastName || !role || !city || !state) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!patientName || !patientEmail) {
      return NextResponse.json(
        { error: 'Patient information is required' },
        { status: 400 }
      )
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get or create current user
      let user = await tx.user.findUnique({
        where: { clerkId: userId },
      })

      if (!user) {
        // Create user if doesn't exist
        user = await tx.user.create({
          data: {
            clerkId: userId,
            email: clerkUser.emailAddresses[0]?.emailAddress || '',
            firstName: clerkUser.firstName || firstName,
            lastName: clerkUser.lastName || lastName,
            name: `${firstName} ${lastName}`,
            role: role,
            city: city,
            state: state,
            onboardingComplete: false,
          },
        })
      } else {
        // Update user with onboarding data
        user = await tx.user.update({
          where: { clerkId: userId },
          data: {
            firstName: firstName,
            lastName: lastName,
            name: `${firstName} ${lastName}`,
            role: role,
            city: city,
            state: state,
          },
        })
      }

      // Create care team (patient User will be created when they accept invite)
      const teamName = `${patientName}'s Care Team`
      const careTeam = await tx.careTeam.create({
        data: {
          name: teamName,
          // Don't set patientId - it will be set when patient accepts invite
        },
      })

      // Create invite for patient (no User record created yet)
      const patientInviteCode = randomBytes(16).toString('hex')
      const patientMember = await tx.careTeamMember.create({
        data: {
          teamId: careTeam.id,
          userId: null, // Will be set when patient accepts invite
          teamRole: 'PATIENT',
          isAdmin: false,
          accessLevel: 'FULL',
          inviteCode: patientInviteCode,
          inviteEmail: patientEmail,
          invitedName: patientName,
          invitedAt: new Date(),
        },
      })

      // Add current user as team member (admin)
      await tx.careTeamMember.create({
        data: {
          teamId: careTeam.id,
          userId: user.id,
          teamRole: role as any,
          isAdmin: true,
          accessLevel: 'FULL',
        },
      })

      // Create invites for team members (no User record created - they'll be created when they accept)
      const invites = []
      for (const member of teamMembers || []) {
        if (!member.email) continue

        const inviteCode = randomBytes(16).toString('hex')
        // Extract name from email (before @) as a fallback, or use email as name
        const emailName = member.email.split('@')[0]
        const invitedName = member.name || emailName || member.email
        
        invites.push({
          email: member.email,
          inviteCode,
          name: invitedName,
          role: member.role,
        })

        await tx.careTeamMember.create({
          data: {
            teamId: careTeam.id,
            // userId is null until they accept the invite
            userId: null,
            teamRole: member.role as any,
            accessLevel: member.accessLevel as any,
            inviteCode: inviteCode,
            inviteEmail: member.email,
            invitedName: invitedName,
            invitedAt: new Date(),
          },
        })
      }

      // Mark onboarding as complete
      await tx.user.update({
        where: { clerkId: userId },
        data: {
          onboardingComplete: true,
        },
      })

      return {
        user,
        careTeam,
        patientInviteCode,
        invites,
      }
    })

    // Send invite emails
    const emailResults = []
    
    // Send email to patient
    try {
      const patientEmailResult = await sendInviteEmail({
        to: patientEmail,
        inviteCode: result.patientInviteCode,
        inviterName: `${firstName} ${lastName}`,
        teamName: result.careTeam.name,
        role: 'PATIENT',
        isPatient: true,
      })
      emailResults.push({ email: patientEmail, success: patientEmailResult.success })
    } catch (error) {
      console.error('Error sending patient invite email:', error)
      emailResults.push({ email: patientEmail, success: false, error: String(error) })
    }

    // Send emails to team members
    for (const invite of result.invites) {
      try {
        const emailResult = await sendInviteEmail({
          to: invite.email,
          inviteCode: invite.inviteCode,
          inviterName: `${firstName} ${lastName}`,
          teamName: result.careTeam.name,
          role: invite.role || 'CAREGIVER',
          isPatient: false,
        })
        emailResults.push({ email: invite.email, success: emailResult.success })
      } catch (error) {
        console.error(`Error sending invite email to ${invite.email}:`, error)
        emailResults.push({ email: invite.email, success: false, error: String(error) })
      }
    }

    console.log('Email sending results:', emailResults)

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
      teamId: result.careTeam.id,
      emailsSent: emailResults.filter((r) => r.success).length,
      emailsFailed: emailResults.filter((r) => !r.success).length,
    })
  } catch (error) {
    console.error('Error completing onboarding:', error)
    return NextResponse.json(
      {
        error: 'Error completing onboarding',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}


import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { sendInviteEmail } from '@/lib/email'
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

    // Patient info is only required if user is creating a new team
    // (not if they're already a team member from invite)

    // Start transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Get or create current user
      let user = await tx.user.findUnique({
        where: { clerkId: userId },
        include: {
          teamMemberships: {
            where: {
              userId: { not: null }, // Only existing memberships
            },
          },
        },
      })

      // Check if user is already part of a team (from invite acceptance)
      const isExistingTeamMember = user && user.teamMemberships.length > 0

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

      // If user is already a team member (from invite), skip team creation
      if (isExistingTeamMember) {
        // Just mark onboarding as complete
        await tx.user.update({
          where: { clerkId: userId },
          data: {
            onboardingComplete: true,
          },
        })

        return {
          user,
          careTeam: null,
          patientInviteCode: null,
          invites: [],
          skippedTeamCreation: true,
        }
      }

      // Validate patient info is required for new team creation
      if (!patientName || !patientEmail) {
        throw new Error('Patient information is required when creating a new care team')
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
        skippedTeamCreation: false,
      }
    })

    // If team creation was skipped (user already in a team), just return success
    if (result.skippedTeamCreation) {
      return NextResponse.json({
        success: true,
        message: 'Profile updated successfully',
        skippedTeamCreation: true,
      })
    }

    // Send invite emails (only if we created a new team)
    if (!result.careTeam) {
      return NextResponse.json({
        success: true,
        message: 'Profile updated successfully',
        skippedTeamCreation: true,
      })
    }

    // TESTING: Send all invites to lakgarg2002@gmail.com
    const TEST_EMAIL = 'lakgarg2002@gmail.com'
    const emailResults = []
    
    // Send email to patient (testing - send to test email)
    try {
      const patientEmailResult = await sendInviteEmail({
        to: TEST_EMAIL, // Testing: override with test email
        inviteCode: result.patientInviteCode,
        inviterName: `${firstName} ${lastName}`,
        teamName: result.careTeam.name,
        role: 'PATIENT',
        isPatient: true,
      })
      emailResults.push({ 
        email: patientEmail, 
        actualEmail: TEST_EMAIL,
        inviteCode: result.patientInviteCode,
        success: patientEmailResult.success 
      })
      log.info({ type: 'onboarding_patient_invite_sent', email: TEST_EMAIL, inviteCode: result.patientInviteCode }, 'Patient invite sent')
    } catch (error) {
      loggerUtils.logError(error, { type: 'onboarding_patient_invite_error', email: patientEmail })
      emailResults.push({ email: patientEmail, success: false, error: String(error) })
    }

    // Send emails to team members (testing - send all to test email)
    for (const invite of result.invites) {
      try {
        const emailResult = await sendInviteEmail({
          to: TEST_EMAIL, // Testing: override with test email
          inviteCode: invite.inviteCode,
          inviterName: `${firstName} ${lastName}`,
          teamName: result.careTeam.name,
          role: invite.role || 'CAREGIVER',
          isPatient: false,
          invitedName: invite.name, // Use the name from the form
        })
        emailResults.push({ 
          email: invite.email, 
          actualEmail: TEST_EMAIL,
          inviteCode: invite.inviteCode,
          success: emailResult.success 
        })
        log.info({ type: 'onboarding_team_invite_sent', email: TEST_EMAIL, inviteCode: invite.inviteCode }, 'Team member invite sent')
      } catch (error) {
        loggerUtils.logError(error, { type: 'onboarding_team_invite_error', email: invite.email })
        emailResults.push({ email: invite.email, success: false, error: String(error) })
      }
    }

    log.info({ type: 'onboarding_email_results', results: emailResults }, 'Email sending completed')
    
    // Collect all invite codes for testing
    const allInviteCodes: Array<{ code: string; url: string; role: string }> = []
    
    // Patient invite
    if (result.patientInviteCode) {
      const url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/accept-invite?code=${result.patientInviteCode}`
      allInviteCodes.push({
        code: result.patientInviteCode,
        url,
        role: 'PATIENT',
      })
    }
    
    // Team member invites
    result.invites.forEach((invite: { inviteCode: string; role?: string }) => {
      if (invite.inviteCode) {
        const url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/accept-invite?code=${invite.inviteCode}`
        allInviteCodes.push({
          code: invite.inviteCode,
          url,
          role: invite.role || 'TEAM_MEMBER',
        })
      }
    })
    
    // Log all invite codes for testing (in development only)
    if (process.env.NODE_ENV === 'development') {
      log.info({ type: 'onboarding_invite_codes', codes: allInviteCodes }, 'All invite codes generated')
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
      teamId: result.careTeam.id,
      emailsSent: emailResults.filter((r) => r.success).length,
      emailsFailed: emailResults.filter((r) => !r.success).length,
      // Include invite codes in response for testing
      inviteCodes: allInviteCodes,
    })
  } catch (error) {
    return createInternalErrorResponse(error, {
      endpoint: "/api/onboarding",
      method: "POST",
    })
  }
}


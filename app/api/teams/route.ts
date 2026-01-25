import { requireAuth, isAuthError } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { createNotFoundErrorResponse, createInternalErrorResponse } from '@/lib/error-handler'
import { checkAndCreateContactSetupNotification } from '@/lib/contact-notifications'

export async function GET() {
  try {
    const authResult = await requireAuth()

    if (isAuthError(authResult)) {
      return authResult.response
    }

    const { user: currentUser } = authResult

    // Get user from database with team memberships
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      include: {
        teamMemberships: {
          where: {
            userId: { not: null }, // Only accepted memberships
          },
          include: {
            team: {
              include: {
                patient: {
                  select: {
                    id: true,
                    name: true,
                    firstName: true,
                    lastName: true,
                    role: true, // Include role to verify it's actually a PATIENT
                  },
                },
                members: {
                  where: {
                    userId: { not: null },
                  },
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!user) {
      return createNotFoundErrorResponse("User not found", {
        endpoint: "/api/teams",
        method: "GET",
      })
    }

    // Format teams for the frontend
    // Only use patient name if the user's role is actually PATIENT
    const teams = user.teamMemberships.map((membership) => {
      // Get the actual patient (user with role PATIENT) from team members
      // First check team.patient relation, then check members with PATIENT role
      let actualPatient = null
      
      // Check if team.patient exists and has role PATIENT
      if (membership.team.patient && membership.team.patient.role === 'PATIENT') {
        actualPatient = membership.team.patient
      } else {
        // Fallback: find a member with role PATIENT
        const patientMember = membership.team.members.find(
          (m) => m.user && m.user.role === 'PATIENT'
        )
        if (patientMember?.user) {
          actualPatient = patientMember.user
        }
      }

      const patientName = actualPatient
        ? actualPatient.name ||
          `${actualPatient.firstName || ''} ${actualPatient.lastName || ''}`.trim() ||
          null
        : null

      return {
        id: membership.team.id,
        name: membership.team.name, // Use team name (should be "Patient's Care Team")
        patientId: actualPatient?.id || null,
        patientName: patientName,
        memberCount: membership.team.members.length,
      }
    })

    // Check and create contact setup notifications for all teams (async, don't wait)
    teams.forEach((team) => {
      checkAndCreateContactSetupNotification(team.id, user.id).catch(() => {
        // Silently fail - notification creation is not critical
      })
    })

    return NextResponse.json({
      teams,
    })
  } catch (error) {
    return createInternalErrorResponse(error, {
      endpoint: "/api/teams",
      method: "GET",
    })
  }
}


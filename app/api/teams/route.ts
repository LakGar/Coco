import { requireAuth, isAuthError } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { createNotFoundErrorResponse, createInternalErrorResponse } from '@/lib/error-handler'

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
                  },
                },
                members: {
                  where: {
                    userId: { not: null },
                  },
                  select: {
                    id: true,
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
    const teams = user.teamMemberships.map((membership) => ({
      id: membership.team.id,
      name: membership.team.name,
      patientId: membership.team.patientId,
      patientName: membership.team.patient
        ? membership.team.patient.name ||
          `${membership.team.patient.firstName || ''} ${membership.team.patient.lastName || ''}`.trim() ||
          null
        : null,
      memberCount: membership.team.members.length,
    }))

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


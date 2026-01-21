import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
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
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
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
    console.error('Error fetching teams:', error)
    return NextResponse.json(
      {
        error: 'Error fetching teams',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}


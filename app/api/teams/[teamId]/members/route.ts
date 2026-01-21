import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  req: Request,
  { params }: { params: { teamId: string } | Promise<{ teamId: string }> }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const resolvedParams = params instanceof Promise ? await params : params
    const { teamId } = resolvedParams

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify user is a member of this team
    const membership = await prisma.careTeamMember.findFirst({
      where: {
        teamId: teamId,
        userId: user.id,
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Not a member of this team' },
        { status: 403 }
      )
    }

    // Get all team members
    const team = await prisma.careTeam.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: {
            userId: { not: null }, // Only accepted members
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
          orderBy: {
            joinedAt: 'asc',
          },
        },
        patient: {
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
    })

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }

    // Format members for the frontend
    const members = team.members.map((member) => ({
      id: member.user!.id,
      name: member.user!.name || `${member.user!.firstName || ''} ${member.user!.lastName || ''}`.trim() || member.user!.email,
      email: member.user!.email,
      image: member.user!.imageUrl || undefined,
      role: member.teamRole,
      isAdmin: member.isAdmin,
      accessLevel: member.accessLevel,
      joinedAt: member.joinedAt.toISOString(),
    }))

    // Add patient if exists
    const patient = team.patient ? {
      id: team.patient.id,
      name: team.patient.name || `${team.patient.firstName || ''} ${team.patient.lastName || ''}`.trim() || team.patient.email,
      email: team.patient.email,
      image: team.patient.imageUrl || undefined,
      role: 'PATIENT' as const,
      isAdmin: false,
      accessLevel: 'FULL' as const,
      joinedAt: team.createdAt.toISOString(),
    } : null

    // Find the team creator (first admin by joinedAt date)
    const teamCreator = await prisma.careTeamMember.findFirst({
      where: {
        teamId: teamId,
        isAdmin: true,
      },
      orderBy: {
        joinedAt: 'asc',
      },
      select: {
        userId: true,
      },
    })

    return NextResponse.json({
      team: {
        id: team.id,
        name: team.name,
        patientId: team.patientId,
      },
      members: members.map(m => ({
        ...m,
        isTeamCreator: m.id === teamCreator?.userId,
      })),
      patient,
      currentUser: {
        id: user.id,
        isAdmin: membership.isAdmin,
        accessLevel: membership.accessLevel,
      },
    })
  } catch (error) {
    console.error('Error fetching team members:', error)
    return NextResponse.json(
      {
        error: 'Error fetching team members',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}


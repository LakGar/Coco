import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { requireTeamAccess, extractTeamId, isAuthError } from '@/lib/auth-middleware'
import { createInternalErrorResponse } from '@/lib/error-handler'
import { rateLimit, addRateLimitHeaders } from '@/lib/rate-limit'

export async function GET(
  req: Request,
  { params }: { params: { teamId: string } | Promise<{ teamId: string }> }
) {
  try {
    // Extract teamId and check authorization
    const teamId = await extractTeamId(params)
    const authResult = await requireTeamAccess(teamId, "READ_ONLY") // Read operations allow READ_ONLY

    if (isAuthError(authResult)) {
      return authResult.response
    }

    const { user } = authResult

    // Rate limiting
    const rateLimitResult = await rateLimit(req, "GET", user.clerkId || user.id)
    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        {
          error: "Too many requests",
          message: "Rate limit exceeded. Please try again later.",
        },
        { status: 429 }
      )
      addRateLimitHeaders(response.headers, rateLimitResult.limit, rateLimitResult.remaining, rateLimitResult.reset)
      return response
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

    const response = NextResponse.json({
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
        isAdmin: authResult.membership.isAdmin,
        accessLevel: authResult.membership.accessLevel,
      },
    })
    addRateLimitHeaders(response.headers, rateLimitResult.limit, rateLimitResult.remaining, rateLimitResult.reset)
    return response
  } catch (error) {
    const teamId = await extractTeamId(params).catch(() => "unknown")
    return createInternalErrorResponse(error, {
      endpoint: "/api/teams/[teamId]/members",
      method: "GET",
      teamId,
    })
  }
}


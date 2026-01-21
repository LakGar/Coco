import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { TaskPriority, TaskStatus } from '@prisma/client'
import { createTaskSchema, validateRequest, formatZodError } from '@/lib/validations'
import { rateLimit, addRateLimitHeaders } from '@/lib/rate-limit'

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

    // Rate limiting
    const rateLimitResult = await rateLimit(req, "GET", userId)
    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { 
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
        },
        { status: 429 }
      )
      addRateLimitHeaders(response.headers, rateLimitResult.limit, rateLimitResult.remaining, rateLimitResult.reset)
      return response
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

    // Get all tasks for this team
    const tasks = await prisma.task.findMany({
      where: {
        teamId: teamId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true,
          },
        },
      },
      orderBy: [
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    const response = NextResponse.json({ tasks })
    addRateLimitHeaders(response.headers, rateLimitResult.limit, rateLimitResult.remaining, rateLimitResult.reset)
    return response
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      {
        error: 'Error fetching tasks',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

export async function POST(
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

    // Rate limiting
    const rateLimitResult = await rateLimit(req, "POST", userId)
    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
        },
        { status: 429 }
      )
      addRateLimitHeaders(response.headers, rateLimitResult.limit, rateLimitResult.remaining, rateLimitResult.reset)
      return response
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

    // Check if user has permission to create tasks (not READ_ONLY)
    if (membership.accessLevel === 'READ_ONLY') {
      return NextResponse.json(
        { error: 'Read-only users cannot create tasks' },
        { status: 403 }
      )
    }

    // Validate request body
    const validation = await validateRequest(req, createTaskSchema)
    if (validation.error) {
      return NextResponse.json(
        formatZodError(validation.error),
        { status: 400 }
      )
    }
    const {
      name,
      description,
      patientName,
      assignedToId,
      priority,
      status,
      dueDate,
    } = validation.data

    // Get team to get patient name if not provided
    const team = await prisma.careTeam.findUnique({
      where: { id: teamId },
      include: {
        patient: {
          select: {
            name: true,
            firstName: true,
            lastName: true,
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

    // Use provided patientName or default to team's patient name
    const finalPatientName = patientName || 
      (team.patient 
        ? (team.patient.name || `${team.patient.firstName || ''} ${team.patient.lastName || ''}`.trim())
        : null)

    // Create task
    const task = await prisma.task.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        teamId: teamId,
        patientName: finalPatientName,
        createdById: user.id,
        assignedToId: assignedToId || null,
        priority: (priority as TaskPriority) || 'MEDIUM',
        status: (status as TaskStatus) || 'TODO',
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true,
          },
        },
      },
    })

    const response = NextResponse.json({ task }, { status: 201 })
    addRateLimitHeaders(response.headers, rateLimitResult.limit, rateLimitResult.remaining, rateLimitResult.reset)
    return response
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      {
        error: 'Error creating task',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}


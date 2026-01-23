import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { createRoutineSchema, validateRequest, formatZodError } from '@/lib/validations'
import { TaskPriority, RecurrenceType } from '@prisma/client'
import { rateLimit, addRateLimitHeaders } from '@/lib/rate-limit'
import { requireTeamAccess, extractTeamId, isAuthError } from '@/lib/auth-middleware'
import { createValidationErrorResponse, createInternalErrorResponse } from '@/lib/error-handler'

export async function GET(
  req: Request,
  { params }: { params: { teamId: string } | Promise<{ teamId: string }> }
) {
  try {
    // Extract teamId and check authorization
    const teamId = await extractTeamId(params)
    const authResult = await requireTeamAccess(teamId, 'READ_ONLY') // Read operations allow READ_ONLY

    if (isAuthError(authResult)) {
      return authResult.response
    }

    const { user } = authResult

    // Rate limiting
    const rateLimitResult = await rateLimit(req, "GET", user.clerkId || user.id)
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

    // All team members (READ_ONLY and FULL) can view routines
    // Routines are patient-specific through the team relationship
    // Get all routines for this team
    const routines = await prisma.routine.findMany({
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
        instances: {
          orderBy: {
            createdAt: 'desc', // Using createdAt until schema is migrated to entryDate
          },
          take: 30, // Get recent instances
        },
        _count: {
          select: {
            instances: true,
          },
        },
      },
      orderBy: [
        { isActive: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    const response = NextResponse.json({ routines })
    addRateLimitHeaders(response.headers, rateLimitResult.limit, rateLimitResult.remaining, rateLimitResult.reset)
    return response
  } catch (error) {
    const teamId = await extractTeamId(params)
    return createInternalErrorResponse(error, {
      endpoint: '/api/teams/[teamId]/routines',
      method: 'GET',
      teamId,
    })
  }
}

export async function POST(
  req: Request,
  { params }: { params: { teamId: string } | Promise<{ teamId: string }> }
) {
  try {
    // Extract teamId and check authorization (requires FULL access for write operations)
    const teamId = await extractTeamId(params)
    const authResult = await requireTeamAccess(teamId, 'FULL')

    if (isAuthError(authResult)) {
      return authResult.response
    }

    const { user } = authResult

    // Rate limiting
    const rateLimitResult = await rateLimit(req, "POST", user.clerkId || user.id)
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

    // Validate request body
    const validation = await validateRequest(req, createRoutineSchema)
    if (validation.error) {
      return createValidationErrorResponse(validation.error, {
        endpoint: '/api/teams/[teamId]/routines',
        method: 'POST',
        teamId,
        userId: user.id,
      })
    }
    const {
      name,
      description,
      patientName,
      checklistItems, // Array of Yes/No questions
      recurrenceDaysOfWeek, // [0,1,2,3,4,5,6] for daily, etc.
      startDate,
      endDate,
    } = validation.data

    // Additional validation for recurrenceDaysOfWeek (already validated by schema but double-check)
    if (!recurrenceDaysOfWeek || recurrenceDaysOfWeek.length === 0) {
      return NextResponse.json(
        { error: 'At least one day of week is required' },
        { status: 400 }
      )
    }

    if (!startDate) {
      return NextResponse.json(
        { error: 'Start date is required' },
        { status: 400 }
      )
    }

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

    // Create routine
    const routine = await prisma.routine.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        teamId: teamId,
        patientName: finalPatientName,
        createdById: user.id,
        checklistItems: checklistItems.map((item: string) => item.trim()).filter((item: string) => item.length > 0),
        recurrenceDaysOfWeek: recurrenceDaysOfWeek,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        isActive: true,
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
      },
    })

    const response = NextResponse.json({ routine }, { status: 201 })
    addRateLimitHeaders(response.headers, rateLimitResult.limit, rateLimitResult.remaining, rateLimitResult.reset)
    return response
  } catch (error) {
    const teamId = await extractTeamId(params)
    return createInternalErrorResponse(error, {
      endpoint: '/api/teams/[teamId]/routines',
      method: 'POST',
      teamId,
    })
  }
}


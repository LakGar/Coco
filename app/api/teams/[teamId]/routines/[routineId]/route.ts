import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { updateRoutineSchema, validateRequest } from '@/lib/validations'
import { rateLimit, addRateLimitHeaders } from '@/lib/rate-limit'
import { requireTeamAccess, extractTeamId, isAuthError } from '@/lib/auth-middleware'
import { createValidationErrorResponse, createNotFoundErrorResponse, createInternalErrorResponse } from '@/lib/error-handler'
import { createAuditLog, AUDIT_ACTIONS } from '@/lib/audit'

export async function PATCH(
  req: Request,
  { params }: { params: { teamId: string; routineId: string } | Promise<{ teamId: string; routineId: string }> }
) {
  try {
    // Extract teamId and check authorization (FULL access required)
    const resolvedParams = params instanceof Promise ? await params : params
    const { teamId, routineId } = resolvedParams
    const authResult = await requireTeamAccess(teamId, "FULL")

    if (isAuthError(authResult)) {
      return authResult.response
    }

    const { user } = authResult

    // Rate limiting
    const rateLimitResult = await rateLimit(req, "PATCH", user.clerkId || user.id)
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

    // Verify routine exists and belongs to team
    const routine = await prisma.routine.findFirst({
      where: {
        id: routineId,
        teamId: teamId,
      },
    })

    if (!routine) {
      return NextResponse.json(
        { error: 'Routine not found' },
        { status: 404 }
      )
    }

    // Validate request body
    const validation = await validateRequest(req, updateRoutineSchema)
    if (validation.error) {
      return createValidationErrorResponse(validation.error, {
        endpoint: "/api/teams/[teamId]/routines/[routineId]",
        method: "PATCH",
        teamId,
        routineId,
      })
    }
    const {
      name,
      description,
      patientName,
      checklistItems,
      recurrenceDaysOfWeek,
      startDate,
      endDate,
    } = validation.data

    // Update routine
    const updatedRoutine = await prisma.routine.update({
      where: { id: routineId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(patientName !== undefined && { patientName: patientName || null }),
        ...(checklistItems !== undefined && { 
          checklistItems: checklistItems.map((item: string) => item.trim()).filter((item: string) => item.length > 0)
        }),
        ...(recurrenceDaysOfWeek !== undefined && { recurrenceDaysOfWeek }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
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

    const response = NextResponse.json({ routine: updatedRoutine })
    addRateLimitHeaders(response.headers, rateLimitResult.limit, rateLimitResult.remaining, rateLimitResult.reset)
    return response
  } catch (error) {
    const resolvedParams = params instanceof Promise ? await params : params
    const { teamId } = resolvedParams
    return createInternalErrorResponse(error, {
      endpoint: "/api/teams/[teamId]/routines/[routineId]",
      method: "PATCH",
      teamId,
    })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { teamId: string; routineId: string } | Promise<{ teamId: string; routineId: string }> }
) {
  try {
    // Extract teamId and check authorization (FULL access required for deleting)
    const resolvedParams = params instanceof Promise ? await params : params
    const { teamId, routineId } = resolvedParams
    const authResult = await requireTeamAccess(teamId, "FULL")

    if (isAuthError(authResult)) {
      return authResult.response
    }

    const { user } = authResult

    // Rate limiting (sensitive operation)
    const rateLimitResult = await rateLimit(req, "DELETE", user.clerkId || user.id)
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

    // Verify routine exists and belongs to team
    const routine = await prisma.routine.findFirst({
      where: {
        id: routineId,
        teamId: teamId,
      },
    })

    if (!routine) {
      return NextResponse.json(
        { error: 'Routine not found' },
        { status: 404 }
      )
    }

    // Delete routine (cascade will delete instances and related tasks)
    await prisma.routine.delete({
      where: { id: routineId },
    })

    const response = NextResponse.json({ success: true })
    addRateLimitHeaders(response.headers, rateLimitResult.limit, rateLimitResult.remaining, rateLimitResult.reset)
    return response
  } catch (error) {
    const resolvedParams = params instanceof Promise ? await params : params
    const { teamId } = resolvedParams
    return createInternalErrorResponse(error, {
      endpoint: "/api/teams/[teamId]/routines/[routineId]",
      method: "DELETE",
      teamId,
    })
  }
}


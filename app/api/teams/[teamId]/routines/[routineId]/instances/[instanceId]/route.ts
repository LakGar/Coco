import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { updateRoutineInstanceSchema, validateRequest } from '@/lib/validations'
import { requireTeamAccess, extractTeamId, isAuthError } from '@/lib/auth-middleware'
import { createValidationErrorResponse, createNotFoundErrorResponse, createInternalErrorResponse } from '@/lib/error-handler'
import { rateLimit, addRateLimitHeaders } from '@/lib/rate-limit'

export async function PATCH(
  req: Request,
  { params }: { params: { teamId: string; routineId: string; instanceId: string } | Promise<{ teamId: string; routineId: string; instanceId: string }> }
) {
  try {
    // Extract teamId and check authorization (FULL access required)
    const resolvedParams = params instanceof Promise ? await params : params
    const { teamId, routineId, instanceId } = resolvedParams
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
          error: "Too many requests",
          message: "Rate limit exceeded. Please try again later.",
        },
        { status: 429 }
      )
      addRateLimitHeaders(response.headers, rateLimitResult.limit, rateLimitResult.remaining, rateLimitResult.reset)
      return response
    }

    // Verify instance exists and belongs to routine/team
    const instance = await prisma.routineInstance.findFirst({
      where: {
        id: instanceId,
        routineId: routineId,
        routine: {
          teamId: teamId,
        },
      },
    })

    if (!instance) {
      return createNotFoundErrorResponse("Routine instance not found", {
        endpoint: "/api/teams/[teamId]/routines/[routineId]/instances/[instanceId]",
        method: "PATCH",
        teamId,
        routineId,
        instanceId,
      })
    }

    // Validate request body
    const validation = await validateRequest(req, updateRoutineInstanceSchema)
    if (validation.error) {
      return createValidationErrorResponse(validation.error, {
        endpoint: "/api/teams/[teamId]/routines/[routineId]/instances/[instanceId]",
        method: "PATCH",
        teamId,
        routineId,
        instanceId,
      })
    }
    const { answers, completedItems, skippedItems, notes } = validation.data

    // Process notes: trim if string, convert empty string to null
    const processedNotes = notes && typeof notes === "string" && notes.trim() !== "" 
      ? notes.trim() 
      : notes === null || notes === "" 
        ? null 
        : notes

    // Process answers: coerce string/number values to booleans
    const processedAnswers = answers
      ? Object.entries(answers).reduce((acc, [key, value]) => {
          // Coerce to boolean: true, "true", 1 -> true; everything else -> false
          acc[key] = value === true || value === "true" || value === 1
          return acc
        }, {} as Record<string, boolean>)
      : undefined

    // Update instance
    const updatedInstance = await prisma.routineInstance.update({
      where: { id: instanceId },
      data: {
        ...(processedAnswers !== undefined && { answers: processedAnswers }),
        ...(processedNotes !== undefined && { notes: processedNotes }),
        filledOutAt: new Date(),
        filledOutBy: user.id,
      },
      include: {
        routine: {
          select: {
            id: true,
            name: true,
            checklistItems: true,
          },
        },
      },
    })

    const response = NextResponse.json({ instance: updatedInstance })
    addRateLimitHeaders(response.headers, rateLimitResult.limit, rateLimitResult.remaining, rateLimitResult.reset)
    return response
  } catch (error) {
    const resolvedParams = params instanceof Promise ? await params : params
    const { teamId } = resolvedParams
    return createInternalErrorResponse(error, {
      endpoint: "/api/teams/[teamId]/routines/[routineId]/instances/[instanceId]",
      method: "PATCH",
      teamId,
    })
  }
}


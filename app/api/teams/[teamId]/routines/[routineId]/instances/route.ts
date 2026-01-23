import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { createRoutineInstanceSchema, validateRequest } from '@/lib/validations'
import { requireTeamAccess, extractTeamId, isAuthError } from '@/lib/auth-middleware'
import { createValidationErrorResponse, createInternalErrorResponse } from '@/lib/error-handler'
import { rateLimit, addRateLimitHeaders } from '@/lib/rate-limit'
import { log } from '@/lib/logger'

export async function GET(
  req: Request,
  { params }: { params: { teamId: string; routineId: string } | Promise<{ teamId: string; routineId: string }> }
) {
  try {
    // Extract teamId and check authorization
    const resolvedParams = params instanceof Promise ? await params : params
    const { teamId, routineId } = resolvedParams
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

    // Get routine instances
    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100

    const instances = await prisma.routineInstance.findMany({
      where: {
        routineId: routineId,
        routine: {
          teamId: teamId,
        },
        // Temporarily using createdAt until schema is migrated
        ...(startDate && endDate && {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
      },
      orderBy: {
        createdAt: 'desc', // Using createdAt until schema is migrated to entryDate
      },
      take: limit,
    })

    const response = NextResponse.json({ instances })
    addRateLimitHeaders(response.headers, rateLimitResult.limit, rateLimitResult.remaining, rateLimitResult.reset)
    return response
  } catch (error) {
    const resolvedParams = params instanceof Promise ? await params : params
    const { teamId } = resolvedParams
    return createInternalErrorResponse(error, {
      endpoint: "/api/teams/[teamId]/routines/[routineId]/instances",
      method: "GET",
      teamId,
    })
  }
}

export async function POST(
  req: Request,
  { params }: { params: { teamId: string; routineId: string } | Promise<{ teamId: string; routineId: string }> }
) {
  try {
    // Extract teamId and check authorization (FULL access required for creating instances)
    const resolvedParams = params instanceof Promise ? await params : params
    const { teamId, routineId } = resolvedParams
    const authResult = await requireTeamAccess(teamId, "FULL")

    if (isAuthError(authResult)) {
      return authResult.response
    }

    const { user } = authResult

    // Rate limiting
    const rateLimitResult = await rateLimit(req, "POST", user.clerkId || user.id)
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

    // Validate request body
    log.debug({ routineId, teamId }, 'Starting routine instance validation')
    const validation = await validateRequest(req, createRoutineInstanceSchema)
    
    if (validation.error) {
      return createValidationErrorResponse(validation.error, {
        endpoint: "/api/teams/[teamId]/routines/[routineId]/instances",
        method: "POST",
        teamId,
        routineId,
      })
    }
    
    log.debug({ routineId, teamId }, 'Routine instance validation successful')
    const { entryDate, answers, completedItems, skippedItems, notes } = validation.data

    // Create or update instance
    const entryDateObj = new Date(entryDate)
    entryDateObj.setHours(0, 0, 0, 0)

    // Process notes: trim if string, convert empty string to null
    const processedNotes = notes && typeof notes === "string" && notes.trim() !== "" 
      ? notes.trim() 
      : null

    // Process answers: coerce string/number values to booleans
    const processedAnswers = answers
      ? Object.entries(answers).reduce((acc, [key, value]) => {
          // Coerce to boolean: true, "true", 1 -> true; everything else -> false
          acc[key] = value === true || value === "true" || value === 1
          return acc
        }, {} as Record<string, boolean>)
      : undefined

    const instance = await prisma.routineInstance.upsert({
      where: {
        routineId_entryDate: {
          routineId: routineId,
          entryDate: entryDateObj,
        },
      },
      update: {
        ...(processedAnswers !== undefined && { answers: processedAnswers }),
        notes: processedNotes,
        filledOutAt: new Date(),
        filledOutBy: user.id,
      },
      create: {
        routineId: routineId,
        entryDate: entryDateObj,
        ...(processedAnswers !== undefined && { answers: processedAnswers }),
        notes: processedNotes,
        filledOutAt: new Date(),
        filledOutBy: user.id,
      },
    })

    const response = NextResponse.json({ instance }, { status: 201 })
    addRateLimitHeaders(response.headers, rateLimitResult.limit, rateLimitResult.remaining, rateLimitResult.reset)
    return response
  } catch (error) {
    const resolvedParams = params instanceof Promise ? await params : params
    const { teamId } = resolvedParams
    return createInternalErrorResponse(error, {
      endpoint: "/api/teams/[teamId]/routines/[routineId]/instances",
      method: "POST",
      teamId,
    })
  }
}


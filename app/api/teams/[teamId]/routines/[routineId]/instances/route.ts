import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { createRoutineInstanceSchema, validateRequest, formatZodError } from '@/lib/validations'

// Log schema import for debugging
console.log('[route.ts] Schema imported:', {
  schemaType: typeof createRoutineInstanceSchema,
  schemaValue: createRoutineInstanceSchema,
  hasParse: typeof createRoutineInstanceSchema?.parse === 'function',
  isUndefined: createRoutineInstanceSchema === undefined,
  isNull: createRoutineInstanceSchema === null,
})

export async function GET(
  req: Request,
  { params }: { params: { teamId: string; routineId: string } | Promise<{ teamId: string; routineId: string }> }
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
    const { teamId, routineId } = resolvedParams

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

    return NextResponse.json({ instances })
  } catch (error) {
    console.error('Error fetching routine instances:', error)
    return NextResponse.json(
      {
        error: 'Error fetching routine instances',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

export async function POST(
  req: Request,
  { params }: { params: { teamId: string; routineId: string } | Promise<{ teamId: string; routineId: string }> }
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
    const { teamId, routineId } = resolvedParams

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

    // Check if user has permission (not READ_ONLY)
    if (membership.accessLevel === 'READ_ONLY') {
      return NextResponse.json(
        { error: 'Read-only users cannot create routine instances' },
        { status: 403 }
      )
    }

    // Validate request body
    console.log('[POST /instances] Starting validation')
    console.log('[POST /instances] createRoutineInstanceSchema:', createRoutineInstanceSchema)
    console.log('[POST /instances] Schema type:', typeof createRoutineInstanceSchema)
    console.log('[POST /instances] Schema keys:', Object.keys(createRoutineInstanceSchema || {}))
    console.log('[POST /instances] Request URL:', req.url)
    console.log('[POST /instances] Request method:', req.method)
    
    const validation = await validateRequest(req, createRoutineInstanceSchema)
    
    if (validation.error) {
      console.error('[POST /instances] Validation failed')
      console.error('[POST /instances] Validation error:', validation.error)
      console.error('[POST /instances] Validation error details:', JSON.stringify(validation.error, null, 2))
      console.error('[POST /instances] Validation error issues:', validation.error.issues)
      return NextResponse.json(
        formatZodError(validation.error),
        { status: 400 }
      )
    }
    
    console.log('[POST /instances] Validation successful')
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

    return NextResponse.json({ instance }, { status: 201 })
  } catch (error) {
    console.error('Error creating routine instance:', error)
    return NextResponse.json(
      {
        error: 'Error creating routine instance',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}


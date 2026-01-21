import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

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

    const body = await req.json()
    const { entryDate, answers, notes } = body

    if (!entryDate) {
      return NextResponse.json(
        { error: 'entryDate is required' },
        { status: 400 }
      )
    }

    // Create or update instance
    const entryDateObj = new Date(entryDate)
    entryDateObj.setHours(0, 0, 0, 0)

    const instance = await prisma.routineInstance.upsert({
      where: {
        routineId_entryDate: {
          routineId: routineId,
          entryDate: entryDateObj,
        },
      },
      update: {
        answers: answers || {},
        notes: notes || null,
        filledOutAt: new Date(),
        filledOutBy: user.id,
      },
      create: {
        routineId: routineId,
        entryDate: entryDateObj,
        answers: answers || {},
        notes: notes || null,
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


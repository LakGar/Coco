import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { TaskPriority, RecurrenceType } from '@prisma/client'

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

    return NextResponse.json({ routines })
  } catch (error) {
    console.error('Error fetching routines:', error)
    console.error('Error details:', error instanceof Error ? error.stack : String(error))
    
    // Check if it's a Prisma client issue
    if (error instanceof Error && error.message.includes('Cannot read properties of undefined')) {
      return NextResponse.json(
        {
          error: 'Prisma client not updated. Please restart the dev server after running "npx prisma generate"',
          details: error.message,
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      {
        error: 'Error fetching routines',
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

    // Check if user has permission to create routines (not READ_ONLY)
    // Only FULL access members can create/edit/delete routines
    if (membership.accessLevel === 'READ_ONLY') {
      return NextResponse.json(
        { error: 'Read-only users cannot create routines' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const {
      name,
      description,
      patientName,
      checklistItems, // Array of Yes/No questions
      recurrenceDaysOfWeek, // [0,1,2,3,4,5,6] for daily, etc.
      startDate,
      endDate,
    } = body

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    if (!checklistItems || !Array.isArray(checklistItems) || checklistItems.length === 0) {
      return NextResponse.json(
        { error: 'At least one checklist item (question) is required' },
        { status: 400 }
      )
    }

    if (!recurrenceDaysOfWeek || !Array.isArray(recurrenceDaysOfWeek) || recurrenceDaysOfWeek.length === 0) {
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

    return NextResponse.json({ routine }, { status: 201 })
  } catch (error) {
    console.error('Error creating routine:', error)
    return NextResponse.json(
      {
        error: 'Error creating routine',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}


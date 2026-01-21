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
        instances: {
          orderBy: {
            scheduledDate: 'desc',
          },
          take: 30, // Get recent instances
        },
        _count: {
          select: {
            instances: true,
            tasks: true,
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
      assignedToId,
      priority,
      recurrenceType,
      recurrenceDaysOfWeek,
      recurrenceDayOfMonth,
      recurrenceSpecificDates,
      startDate,
      endDate,
      timeOfDay,
      autoGenerateTasks,
      generateDaysAhead,
      hasJournalEntry,
      journalPrompts,
    } = body

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    if (!recurrenceType || !['DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM_WEEKDAYS', 'SPECIFIC_DATES'].includes(recurrenceType)) {
      return NextResponse.json(
        { error: 'Valid recurrence type is required' },
        { status: 400 }
      )
    }

    if (!startDate) {
      return NextResponse.json(
        { error: 'Start date is required' },
        { status: 400 }
      )
    }

    // Validate recurrence-specific fields
    if (recurrenceType === 'WEEKLY' || recurrenceType === 'CUSTOM_WEEKDAYS') {
      if (!recurrenceDaysOfWeek || recurrenceDaysOfWeek.length === 0) {
        return NextResponse.json(
          { error: 'Days of week are required for weekly/custom recurrence' },
          { status: 400 }
        )
      }
    }

    if (recurrenceType === 'MONTHLY' && !recurrenceDayOfMonth) {
      return NextResponse.json(
        { error: 'Day of month is required for monthly recurrence' },
        { status: 400 }
      )
    }

    if (recurrenceType === 'SPECIFIC_DATES' && (!recurrenceSpecificDates || recurrenceSpecificDates.length === 0)) {
      return NextResponse.json(
        { error: 'Specific dates are required for specific dates recurrence' },
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
        assignedToId: assignedToId || null,
        priority: (priority as TaskPriority) || 'MEDIUM',
        recurrenceType: recurrenceType as RecurrenceType,
        recurrenceDaysOfWeek: recurrenceDaysOfWeek || [],
        recurrenceDayOfMonth: recurrenceDayOfMonth || null,
        recurrenceSpecificDates: recurrenceSpecificDates ? recurrenceSpecificDates.map((d: string) => new Date(d)) : [],
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        timeOfDay: timeOfDay || null,
        autoGenerateTasks: autoGenerateTasks !== undefined ? autoGenerateTasks : true,
        generateDaysAhead: generateDaysAhead || 7,
        hasJournalEntry: hasJournalEntry || false,
        journalPrompts: journalPrompts || [],
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


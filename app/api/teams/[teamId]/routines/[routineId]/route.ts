import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { TaskPriority, RecurrenceType } from '@prisma/client'

export async function PATCH(
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
      isActive,
    } = body

    // Update routine
    const updatedRoutine = await prisma.routine.update({
      where: { id: routineId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(patientName !== undefined && { patientName: patientName || null }),
        ...(assignedToId !== undefined && { assignedToId: assignedToId || null }),
        ...(priority && { priority: priority as TaskPriority }),
        ...(recurrenceType && { recurrenceType: recurrenceType as RecurrenceType }),
        ...(recurrenceDaysOfWeek !== undefined && { recurrenceDaysOfWeek }),
        ...(recurrenceDayOfMonth !== undefined && { recurrenceDayOfMonth }),
        ...(recurrenceSpecificDates !== undefined && { 
          recurrenceSpecificDates: recurrenceSpecificDates.map((d: string) => new Date(d)) 
        }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(timeOfDay !== undefined && { timeOfDay }),
        ...(autoGenerateTasks !== undefined && { autoGenerateTasks }),
        ...(generateDaysAhead !== undefined && { generateDaysAhead }),
        ...(hasJournalEntry !== undefined && { hasJournalEntry }),
        ...(journalPrompts !== undefined && { journalPrompts }),
        ...(isActive !== undefined && { isActive }),
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

    return NextResponse.json({ routine: updatedRoutine })
  } catch (error) {
    console.error('Error updating routine:', error)
    return NextResponse.json(
      {
        error: 'Error updating routine',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Check if user has permission to delete routines (not READ_ONLY)
    // Only FULL access members can create/edit/delete routines
    if (membership.accessLevel === 'READ_ONLY') {
      return NextResponse.json(
        { error: 'Read-only users cannot delete routines' },
        { status: 403 }
      )
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting routine:', error)
    return NextResponse.json(
      {
        error: 'Error deleting routine',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}


import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PATCH(
  req: Request,
  { params }: { params: { teamId: string; routineId: string; instanceId: string } | Promise<{ teamId: string; routineId: string; instanceId: string }> }
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
    const { teamId, routineId, instanceId } = resolvedParams

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

    // Check if user has permission to update routine instances (not READ_ONLY)
    // Only FULL access members can complete/skip instances and add journal entries
    if (membership.accessLevel === 'READ_ONLY') {
      return NextResponse.json(
        { error: 'Read-only users cannot update routine instances' },
        { status: 403 }
      )
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
      return NextResponse.json(
        { error: 'Routine instance not found' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const {
      isCompleted,
      isSkipped,
      journalData,
    } = body

    // Update instance
    const updatedInstance = await prisma.routineInstance.update({
      where: { id: instanceId },
      data: {
        ...(isCompleted !== undefined && { 
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
        }),
        ...(isSkipped !== undefined && { 
          isSkipped,
          skippedAt: isSkipped ? new Date() : null,
        }),
        ...(journalData !== undefined && { journalData }),
      },
      include: {
        routine: {
          select: {
            id: true,
            name: true,
            hasJournalEntry: true,
            journalPrompts: true,
          },
        },
        tasks: {
          include: {
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
        },
      },
    })

    // If completing, also mark related tasks as done
    if (isCompleted && updatedInstance.tasks.length > 0) {
      await prisma.task.updateMany({
        where: {
          routineInstanceId: instanceId,
          status: { not: 'CANCELLED' },
        },
        data: {
          status: 'DONE',
        },
      })
    }

    return NextResponse.json({ instance: updatedInstance })
  } catch (error) {
    console.error('Error updating routine instance:', error)
    return NextResponse.json(
      {
        error: 'Error updating routine instance',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}


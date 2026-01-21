import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { updateRoutineInstanceSchema, validateRequest, formatZodError } from '@/lib/validations'

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

    // Validate request body
    const validation = await validateRequest(req, updateRoutineInstanceSchema)
    if (validation.error) {
      return NextResponse.json(
        formatZodError(validation.error),
        { status: 400 }
      )
    }
    const { answers, completedItems, skippedItems, notes } = validation.data

    // Update instance
    const updatedInstance = await prisma.routineInstance.update({
      where: { id: instanceId },
      data: {
        ...(answers !== undefined && { answers }),
        ...(notes !== undefined && { notes: notes || null }),
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


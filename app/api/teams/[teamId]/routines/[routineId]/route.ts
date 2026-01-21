import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { updateRoutineSchema, validateRequest, formatZodError } from '@/lib/validations'
import { rateLimit, addRateLimitHeaders } from '@/lib/rate-limit'

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

    // Validate request body
    const validation = await validateRequest(req, updateRoutineSchema)
    if (validation.error) {
      return NextResponse.json(
        formatZodError(validation.error),
        { status: 400 }
      )
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
      },
    })

    const response = NextResponse.json({ routine: updatedRoutine })
    addRateLimitHeaders(response.headers, rateLimitResult.limit, rateLimitResult.remaining, rateLimitResult.reset)
    return response
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

    const response = NextResponse.json({ success: true })
    addRateLimitHeaders(response.headers, rateLimitResult.limit, rateLimitResult.remaining, rateLimitResult.reset)
    return response
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


import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { TaskPriority, TaskStatus } from '@prisma/client'
import { updateTaskSchema, validateRequest, formatZodError } from '@/lib/validations'
import { rateLimit, addRateLimitHeaders } from '@/lib/rate-limit'

export async function PATCH(
  req: Request,
  { params }: { params: { teamId: string; taskId: string } | Promise<{ teamId: string; taskId: string }> }
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
    const { teamId, taskId } = resolvedParams

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

    // Check if user has permission to update tasks (not READ_ONLY)
    if (membership.accessLevel === 'READ_ONLY') {
      return NextResponse.json(
        { error: 'Read-only users cannot update tasks' },
        { status: 403 }
      )
    }

    // Find the task
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        teamId: teamId,
      },
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Validate request body
    const validation = await validateRequest(req, updateTaskSchema)
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
      assignedToId,
      priority,
      status,
      dueDate,
    } = validation.data

    // Update task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(patientName !== undefined && { patientName: patientName || null }),
        ...(assignedToId !== undefined && { assignedToId: assignedToId || null }),
        ...(priority && { priority: priority as TaskPriority }),
        ...(status && { status: status as TaskStatus }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
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

    const response = NextResponse.json({ task: updatedTask })
    addRateLimitHeaders(response.headers, rateLimitResult.limit, rateLimitResult.remaining, rateLimitResult.reset)
    return response
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      {
        error: 'Error updating task',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { teamId: string; taskId: string } | Promise<{ teamId: string; taskId: string }> }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Rate limiting (sensitive operation)
    const rateLimitResult = await rateLimit(req, "DELETE", userId)
    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        { 
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
        },
        { status: 429 }
      )
      addRateLimitHeaders(response.headers, rateLimitResult.limit, rateLimitResult.remaining, rateLimitResult.reset)
      return response
    }

    const resolvedParams = params instanceof Promise ? await params : params
    const { teamId, taskId } = resolvedParams

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

    // Check if user has permission to delete tasks (not READ_ONLY)
    if (membership.accessLevel === 'READ_ONLY') {
      return NextResponse.json(
        { error: 'Read-only users cannot delete tasks' },
        { status: 403 }
      )
    }

    // Find the task
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        teamId: teamId,
      },
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Delete task
    await prisma.task.delete({
      where: { id: taskId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      {
        error: 'Error deleting task',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}


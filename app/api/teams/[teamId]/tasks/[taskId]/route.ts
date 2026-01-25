import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { TaskPriority, TaskStatus, TaskType } from '@prisma/client'
import { updateTaskSchema, validateRequest, formatZodError } from '@/lib/validations'
import { rateLimit, addRateLimitHeaders } from '@/lib/rate-limit'
import { requireTeamAccess, isAuthError } from '@/lib/auth-middleware'
import { createValidationErrorResponse, createNotFoundErrorResponse, createInternalErrorResponse } from '@/lib/error-handler'

export async function PATCH(
  req: Request,
  { params }: { params: { teamId: string; taskId: string } | Promise<{ teamId: string; taskId: string }> }
) {
  try {
    // Extract params and check authorization (requires FULL access for write operations)
    const resolvedParams = params instanceof Promise ? await params : params
    const { teamId, taskId } = resolvedParams

    const authResult = await requireTeamAccess(teamId, 'FULL')

    if (isAuthError(authResult)) {
      return authResult.response
    }

    const { user, membership } = authResult

    // Check if user has permission to edit tasks
    if (!membership.isAdmin && !membership.canEditTasks) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have permission to edit tasks' },
        { status: 403 }
      )
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(req, "PATCH", user.clerkId || user.id)
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

    // Find the task
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        teamId: teamId,
      },
    })

    if (!task) {
      return createNotFoundErrorResponse('Task', {
        endpoint: '/api/teams/[teamId]/tasks/[taskId]',
        method: 'PATCH',
        teamId,
        taskId,
        userId: user.id,
      })
    }

    // Validate request body
    const validation = await validateRequest(req, updateTaskSchema)
    if (validation.error) {
      return createValidationErrorResponse(validation.error, {
        endpoint: '/api/teams/[teamId]/tasks/[taskId]',
        method: 'PATCH',
        teamId,
        taskId,
        userId: user.id,
      })
    }
    const {
      name,
      description,
      patientName,
      assignedToId,
      priority,
      status,
      type,
      isPersonal,
      dueDate,
    } = validation.data

    // Update task
    // If converting to personal task, ensure only the creator can see it
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(patientName !== undefined && { patientName: patientName || null }),
        ...(assignedToId !== undefined && { assignedToId: assignedToId || null }),
        ...(priority && { priority: priority as TaskPriority }),
        ...(status && { status: status as TaskStatus }),
        ...(type !== undefined && { type: type ? (type as TaskType) : null }),
        ...(isPersonal !== undefined && { isPersonal }),
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
    const resolvedParams = params instanceof Promise ? await params : params
    return createInternalErrorResponse(error, {
      endpoint: '/api/teams/[teamId]/tasks/[taskId]',
      method: 'PATCH',
      teamId: resolvedParams.teamId,
      taskId: resolvedParams.taskId,
    })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { teamId: string; taskId: string } | Promise<{ teamId: string; taskId: string }> }
) {
  try {
    // Extract params and check authorization (requires FULL access for delete operations)
    const resolvedParams = params instanceof Promise ? await params : params
    const { teamId, taskId } = resolvedParams

    const authResult = await requireTeamAccess(teamId, 'FULL')

    if (isAuthError(authResult)) {
      return authResult.response
    }

    const { user, membership } = authResult

    // Check if user has permission to delete tasks
    if (!membership.isAdmin && !membership.canDeleteTasks) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have permission to delete tasks' },
        { status: 403 }
      )
    }

    // Rate limiting (sensitive operation)
    const rateLimitResult = await rateLimit(req, "DELETE", user.clerkId || user.id)
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

    // Find the task
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        teamId: teamId,
      },
    })

    if (!task) {
      return createNotFoundErrorResponse('Task', {
        endpoint: '/api/teams/[teamId]/tasks/[taskId]',
        method: 'DELETE',
        teamId,
        taskId,
        userId: user.id,
      })
    }

    // Delete task
    await prisma.task.delete({
      where: { id: taskId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const resolvedParams = params instanceof Promise ? await params : params
    return createInternalErrorResponse(error, {
      endpoint: '/api/teams/[teamId]/tasks/[taskId]',
      method: 'DELETE',
      teamId: resolvedParams.teamId,
      taskId: resolvedParams.taskId,
    })
  }
}


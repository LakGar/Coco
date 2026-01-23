/**
 * EXAMPLE: Refactored route using createRouteHandler
 * This demonstrates how to use the new shared utility to reduce duplication
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createTaskSchema } from '@/lib/validations'
import { createRouteHandler, createSuccessResponse, createCreatedResponse } from '@/lib/api-route-handler'

// GET route - simplified with createRouteHandler
export const GET = createRouteHandler(
  async (req, context) => {
    const { teamId, rateLimitResult } = context

    // Get all tasks for this team
    const tasks = await prisma.task.findMany({
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
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    })

    return createSuccessResponse({ tasks }, 200, rateLimitResult)
  },
  {
    requiredAccessLevel: 'READ_ONLY',
    method: 'GET',
    errorContext: {
      endpoint: '/api/teams/[teamId]/tasks',
    },
  }
)

// POST route - simplified with createRouteHandler
export const POST = createRouteHandler(
  async (req, context) => {
    const { teamId, user, rateLimitResult } = context
    const validatedData = context.validatedData!

    const {
      name,
      description,
      patientName,
      assignedToId,
      priority,
      status,
      dueDate,
    } = validatedData

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
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Use provided patientName or default to team's patient name
    const finalPatientName =
      patientName ||
      (team.patient
        ? team.patient.name ||
          `${team.patient.firstName || ''} ${team.patient.lastName || ''}`.trim()
        : null)

    // Create task
    const task = await prisma.task.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        teamId: teamId,
        patientName: finalPatientName,
        createdById: user.id,
        assignedToId: assignedToId || null,
        priority: priority || 'MEDIUM',
        status: status || 'TODO',
        dueDate: dueDate ? new Date(dueDate) : null,
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

    return createCreatedResponse({ task }, rateLimitResult)
  },
  {
    requiredAccessLevel: 'FULL',
    method: 'POST',
    schema: createTaskSchema,
    errorContext: {
      endpoint: '/api/teams/[teamId]/tasks',
    },
  }
)

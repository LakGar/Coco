/**
 * Shared utilities for data fetching patterns
 * Reduces duplication in components and API routes
 */

import { prisma } from './prisma'

/**
 * Standard user select fields for API responses
 */
export const userSelectFields = {
  id: true,
  name: true,
  firstName: true,
  lastName: true,
  email: true,
  imageUrl: true,
} as const

/**
 * Standard include for createdBy/assignedTo relations
 */
export const userInclude = {
  select: userSelectFields,
} as const

/**
 * Get team with patient information
 */
export async function getTeamWithPatient(teamId: string) {
  return prisma.careTeam.findUnique({
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
}

/**
 * Get patient name from team or provided value
 */
export function getPatientName(
  team: Awaited<ReturnType<typeof getTeamWithPatient>>,
  providedName?: string | null
): string | null {
  if (providedName) {
    return providedName
  }

  if (team?.patient) {
    return (
      team.patient.name ||
      `${team.patient.firstName || ''} ${team.patient.lastName || ''}`.trim() ||
      null
    )
  }

  return null
}

/**
 * Standard task include for API responses
 */
export const taskInclude = {
  include: {
    createdBy: userInclude,
    assignedTo: userInclude,
  },
} as const

/**
 * Standard routine include for API responses
 */
export const routineInclude = {
  include: {
    createdBy: userInclude,
    instances: {
      orderBy: {
        createdAt: 'desc',
      },
      take: 30,
    },
    _count: {
      select: {
        instances: true,
      },
    },
  },
} as const

/**
 * Standard mood include for API responses
 */
export const moodInclude = {
  include: {
    loggedBy: userInclude,
  },
} as const

/**
 * Standard note include for API responses
 */
export const noteInclude = {
  include: {
    createdBy: userInclude,
    lastEditedBy: userInclude,
    editors: {
      include: {
        user: userInclude,
      },
    },
    viewers: {
      include: {
        user: userInclude,
      },
    },
  },
} as const

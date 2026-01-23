import { requireAuth, isAuthError } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { createInternalErrorResponse } from '@/lib/error-handler'

export async function GET() {
  try {
    const authResult = await requireAuth()

    if (isAuthError(authResult)) {
      // If not authenticated, return onboarding incomplete
      return NextResponse.json({
        onboardingComplete: false,
        userExists: false,
        isExistingTeamMember: false,
      })
    }

    const { user: currentUser } = authResult

    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        onboardingComplete: true,
        teamMemberships: {
          where: {
            userId: { not: null }, // Only existing memberships
          },
          select: {
            id: true,
          },
        },
      },
    })

    if (!user) {
      // User doesn't exist in database yet
      return NextResponse.json({
        onboardingComplete: false,
        userExists: false,
        isExistingTeamMember: false,
      })
    }

    return NextResponse.json({
      onboardingComplete: user.onboardingComplete,
      userExists: true,
      isExistingTeamMember: user.teamMemberships.length > 0,
    })
  } catch (error) {
    return createInternalErrorResponse(error, {
      endpoint: "/api/check-onboarding",
      method: "GET",
    })
  }
}


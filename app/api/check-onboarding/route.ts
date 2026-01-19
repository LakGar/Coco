import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        onboardingComplete: true,
      },
    })

    if (!user) {
      // User doesn't exist in database yet
      return NextResponse.json({
        onboardingComplete: false,
        userExists: false,
      })
    }

    return NextResponse.json({
      onboardingComplete: user.onboardingComplete,
      userExists: true,
    })
  } catch (error) {
    console.error('Error checking onboarding status:', error)
    return NextResponse.json(
      {
        error: 'Error checking onboarding status',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}


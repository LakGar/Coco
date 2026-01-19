import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

/**
 * Manual sync endpoint to sync current Clerk user to database
 * Useful for syncing existing users or testing
 */
export async function POST() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get full user data from Clerk
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return NextResponse.json(
        { error: 'User not found in Clerk' },
        { status: 404 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (existingUser) {
      // Update existing user
      const updatedUser = await prisma.user.update({
        where: { clerkId: userId },
        data: {
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          firstName: clerkUser.firstName || null,
          lastName: clerkUser.lastName || null,
          imageUrl: clerkUser.imageUrl || null,
        },
      })

      return NextResponse.json({
        message: 'User updated successfully',
        user: updatedUser,
      })
    } else {
      // Create new user
      const newUser = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          firstName: clerkUser.firstName || null,
          lastName: clerkUser.lastName || null,
          imageUrl: clerkUser.imageUrl || null,
          role: 'CAREGIVER', // Default role, will be updated in onboarding
          onboardingComplete: false,
        },
      })

      return NextResponse.json({
        message: 'User created successfully',
        user: newUser,
      })
    }
  } catch (error) {
    console.error('Error syncing user:', error)
    return NextResponse.json(
      {
        error: 'Error syncing user',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}


import { requireAuth, isAuthError } from '@/lib/auth-middleware'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { createNotFoundErrorResponse, createInternalErrorResponse } from '@/lib/error-handler'

/**
 * Manual sync endpoint to sync current Clerk user to database
 * Useful for syncing existing users or testing
 */
export async function POST() {
  try {
    const authResult = await requireAuth()

    if (isAuthError(authResult)) {
      return authResult.response
    }

    const { userId } = await auth()

    if (!userId) {
      return createNotFoundErrorResponse("User ID not found", {
        endpoint: "/api/sync-user",
        method: "POST",
      })
    }

    // Get full user data from Clerk
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return createNotFoundErrorResponse("User not found in Clerk", {
        endpoint: "/api/sync-user",
        method: "POST",
      })
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
    return createInternalErrorResponse(error, {
      endpoint: "/api/sync-user",
      method: "POST",
    })
  }
}


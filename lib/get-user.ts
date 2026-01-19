import { auth } from '@clerk/nextjs/server'
import { prisma } from './prisma'

/**
 * Get the current user from the database using their Clerk ID
 * Returns null if user is not authenticated or not found in database
 */
export async function getCurrentUser() {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        clerkId: userId,
      },
    })

    return user
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}


import { auth } from '@clerk/nextjs/server'
import { prisma } from './prisma'
import { loggerUtils } from './logger'

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
    loggerUtils.logError(error, { type: "get_user_error", clerkId: userId })
    return null
  }
}


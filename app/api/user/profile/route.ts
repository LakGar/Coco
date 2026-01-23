import { requireAuth, isAuthError } from '@/lib/auth-middleware'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { createNotFoundErrorResponse, createInternalErrorResponse } from '@/lib/error-handler'

export async function GET() {
  try {
    const authResult = await requireAuth()

    if (isAuthError(authResult)) {
      return authResult.response
    }

    const { user } = authResult

    return NextResponse.json({ user: {
      id: user.id,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      imageUrl: user.imageUrl,
    } })
  } catch (error) {
    return createInternalErrorResponse(error, {
      endpoint: "/api/user/profile",
      method: "GET",
    })
  }
}


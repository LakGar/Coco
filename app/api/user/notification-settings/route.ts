import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { requireAuth, isAuthError } from '@/lib/auth-middleware'
import { createInternalErrorResponse, createValidationErrorResponse } from '@/lib/error-handler'
import { rateLimit, addRateLimitHeaders } from '@/lib/rate-limit'
import { z } from 'zod'
import { NotificationFrequency } from '@prisma/client'
import { notificationSettingsSchema } from '@/lib/validations'

const updateNotificationSettingsSchema = notificationSettingsSchema

export async function GET(req: Request) {
  try {
    const authResult = await requireAuth()

    if (isAuthError(authResult)) {
      return authResult.response
    }

    const { user } = authResult

    // Rate limiting
    const rateLimitResult = await rateLimit(req, "GET", user.clerkId || user.id)
    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        {
          error: "Too many requests",
          message: "Rate limit exceeded. Please try again later.",
        },
        { status: 429 }
      )
      addRateLimitHeaders(response.headers, rateLimitResult.limit, rateLimitResult.remaining, rateLimitResult.reset)
      return response
    }

    // Get or create notification settings
    let settings = await prisma.userNotificationSettings.findUnique({
      where: { userId: user.id },
    })

    // If no settings exist, create default ones
    if (!settings) {
      settings = await prisma.userNotificationSettings.create({
        data: {
          userId: user.id,
        },
      })
    }

    const response = NextResponse.json({ settings })
    addRateLimitHeaders(response.headers, rateLimitResult.limit, rateLimitResult.remaining, rateLimitResult.reset)
    return response
  } catch (error) {
    return createInternalErrorResponse(error, {
      endpoint: "/api/user/notification-settings",
      method: "GET",
    })
  }
}

export async function PATCH(req: Request) {
  try {
    const authResult = await requireAuth()

    if (isAuthError(authResult)) {
      return authResult.response
    }

    const { user } = authResult

    // Rate limiting
    const rateLimitResult = await rateLimit(req, "PATCH", user.clerkId || user.id)
    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        {
          error: "Too many requests",
          message: "Rate limit exceeded. Please try again later.",
        },
        { status: 429 }
      )
      addRateLimitHeaders(response.headers, rateLimitResult.limit, rateLimitResult.remaining, rateLimitResult.reset)
      return response
    }

    // Parse and validate request body
    const body = await req.json()
    const validation = updateNotificationSettingsSchema.safeParse(body)

    if (!validation.success) {
      return createValidationErrorResponse(validation.error, {
        endpoint: "/api/user/notification-settings",
        method: "PATCH",
        userId: user.id,
      })
    }

    // Get or create notification settings
    let settings = await prisma.userNotificationSettings.findUnique({
      where: { userId: user.id },
    })

    if (!settings) {
      // Create with defaults and updates
      settings = await prisma.userNotificationSettings.create({
        data: {
          userId: user.id,
          ...validation.data,
        },
      })
    } else {
      // Update existing settings
      settings = await prisma.userNotificationSettings.update({
        where: { id: settings.id },
        data: validation.data,
      })
    }

    const response = NextResponse.json({
      success: true,
      settings,
    })
    addRateLimitHeaders(response.headers, rateLimitResult.limit, rateLimitResult.remaining, rateLimitResult.reset)
    return response
  } catch (error) {
    return createInternalErrorResponse(error, {
      endpoint: "/api/user/notification-settings",
      method: "PATCH",
    })
  }
}

import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { ContactType, NotificationType } from '@prisma/client'
import { createContactSchema, validateRequest } from '@/lib/validations'
import { rateLimit, addRateLimitHeaders } from '@/lib/rate-limit'
import { requireTeamAccess, extractTeamId, isAuthError } from '@/lib/auth-middleware'
import { createValidationErrorResponse, createInternalErrorResponse } from '@/lib/error-handler'
import { checkAndCreateContactSetupNotification } from '@/lib/contact-notifications'

export async function GET(
  req: Request,
  { params }: { params: { teamId: string } | Promise<{ teamId: string }> }
) {
  try {
    const teamId = await extractTeamId(params)
    const authResult = await requireTeamAccess(teamId, "READ_ONLY")

    if (isAuthError(authResult)) {
      return authResult.response
    }

    const { user } = authResult

    // Rate limiting
    const rateLimitResult = await rateLimit(req, "GET", user.clerkId || user.id)
    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
        },
        { status: 429 }
      )
      addRateLimitHeaders(response.headers, rateLimitResult.limit, rateLimitResult.remaining, rateLimitResult.reset)
      return response
    }

    // Get all contacts for this team
    const contacts = await prisma.contact.findMany({
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
      },
      orderBy: [
        { type: 'asc' },
        { isPrimary: 'desc' },
        { name: 'asc' },
      ],
    })

    const response = NextResponse.json({ contacts })
    addRateLimitHeaders(response.headers, rateLimitResult.limit, rateLimitResult.remaining, rateLimitResult.reset)
    return response
  } catch (error) {
    const teamId = await extractTeamId(params)
    return createInternalErrorResponse(error, {
      endpoint: "/api/teams/[teamId]/contacts",
      method: "GET",
      teamId,
    })
  }
}

export async function POST(
  req: Request,
  { params }: { params: { teamId: string } | Promise<{ teamId: string }> }
) {
  try {
    const teamId = await extractTeamId(params)
    const authResult = await requireTeamAccess(teamId, "FULL")

    if (isAuthError(authResult)) {
      return authResult.response
    }

    const { user } = authResult

    // Rate limiting
    const rateLimitResult = await rateLimit(req, "POST", user.clerkId || user.id)
    if (!rateLimitResult.success) {
      const response = NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
        },
        { status: 429 }
      )
      addRateLimitHeaders(response.headers, rateLimitResult.limit, rateLimitResult.remaining, rateLimitResult.reset)
      return response
    }

    // Validate request body
    const validation = await validateRequest(req, createContactSchema)
    if (validation.error) {
      return createValidationErrorResponse(validation.error, {
        endpoint: "/api/teams/[teamId]/contacts",
        method: "POST",
        teamId,
        userId: user.id,
      })
    }

    const { type, name, phone, email, address, notes, isPrimary } = validation.data

    // If setting as primary, unset other primary contacts of the same type
    if (isPrimary) {
      await prisma.contact.updateMany({
        where: {
          teamId: teamId,
          type: type as ContactType,
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      })
    }

    // Create contact
    const contact = await prisma.contact.create({
      data: {
        teamId: teamId,
        type: type as ContactType,
        name: name.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address: address?.trim() || null,
        notes: notes?.trim() || null,
        isPrimary: isPrimary || false,
        createdById: user.id,
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
      },
    })

    // If this is an emergency contact, check and update notifications for all team members
    if (type === ContactType.EMERGENCY_CONTACT) {
      const teamMembers = await prisma.careTeamMember.findMany({
        where: { teamId: teamId },
        select: { userId: true },
      })

      // Mark contact setup notifications as read for all members
      await prisma.notification.updateMany({
        where: {
          teamId: teamId,
          type: NotificationType.CONTACT_SETUP_REMINDER,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      })
    }

    const response = NextResponse.json({ contact }, { status: 201 })
    addRateLimitHeaders(response.headers, rateLimitResult.limit, rateLimitResult.remaining, rateLimitResult.reset)
    return response
  } catch (error) {
    const teamId = await extractTeamId(params)
    return createInternalErrorResponse(error, {
      endpoint: "/api/teams/[teamId]/contacts",
      method: "POST",
      teamId,
    })
  }
}

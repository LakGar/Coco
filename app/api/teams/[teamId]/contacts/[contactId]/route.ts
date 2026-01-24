import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { ContactType } from '@prisma/client'
import { updateContactSchema, validateRequest } from '@/lib/validations'
import { rateLimit, addRateLimitHeaders } from '@/lib/rate-limit'
import { requireTeamAccess, extractTeamId, isAuthError } from '@/lib/auth-middleware'
import { createValidationErrorResponse, createNotFoundErrorResponse, createInternalErrorResponse } from '@/lib/error-handler'

export async function PATCH(
  req: Request,
  { params }: { params: { teamId: string; contactId: string } | Promise<{ teamId: string; contactId: string }> }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const { teamId, contactId } = resolvedParams
    const authResult = await requireTeamAccess(teamId, "FULL")

    if (isAuthError(authResult)) {
      return authResult.response
    }

    const { user } = authResult

    // Rate limiting
    const rateLimitResult = await rateLimit(req, "PATCH", user.clerkId || user.id)
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

    // Find the contact
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        teamId: teamId,
      },
    })

    if (!contact) {
      return createNotFoundErrorResponse("Contact", {
        endpoint: "/api/teams/[teamId]/contacts/[contactId]",
        method: "PATCH",
        teamId,
        contactId,
        userId: user.id,
      })
    }

    // Validate request body
    const validation = await validateRequest(req, updateContactSchema)
    if (validation.error) {
      return createValidationErrorResponse(validation.error, {
        endpoint: "/api/teams/[teamId]/contacts/[contactId]",
        method: "PATCH",
        teamId,
        contactId,
        userId: user.id,
      })
    }

    const { type, name, phone, email, address, notes, isPrimary } = validation.data

    // If setting as primary, unset other primary contacts of the same type
    if (isPrimary && (type !== undefined ? type : contact.type)) {
      await prisma.contact.updateMany({
        where: {
          teamId: teamId,
          type: (type as ContactType) || contact.type,
          isPrimary: true,
          id: { not: contactId },
        },
        data: {
          isPrimary: false,
        },
      })
    }

    // Update contact
    const updatedContact = await prisma.contact.update({
      where: { id: contactId },
      data: {
        ...(type !== undefined && { type: type as ContactType }),
        ...(name !== undefined && { name: name.trim() }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(address !== undefined && { address: address?.trim() || null }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
        ...(isPrimary !== undefined && { isPrimary }),
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

    const response = NextResponse.json({ contact: updatedContact })
    addRateLimitHeaders(response.headers, rateLimitResult.limit, rateLimitResult.remaining, rateLimitResult.reset)
    return response
  } catch (error) {
    const resolvedParams = params instanceof Promise ? await params : params
    return createInternalErrorResponse(error, {
      endpoint: "/api/teams/[teamId]/contacts/[contactId]",
      method: "PATCH",
      teamId: resolvedParams.teamId,
      contactId: resolvedParams.contactId,
    })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { teamId: string; contactId: string } | Promise<{ teamId: string; contactId: string }> }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params
    const { teamId, contactId } = resolvedParams
    const authResult = await requireTeamAccess(teamId, "FULL")

    if (isAuthError(authResult)) {
      return authResult.response
    }

    const { user } = authResult

    // Rate limiting
    const rateLimitResult = await rateLimit(req, "DELETE", user.clerkId || user.id)
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

    // Find the contact
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        teamId: teamId,
      },
    })

    if (!contact) {
      return createNotFoundErrorResponse("Contact", {
        endpoint: "/api/teams/[teamId]/contacts/[contactId]",
        method: "DELETE",
        teamId,
        contactId,
        userId: user.id,
      })
    }

    // Delete contact
    await prisma.contact.delete({
      where: { id: contactId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const resolvedParams = params instanceof Promise ? await params : params
    return createInternalErrorResponse(error, {
      endpoint: "/api/teams/[teamId]/contacts/[contactId]",
      method: "DELETE",
      teamId: resolvedParams.teamId,
      contactId: resolvedParams.contactId,
    })
  }
}

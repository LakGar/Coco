import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { updateNoteSchema, validateRequest } from "@/lib/validations"
import { requireTeamAccess, extractTeamId, isAuthError } from "@/lib/auth-middleware"
import { createValidationErrorResponse, createNotFoundErrorResponse, createInternalErrorResponse } from "@/lib/error-handler"
import { createAuditLog, AUDIT_ACTIONS } from "@/lib/audit"

// GET /api/teams/[teamId]/notes/[noteId] - Get a specific note
export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string; noteId: string } | Promise<{ teamId: string; noteId: string }> }
) {
  try {
    // Extract teamId and check authorization
    const resolvedParams = params instanceof Promise ? await params : params
    const { teamId, noteId } = resolvedParams
    const authResult = await requireTeamAccess(teamId, "READ_ONLY") // Read operations allow READ_ONLY

    if (isAuthError(authResult)) {
      return authResult.response
    }

    const { user } = authResult

    // Get note and check permissions
    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        teamId,
        OR: [
          { createdById: user.id },
          { editors: { some: { userId: user.id } } },
          { viewers: { some: { userId: user.id } } },
        ],
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
        lastEditedBy: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true,
          },
        },
        editors: {
          include: {
            user: {
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
        },
        viewers: {
          include: {
            user: {
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
        },
      },
    })

    if (!note) {
      return createNotFoundErrorResponse("Note not found", {
        endpoint: "/api/teams/[teamId]/notes/[noteId]",
        method: "GET",
        teamId,
        noteId,
      })
    }

    const isCreator = note.createdById === user.id
    const isEditor = note.editors.some((e) => e.userId === user.id)

    return NextResponse.json({
      ...note,
      canEdit: isCreator || isEditor,
      canDelete: isCreator,
      userRole: isCreator ? "creator" : isEditor ? "editor" : "viewer",
    })
  } catch (error) {
    const resolvedParams = params instanceof Promise ? await params : params
    const { teamId } = resolvedParams
    return createInternalErrorResponse(error, {
      endpoint: "/api/teams/[teamId]/notes/[noteId]",
      method: "GET",
      teamId,
    })
  }
}

// PATCH /api/teams/[teamId]/notes/[noteId] - Update a note (only creators and editors)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { teamId: string; noteId: string } | Promise<{ teamId: string; noteId: string }> }
) {
  try {
    // Extract teamId and check authorization
    const resolvedParams = params instanceof Promise ? await params : params
    const { teamId, noteId } = resolvedParams
    const authResult = await requireTeamAccess(teamId, "READ_ONLY") // Need team membership, but note permissions checked separately

    if (isAuthError(authResult)) {
      return authResult.response
    }

    const { user } = authResult

    // Check if user can edit this note
    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        teamId,
        OR: [
          { createdById: user.id },
          { editors: { some: { userId: user.id } } },
        ],
      },
    })

    if (!note) {
      return createNotFoundErrorResponse("Note not found or you don't have permission to edit", {
        endpoint: "/api/teams/[teamId]/notes/[noteId]",
        method: "PATCH",
        teamId,
        noteId,
      })
    }

    // Validate request body
    const validation = await validateRequest(request, updateNoteSchema)
    if (validation.error) {
      return createValidationErrorResponse(validation.error, {
        endpoint: "/api/teams/[teamId]/notes/[noteId]",
        method: "PATCH",
        teamId,
        noteId,
      })
    }
    const { title, content } = validation.data

    // Update note
    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: {
        title: title !== undefined ? title : note.title,
        content: content !== undefined ? content : note.content,
        lastEditedById: user.id,
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
        lastEditedBy: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true,
          },
        },
        editors: {
          include: {
            user: {
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
        },
        viewers: {
          include: {
            user: {
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
        },
      },
    })

    await createAuditLog({
      teamId,
      actorId: user.id,
      action: AUDIT_ACTIONS.NOTE_UPDATED,
      entityType: "Note",
      entityId: noteId,
      metadata: { title: updatedNote.title },
    })

    // Calculate permissions (same logic as GET endpoint)
    const isCreator = updatedNote.createdById === user.id
    const isEditor = updatedNote.editors.some((e) => e.userId === user.id)

    return NextResponse.json({
      ...updatedNote,
      canEdit: isCreator || isEditor,
      canDelete: isCreator,
      userRole: isCreator ? "creator" : isEditor ? "editor" : "viewer",
    })
  } catch (error) {
    const resolvedParams = params instanceof Promise ? await params : params
    const { teamId } = resolvedParams
    return createInternalErrorResponse(error, {
      endpoint: "/api/teams/[teamId]/notes/[noteId]",
      method: "PATCH",
      teamId,
    })
  }
}

// DELETE /api/teams/[teamId]/notes/[noteId] - Delete a note (only creator)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { teamId: string; noteId: string } | Promise<{ teamId: string; noteId: string }> }
) {
  try {
    // Extract teamId and check authorization
    const resolvedParams = params instanceof Promise ? await params : params
    const { teamId, noteId } = resolvedParams
    const authResult = await requireTeamAccess(teamId, "READ_ONLY") // Need team membership, but note permissions checked separately

    if (isAuthError(authResult)) {
      return authResult.response
    }

    const { user } = authResult

    // Check if user is the creator of this note
    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        teamId,
        createdById: user.id,
      },
    })

    if (!note) {
      return createNotFoundErrorResponse("Note not found or you don't have permission to delete", {
        endpoint: "/api/teams/[teamId]/notes/[noteId]",
        method: "DELETE",
        teamId,
        noteId,
      })
    }

    await createAuditLog({
      teamId,
      actorId: user.id,
      action: AUDIT_ACTIONS.NOTE_DELETED,
      entityType: "Note",
      entityId: noteId,
      metadata: { title: note.title },
    })

    // Delete note (cascade will handle editors and viewers)
    await prisma.note.delete({
      where: { id: noteId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const resolvedParams = params instanceof Promise ? await params : params
    const { teamId } = resolvedParams
    return createInternalErrorResponse(error, {
      endpoint: "/api/teams/[teamId]/notes/[noteId]",
      method: "DELETE",
      teamId,
    })
  }
}


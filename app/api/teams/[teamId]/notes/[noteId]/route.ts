import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/get-user"

// GET /api/teams/[teamId]/notes/[noteId] - Get a specific note
export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string; noteId: string } | Promise<{ teamId: string; noteId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = params instanceof Promise ? await params : params
    const { teamId, noteId } = resolvedParams
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user is a member of this team
    const membership = await prisma.careTeamMember.findFirst({
      where: {
        teamId,
        userId: user.id,
      },
    })

    if (!membership) {
      return NextResponse.json({ error: "Not a team member" }, { status: 403 })
    }

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
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
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
    console.error("Error fetching note:", error)
    return NextResponse.json(
      { error: "Failed to fetch note" },
      { status: 500 }
    )
  }
}

// PATCH /api/teams/[teamId]/notes/[noteId] - Update a note (only creators and editors)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { teamId: string; noteId: string } | Promise<{ teamId: string; noteId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = params instanceof Promise ? await params : params
    const { teamId, noteId } = resolvedParams
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user is a member of this team
    const membership = await prisma.careTeamMember.findFirst({
      where: {
        teamId,
        userId: user.id,
      },
    })

    if (!membership) {
      return NextResponse.json({ error: "Not a team member" }, { status: 403 })
    }

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
      return NextResponse.json(
        { error: "Note not found or you don't have permission to edit" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { title, content } = body

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

    return NextResponse.json(updatedNote)
  } catch (error) {
    console.error("Error updating note:", error)
    return NextResponse.json(
      { error: "Failed to update note" },
      { status: 500 }
    )
  }
}

// DELETE /api/teams/[teamId]/notes/[noteId] - Delete a note (only creator)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { teamId: string; noteId: string } | Promise<{ teamId: string; noteId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = params instanceof Promise ? await params : params
    const { teamId, noteId } = resolvedParams
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user is the creator of this note
    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        teamId,
        createdById: user.id,
      },
    })

    if (!note) {
      return NextResponse.json(
        { error: "Note not found or you don't have permission to delete" },
        { status: 404 }
      )
    }

    // Delete note (cascade will handle editors and viewers)
    await prisma.note.delete({
      where: { id: noteId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting note:", error)
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 }
    )
  }
}


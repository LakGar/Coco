import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/get-user"

// GET /api/teams/[teamId]/notes - Get all notes for a team (user can see if they're creator, editor, or viewer)
export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } | Promise<{ teamId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = params instanceof Promise ? await params : params
    const { teamId } = resolvedParams
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

    // Get all notes where user is creator, editor, or viewer
    const notes = await prisma.note.findMany({
      where: {
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
      orderBy: {
        updatedAt: "desc",
      },
    })

    // Add permission info for each note
    const notesWithPermissions = notes.map((note: any) => {
      const isCreator = note.createdById === user.id
      const isEditor = note.editors.some((e: any) => e.userId === user.id)
      const isViewer = note.viewers.some((v: any) => v.userId === user.id)

      return {
        ...note,
        canEdit: isCreator || isEditor,
        canDelete: isCreator,
        userRole: isCreator ? "creator" : isEditor ? "editor" : "viewer",
      }
    })

    return NextResponse.json({ notes: notesWithPermissions })
  } catch (error) {
    console.error("Error fetching notes:", error)
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    )
  }
}

// POST /api/teams/[teamId]/notes - Create a new note (only FULL access users)
export async function POST(
  request: NextRequest,
  { params }: { params: { teamId: string } | Promise<{ teamId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = params instanceof Promise ? await params : params
    const { teamId } = resolvedParams
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user is a member of this team with FULL access
    const membership = await prisma.careTeamMember.findFirst({
      where: {
        teamId,
        userId: user.id,
        accessLevel: "FULL",
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: "Full access required to create notes" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, content, editorIds = [], viewerIds = [] } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      )
    }

    // Validate that editorIds and viewerIds are team members
    const teamMemberIds = await prisma.careTeamMember.findMany({
      where: { teamId },
      select: { userId: true },
    })
    const validUserIds = teamMemberIds
      .map((m: { userId: string | null }) => m.userId)
      .filter((id: string | null): id is string => id !== null)

    const validEditorIds = (editorIds as string[]).filter((id: string) =>
      validUserIds.includes(id)
    )
    const validViewerIds = (viewerIds as string[]).filter((id: string) =>
      validUserIds.includes(id)
    )

    // Create note with creator as editor by default
    const note = await prisma.note.create({
      data: {
        teamId,
        createdById: user.id,
        title,
        content,
        editors: {
          create: [
            { userId: user.id }, // Creator is always an editor
            ...validEditorIds
              .filter((id) => id !== user.id) // Don't duplicate creator
              .map((id) => ({ userId: id })),
          ],
        },
        viewers: {
          create: validViewerIds
            .filter((id) => id !== user.id && !validEditorIds.includes(id)) // Don't duplicate creator or editors
            .map((id) => ({ userId: id })),
        },
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

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error("Error creating note:", error)
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    )
  }
}


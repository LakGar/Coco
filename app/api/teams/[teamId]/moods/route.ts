import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/get-user"

// GET /api/teams/[teamId]/moods - Get moods for a team
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

    // Get moods for this team, ordered by most recent first
    const moods = await prisma.mood.findMany({
      where: {
        teamId,
      },
      include: {
        loggedBy: {
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
      orderBy: {
        observedAt: "desc",
      },
      take: 30, // Last 30 mood entries
    })

    return NextResponse.json(moods)
  } catch (error) {
    console.error("Error fetching moods:", error)
    return NextResponse.json(
      { error: "Failed to fetch moods" },
      { status: 500 }
    )
  }
}

// POST /api/teams/[teamId]/moods - Create a new mood entry
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

    const body = await request.json()
    const { rating, notes, observedAt } = body

    if (!rating) {
      return NextResponse.json(
        { error: "Rating is required" },
        { status: 400 }
      )
    }

    // Validate rating
    const validRatings = [
      "CALM", "CONTENT", "NEUTRAL", "RELAXED",
      "SAD", "WITHDRAWN", "TIRED",
      "ANXIOUS", "IRRITABLE", "RESTLESS", "CONFUSED"
    ]
    if (!validRatings.includes(rating)) {
      return NextResponse.json(
        { error: "Invalid rating" },
        { status: 400 }
      )
    }

    // Create mood entry
    const mood = await prisma.mood.create({
      data: {
        teamId,
        loggedById: user.id,
        rating,
        notes: notes || null,
        observedAt: observedAt ? new Date(observedAt) : new Date(),
      },
      include: {
        loggedBy: {
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

    return NextResponse.json(mood, { status: 201 })
  } catch (error) {
    console.error("Error creating mood:", error)
    return NextResponse.json(
      { error: "Failed to create mood" },
      { status: 500 }
    )
  }
}


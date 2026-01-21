import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/get-user"
import { rateLimit, addRateLimitHeaders } from "@/lib/rate-limit"

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

    // Rate limiting
    const rateLimitResult = await rateLimit(request, "GET", userId)
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

    const response = NextResponse.json(moods)
    addRateLimitHeaders(response.headers, rateLimitResult.limit, rateLimitResult.remaining, rateLimitResult.reset)
    return response
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

    // Rate limiting
    const rateLimitResult = await rateLimit(request, "POST", userId)
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

    // Validate request body
    const validation = await validateRequest(request, createMoodSchema)
    if (validation.error) {
      return NextResponse.json(
        formatZodError(validation.error),
        { status: 400 }
      )
    }
    const { rating, notes, observedAt } = validation.data

    // Create mood entry
    const mood = await prisma.mood.create({
      data: {
        teamId,
        loggedById: user.id,
        rating: rating as any, // Type assertion for enum
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

    const response = NextResponse.json(mood, { status: 201 })
    addRateLimitHeaders(response.headers, rateLimitResult.limit, rateLimitResult.remaining, rateLimitResult.reset)
    return response
  } catch (error: any) {
    console.error("Error creating mood:", error)
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
    })
    return NextResponse.json(
      { 
        error: "Failed to create mood",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    )
  }
}


import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Background job to generate routine instances and tasks
 * This should be called by a cron job (e.g., Vercel Cron, external service)
 * 
 * To set up with Vercel Cron, add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/generate-routine-instances",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 * 
 * Or call manually: POST /api/cron/generate-routine-instances?secret=YOUR_SECRET
 */
export async function POST(req: Request) {
  try {
    // Verify secret to prevent unauthorized access
    const { searchParams } = new URL(req.url)
    const secret = searchParams.get('secret')
    const expectedSecret = process.env.CRON_SECRET

    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Generate instances for the next 7 days by default
    const daysAhead = parseInt(searchParams.get('daysAhead') || '7')
    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() + daysAhead)

    console.log(`[Cron] Generating routine instances from ${today.toISOString()} to ${endDate.toISOString()}`)

    // Get all active routines
    const activeRoutines = await prisma.routine.findMany({
      where: {
        isActive: true,
        startDate: {
          lte: endDate,
        },
        OR: [
          { endDate: null },
          { endDate: { gte: today } },
        ],
      },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    })

    let instancesCreated = 0
    let tasksCreated = 0
    const errors: string[] = []

    for (const routine of activeRoutines) {
      try {
        // Generate dates for this routine based on recurrence pattern
        const dates = generateRecurrenceDates(
          routine.recurrenceType,
          routine.recurrenceDaysOfWeek,
          routine.recurrenceDayOfMonth,
          routine.recurrenceSpecificDates,
          routine.startDate,
          routine.endDate,
          today,
          endDate
        )

        for (const date of dates) {
          // Check if instance already exists
          const existingInstance = await prisma.routineInstance.findUnique({
            where: {
              routineId_scheduledDate: {
                routineId: routine.id,
                scheduledDate: date,
              },
            },
          })

          if (existingInstance) {
            continue // Skip if already exists
          }

          // Create routine instance
          const instance = await prisma.routineInstance.create({
            data: {
              routineId: routine.id,
              scheduledDate: date,
              isCompleted: false,
            },
          })

          instancesCreated++

          // Generate task if auto-generate is enabled
          if (routine.autoGenerateTasks) {
            // Determine due date/time
            let dueDate = new Date(date)
            if (routine.timeOfDay) {
              const [hours, minutes] = routine.timeOfDay.split(':').map(Number)
              dueDate.setHours(hours, minutes, 0, 0)
            } else {
              // Default to end of day
              dueDate.setHours(23, 59, 59, 999)
            }

            // Create task
            const task = await prisma.task.create({
              data: {
                name: routine.name,
                description: routine.description,
                teamId: routine.teamId,
                createdById: routine.createdById,
                assignedToId: routine.assignedToId,
                priority: routine.priority,
                status: 'TODO',
                dueDate: dueDate,
                routineId: routine.id,
                routineInstanceId: instance.id,
              },
            })

            tasksCreated++
          }
        }
      } catch (error) {
        const errorMessage = `Error processing routine ${routine.id}: ${error instanceof Error ? error.message : String(error)}`
        console.error(errorMessage)
        errors.push(errorMessage)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${instancesCreated} instances and ${tasksCreated} tasks`,
      instancesCreated,
      tasksCreated,
      routinesProcessed: activeRoutines.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('[Cron] Error generating routine instances:', error)
    return NextResponse.json(
      {
        error: 'Error generating routine instances',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

/**
 * Generate dates for a routine based on its recurrence pattern
 */
function generateRecurrenceDates(
  recurrenceType: string,
  recurrenceDaysOfWeek: number[],
  recurrenceDayOfMonth: number | null,
  recurrenceSpecificDates: Date[],
  startDate: Date,
  endDate: Date | null,
  fromDate: Date,
  toDate: Date
): Date[] {
  const dates: Date[] = []
  const current = new Date(fromDate)
  current.setHours(0, 0, 0, 0)

  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)

  const routineEnd = endDate ? new Date(endDate) : null
  if (routineEnd) {
    routineEnd.setHours(23, 59, 59, 999)
  }

  while (current <= toDate) {
    // Check if before start date or after end date
    if (current < start) {
      current.setDate(current.getDate() + 1)
      continue
    }

    if (routineEnd && current > routineEnd) {
      break
    }

    let shouldInclude = false

    switch (recurrenceType) {
      case 'DAILY':
        shouldInclude = true
        break

      case 'WEEKLY':
        // Check if current day of week matches any of the specified days
        const dayOfWeek = current.getDay()
        shouldInclude = recurrenceDaysOfWeek.includes(dayOfWeek)
        break

      case 'MONTHLY':
        // Check if current day of month matches
        if (recurrenceDayOfMonth !== null) {
          shouldInclude = current.getDate() === recurrenceDayOfMonth
        }
        break

      case 'CUSTOM_WEEKDAYS':
        // Check if current day of week matches any of the specified days
        const customDayOfWeek = current.getDay()
        shouldInclude = recurrenceDaysOfWeek.includes(customDayOfWeek)
        break

      case 'SPECIFIC_DATES':
        // Check if current date matches any specific date
        shouldInclude = recurrenceSpecificDates.some((specificDate) => {
          const sd = new Date(specificDate)
          sd.setHours(0, 0, 0, 0)
          return sd.getTime() === current.getTime()
        })
        break

      default:
        shouldInclude = false
    }

    if (shouldInclude) {
      dates.push(new Date(current))
    }

    current.setDate(current.getDate() + 1)
  }

  return dates
}


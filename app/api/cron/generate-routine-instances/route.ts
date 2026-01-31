import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { log, loggerUtils } from "@/lib/logger";
import { validateCronSecret } from "@/lib/cron-auth";

/**
 * Background job to generate routine instances and tasks
 * This should be called by a cron job (e.g., Vercel Cron, external service)
 * Secured by CRON_SECRET (Vercel: Bearer header; manual: ?secret=).
 */
export async function POST(req: Request) {
  const authError = validateCronSecret(req);
  if (authError) return authError;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { searchParams } = new URL(req.url);
    // Generate instances for the next 7 days by default
    const daysAhead = parseInt(searchParams.get("daysAhead") || "7");
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + daysAhead);

    log.info(
      {
        type: "cron_start",
        startDate: today.toISOString(),
        endDate: endDate.toISOString(),
      },
      "Generating routine instances",
    );

    // Get all active routines
    const activeRoutines = await prisma.routine.findMany({
      where: {
        isActive: true,
        startDate: {
          lte: endDate,
        },
        OR: [{ endDate: null }, { endDate: { gte: today } }],
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
    });

    let instancesCreated = 0;
    const errors: string[] = [];

    for (const routine of activeRoutines) {
      try {
        // Infer recurrence type from days of week
        // If all 7 days are included, it's DAILY; otherwise it's WEEKLY
        const recurrenceType =
          routine.recurrenceDaysOfWeek.length === 7 ? "DAILY" : "WEEKLY";

        // Generate dates for this routine based on recurrence pattern
        const dates = generateRecurrenceDates(
          recurrenceType,
          routine.recurrenceDaysOfWeek,
          null, // recurrenceDayOfMonth - not in schema
          [], // recurrenceSpecificDates - not in schema
          routine.startDate,
          routine.endDate,
          today,
          endDate,
        );

        for (const date of dates) {
          // Check if instance already exists
          const existingInstance = await prisma.routineInstance.findUnique({
            where: {
              routineId_entryDate: {
                routineId: routine.id,
                entryDate: date,
              },
            },
          });

          if (existingInstance) {
            continue; // Skip if already exists
          }

          // Create routine instance
          const instance = await prisma.routineInstance.create({
            data: {
              routineId: routine.id,
              entryDate: date,
            },
          });

          instancesCreated++;

          // Note: Task generation from routines is not currently implemented
          // as the required fields (autoGenerateTasks, timeOfDay, etc.) are not in the schema
        }
      } catch (error) {
        const errorMessage = `Error processing routine ${routine.id}: ${error instanceof Error ? error.message : String(error)}`;
        loggerUtils.logError(error, {
          type: "cron_routine_error",
          routineId: routine.id,
        });
        errors.push(errorMessage);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${instancesCreated} routine instances`,
      instancesCreated,
      routinesProcessed: activeRoutines.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    loggerUtils.logError(error, { type: "cron_error" });
    return NextResponse.json(
      {
        error: "Error generating routine instances",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
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
  toDate: Date,
): Date[] {
  const dates: Date[] = [];
  const current = new Date(fromDate);
  current.setHours(0, 0, 0, 0);

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const routineEnd = endDate ? new Date(endDate) : null;
  if (routineEnd) {
    routineEnd.setHours(23, 59, 59, 999);
  }

  while (current <= toDate) {
    // Check if before start date or after end date
    if (current < start) {
      current.setDate(current.getDate() + 1);
      continue;
    }

    if (routineEnd && current > routineEnd) {
      break;
    }

    let shouldInclude = false;

    switch (recurrenceType) {
      case "DAILY":
        shouldInclude = true;
        break;

      case "WEEKLY":
        // Check if current day of week matches any of the specified days
        const dayOfWeek = current.getDay();
        shouldInclude = recurrenceDaysOfWeek.includes(dayOfWeek);
        break;

      case "MONTHLY":
        // Check if current day of month matches
        if (recurrenceDayOfMonth !== null) {
          shouldInclude = current.getDate() === recurrenceDayOfMonth;
        }
        break;

      case "CUSTOM_WEEKDAYS":
        // Check if current day of week matches any of the specified days
        const customDayOfWeek = current.getDay();
        shouldInclude = recurrenceDaysOfWeek.includes(customDayOfWeek);
        break;

      case "SPECIFIC_DATES":
        // Check if current date matches any specific date
        shouldInclude = recurrenceSpecificDates.some((specificDate) => {
          const sd = new Date(specificDate);
          sd.setHours(0, 0, 0, 0);
          return sd.getTime() === current.getTime();
        });
        break;

      default:
        shouldInclude = false;
    }

    if (shouldInclude) {
      dates.push(new Date(current));
    }

    current.setDate(current.getDate() + 1);
  }

  return dates;
}

import { prisma } from "./prisma";
import type { JourneyEntryType } from "@prisma/client";
import { startOfDay, endOfDay } from "date-fns";
import { log } from "./logger";

const DEFAULT_SECTION_KEYS = [
  { key: "BASICS", title: "Basics" },
  { key: "SAFETY", title: "Safety" },
  { key: "TRIGGERS", title: "Triggers" },
  { key: "BASELINE", title: "Baseline" },
  { key: "PROVIDERS", title: "Providers" },
  { key: "GOALS", title: "Goals" },
  { key: "MEDICATIONS", title: "Medications" },
];

/**
 * Get or create PatientJourney for team. Uses first admin/physical user as createdById if creating.
 */
export async function getOrCreateJourney(
  teamId: string,
): Promise<{ id: string } | null> {
  let journey = await prisma.patientJourney.findUnique({
    where: { teamId },
    select: { id: true },
  });

  if (journey) return journey;

  const team = await prisma.careTeam.findUnique({
    where: { id: teamId },
    select: { name: true },
  });
  if (!team) return null;

  const adminOrPhysician = await prisma.careTeamMember.findFirst({
    where: {
      teamId,
      userId: { not: null },
      OR: [{ isAdmin: true }, { teamRole: "PHYSICIAN" }],
    },
    select: { userId: true },
  });
  const createdById = adminOrPhysician?.userId;
  if (!createdById) return null;

  journey = await prisma.patientJourney.create({
    data: {
      teamId,
      title: "Patient Journey",
      patientDisplayName: team.name?.replace(/'s Care Team$/, "") ?? null,
      createdById,
      sections: {
        create: DEFAULT_SECTION_KEYS.map(({ key, title }) => ({
          key,
          title,
          content: {},
          updatedById: createdById,
        })),
      },
    },
    select: { id: true },
  });
  return journey;
}

/**
 * Create a system-generated journey entry (no author). Dedupes same-day same-type.
 */
export async function createSystemJourneyEntry(params: {
  teamId: string;
  type: JourneyEntryType;
  title: string;
  content: Record<string, unknown>;
  linkedEntityType?: string | null;
  linkedEntityId?: string | null;
  occurredAt: Date;
}): Promise<void> {
  try {
    const journey = await getOrCreateJourney(params.teamId);
    if (!journey) return;

    const dayStart = startOfDay(params.occurredAt);
    const dayEnd = endOfDay(params.occurredAt);

    const existing = await prisma.journeyEntry.findFirst({
      where: {
        journeyId: journey.id,
        type: params.type,
        authorId: null,
        occurredAt: { gte: dayStart, lte: dayEnd },
      },
    });
    if (existing) return;

    await prisma.journeyEntry.create({
      data: {
        journeyId: journey.id,
        type: params.type,
        title: params.title,
        content: params.content as object,
        authorId: null,
        linkedEntityType: params.linkedEntityType ?? null,
        linkedEntityId: params.linkedEntityId ?? null,
        occurredAt: params.occurredAt,
      },
    });
  } catch (error) {
    log.error(
      {
        type: "journey_entry_error",
        teamId: params.teamId,
        entryType: params.type,
        error,
      },
      "Failed to create system journey entry",
    );
  }
}

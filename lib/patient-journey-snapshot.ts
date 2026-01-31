import { prisma } from "./prisma";
import {
  startOfDay,
  endOfDay,
  subDays,
  format,
  isBefore,
  isAfter,
} from "date-fns";
import type { MoodRating } from "@prisma/client";

/** Chart-ready series point (e.g. for Recharts) */
export interface SeriesPoint {
  date: string;
  [key: string]: string | number | undefined;
}

export interface SnapshotHighlight {
  severity: "info" | "warn" | "critical";
  title: string;
  detail: string;
  relatedLink?: string;
  chartAnchor?: string; // e.g. "tasks" | "mood" | "routine" | "burden" | "medications"
}

export interface SnapshotData {
  rangeDays: number;
  series: {
    tasks?: SeriesPoint[];
    medications?: SeriesPoint[];
    mood?: SeriesPoint[];
    routine?: SeriesPoint[];
    burden?: { date: string; score: number }[];
  };
  totals: {
    tasksCompleted: number;
    tasksOverdue: number;
    tasksDueSoon: number;
    medicationAdherencePercent: number | null;
    routineCompletionPercent: number | null;
    burdenLastScore: number | null;
    burdenDelta: number | null;
    notesCreated: number;
  };
  highlights: SnapshotHighlight[];
}

const POSITIVE_NEUTRAL: MoodRating[] = [
  "CALM",
  "CONTENT",
  "NEUTRAL",
  "RELAXED",
];
const LOW: MoodRating[] = ["SAD", "WITHDRAWN", "TIRED"];
const AGITATED: MoodRating[] = ["ANXIOUS", "IRRITABLE", "RESTLESS", "CONFUSED"];

function moodBucket(rating: MoodRating): "positive" | "low" | "agitated" {
  if (POSITIVE_NEUTRAL.includes(rating)) return "positive";
  if (LOW.includes(rating)) return "low";
  return "agitated";
}

/**
 * Compute deterministic snapshot for a team over the last N days.
 * Includes series for charts and highlights from rules.
 */
export async function computeSnapshotForTeam(
  teamId: string,
  rangeDays: 7 | 30,
): Promise<SnapshotData> {
  const now = new Date();
  const rangeEnd = endOfDay(now);
  const rangeStart = startOfDay(subDays(now, rangeDays));
  const priorEnd = rangeStart;
  const priorStart = startOfDay(subDays(priorEnd, rangeDays));

  const [
    tasksInRange,
    tasksInPrior,
    moodsInRange,
    moodsInPrior,
    routineInstancesInRange,
    routineInstancesInPrior,
    burdenInRange,
    burdenInPrior,
    notesCountInRange,
  ] = await Promise.all([
    getTaskCountsByDay(teamId, rangeStart, rangeEnd),
    getTaskCountsByDay(teamId, priorStart, priorEnd),
    getMoodsByDay(teamId, rangeStart, rangeEnd),
    getMoodsByDay(teamId, priorStart, priorEnd),
    getRoutineCompletionByDay(teamId, rangeStart, rangeEnd),
    getRoutineCompletionByDay(teamId, priorStart, priorEnd),
    getBurdenScores(teamId, rangeStart, rangeEnd),
    getBurdenScores(teamId, priorStart, priorEnd),
    prisma.note.count({
      where: {
        teamId,
        createdAt: { gte: rangeStart, lte: rangeEnd },
      },
    }),
  ]);

  const medicationAdherence = await computeMedicationAdherence(
    teamId,
    rangeStart,
    rangeEnd,
  );
  const totals = {
    tasksCompleted: tasksInRange.reduce(
      (s, d) => s + Number(d.completed ?? 0),
      0,
    ),
    tasksOverdue: tasksInRange.reduce((s, d) => s + Number(d.overdue ?? 0), 0),
    tasksDueSoon: tasksInRange.reduce((s, d) => s + Number(d.dueSoon ?? 0), 0),
    medicationAdherencePercent: medicationAdherence?.percent ?? null,
    routineCompletionPercent: aggregateRoutineCompletion(
      routineInstancesInRange,
    ),
    burdenLastScore:
      burdenInRange.length > 0
        ? burdenInRange[burdenInRange.length - 1].score
        : null,
    burdenDelta:
      burdenInRange.length >= 1 && burdenInPrior.length >= 1
        ? burdenInRange[burdenInRange.length - 1].score -
          burdenInPrior[burdenInPrior.length - 1].score
        : null,
    notesCreated: notesCountInRange,
  };

  const highlights = buildHighlights({
    rangeDays,
    tasksInRange,
    tasksInPrior,
    medicationAdherence,
    moodsInRange,
    moodsInPrior,
    routineInRange: routineInstancesInRange,
    routineInPrior: routineInstancesInPrior,
    burdenInRange,
    burdenInPrior,
    totals,
  });

  const series = {
    tasks: tasksInRange,
    medications: medicationAdherence?.byDay ?? undefined,
    mood: moodsInRange,
    routine: routineInstancesInRange,
    burden: burdenInRange.length > 0 ? burdenInRange : undefined,
  };

  return {
    rangeDays,
    series,
    totals,
    highlights,
  };
}

async function getTaskCountsByDay(
  teamId: string,
  from: Date,
  to: Date,
): Promise<SeriesPoint[]> {
  const tasks = await prisma.task.findMany({
    where: {
      teamId,
      isPersonal: false,
      OR: [
        { dueDate: { gte: from, lte: to } },
        { status: "DONE", updatedAt: { gte: from, lte: to } },
      ],
    },
    select: {
      dueDate: true,
      status: true,
      type: true,
      updatedAt: true,
    },
  });

  const byDate = new Map<
    string,
    { completed: number; overdue: number; dueSoon: number }
  >();
  let cursor = new Date(from);
  while (cursor <= to) {
    const d = format(cursor, "yyyy-MM-dd");
    byDate.set(d, { completed: 0, overdue: 0, dueSoon: 0 });
    cursor = subDays(cursor, -1);
  }

  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  for (const t of tasks) {
    if (t.status === "DONE" && t.updatedAt) {
      const d = format(new Date(t.updatedAt), "yyyy-MM-dd");
      if (byDate.has(d)) {
        byDate.get(d)!.completed += 1;
      }
    }
    if (t.status !== "DONE" && t.dueDate) {
      const due = new Date(t.dueDate);
      const d = format(due, "yyyy-MM-dd");
      if (byDate.has(d)) {
        if (isBefore(due, todayStart)) byDate.get(d)!.overdue += 1;
        else if (due >= todayStart && due <= todayEnd)
          byDate.get(d)!.dueSoon += 1;
      }
    }
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      completed: v.completed,
      overdue: v.overdue,
      dueSoon: v.dueSoon,
    }));
}

async function getMoodsByDay(
  teamId: string,
  from: Date,
  to: Date,
): Promise<SeriesPoint[]> {
  const moods = await prisma.mood.findMany({
    where: {
      teamId,
      observedAt: { gte: from, lte: to },
    },
    select: { rating: true, observedAt: true },
  });

  const byDate = new Map<
    string,
    { positive: number; low: number; agitated: number; total: number }
  >();
  let cursor = new Date(from);
  while (cursor <= to) {
    const d = format(cursor, "yyyy-MM-dd");
    byDate.set(d, { positive: 0, low: 0, agitated: 0, total: 0 });
    cursor = subDays(cursor, -1);
  }

  for (const m of moods) {
    const d = format(new Date(m.observedAt), "yyyy-MM-dd");
    if (!byDate.has(d)) continue;
    const b = moodBucket(m.rating as MoodRating);
    const row = byDate.get(d)!;
    row[b] += 1;
    row.total += 1;
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      positive: v.positive,
      low: v.low,
      agitated: v.agitated,
      total: v.total,
    }));
}

async function getRoutineCompletionByDay(
  teamId: string,
  from: Date,
  to: Date,
): Promise<SeriesPoint[]> {
  const instances = await prisma.routineInstance.findMany({
    where: {
      routine: { teamId },
      entryDate: { gte: from, lte: to },
    },
    select: { entryDate: true, answers: true },
  });

  const routines = await prisma.routine.findMany({
    where: { teamId, isActive: true },
    select: { id: true },
  });
  const expectedPerDay = routines.length;

  const byDate = new Map<string, { completed: number; total: number }>();
  let cursor = new Date(from);
  while (cursor <= to) {
    const d = format(cursor, "yyyy-MM-dd");
    byDate.set(d, { completed: 0, total: expectedPerDay });
    cursor = subDays(cursor, -1);
  }

  for (const i of instances) {
    const d = format(new Date(i.entryDate), "yyyy-MM-dd");
    if (!byDate.has(d)) continue;
    const row = byDate.get(d)!;
    const answered =
      i.answers && typeof i.answers === "object"
        ? Object.keys(i.answers as object).length
        : 0;
    row.completed += answered > 0 ? 1 : 0;
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      completed: v.completed,
      total: v.total,
      percent: v.total > 0 ? Math.round((v.completed / v.total) * 100) : 0,
    }));
}

async function getBurdenScores(
  teamId: string,
  from: Date,
  to: Date,
): Promise<{ date: string; score: number }[]> {
  const scales = await prisma.caregiverBurdenScale.findMany({
    where: { teamId, createdAt: { gte: from, lte: to } },
    select: { totalScore: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return scales.map((s) => ({
    date: format(new Date(s.createdAt), "yyyy-MM-dd"),
    score: s.totalScore,
  }));
}

async function computeMedicationAdherence(
  teamId: string,
  from: Date,
  to: Date,
): Promise<{ percent: number; byDay: SeriesPoint[] } | null> {
  const medTasks = await prisma.task.findMany({
    where: {
      teamId,
      type: "MEDICATION",
      isPersonal: false,
      dueDate: { gte: from, lte: to },
    },
    select: { dueDate: true, status: true, updatedAt: true },
  });

  if (medTasks.length === 0) return null;

  let completed = 0;
  const byDate = new Map<string, { completed: number; total: number }>();
  let cursor = new Date(from);
  while (cursor <= to) {
    const d = format(cursor, "yyyy-MM-dd");
    byDate.set(d, { completed: 0, total: 0 });
    cursor = subDays(cursor, -1);
  }

  for (const t of medTasks) {
    const d = format(new Date(t.dueDate!), "yyyy-MM-dd");
    if (!byDate.has(d)) continue;
    byDate.get(d)!.total += 1;
    if (t.status === "DONE") {
      byDate.get(d)!.completed += 1;
      completed += 1;
    }
  }

  const byDay = Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      completed: v.completed,
      total: v.total,
      percent: v.total > 0 ? Math.round((v.completed / v.total) * 100) : 0,
    }));

  const percent = Math.round((completed / medTasks.length) * 100);
  return { percent, byDay };
}

function aggregateRoutineCompletion(
  routineByDay: SeriesPoint[],
): number | null {
  let totalExpected = 0;
  let totalCompleted = 0;
  for (const r of routineByDay) {
    const t = (r.total as number) ?? 0;
    const c = (r.completed as number) ?? 0;
    totalExpected += t;
    totalCompleted += c;
  }
  if (totalExpected === 0) return null;
  return Math.round((totalCompleted / totalExpected) * 100);
}

interface HighlightInputs {
  rangeDays: number;
  tasksInRange: SeriesPoint[];
  tasksInPrior: SeriesPoint[];
  medicationAdherence: { percent: number; byDay: SeriesPoint[] } | null;
  moodsInRange: SeriesPoint[];
  moodsInPrior: SeriesPoint[];
  routineInRange: SeriesPoint[];
  routineInPrior: SeriesPoint[];
  burdenInRange: { date: string; score: number }[];
  burdenInPrior: { date: string; score: number }[];
  totals: SnapshotData["totals"];
}

function buildHighlights(inputs: HighlightInputs): SnapshotHighlight[] {
  const highlights: SnapshotHighlight[] = [];
  const {
    tasksInRange,
    tasksInPrior,
    medicationAdherence,
    moodsInRange,
    moodsInPrior,
    routineInRange,
    routineInPrior,
    burdenInRange,
    burdenInPrior,
  } = inputs;

  const overdueNow = tasksInRange.reduce(
    (s, d) => s + ((d.overdue as number) ?? 0),
    0,
  );
  const overduePrior = tasksInPrior.reduce(
    (s, d) => s + ((d.overdue as number) ?? 0),
    0,
  );
  if (overduePrior > 0 && overdueNow >= overduePrior * 1.3) {
    highlights.push({
      severity: "warn",
      title: "Task overdue spike",
      detail: `Overdue tasks increased by 30%+ vs prior period (${overduePrior} → ${overdueNow}).`,
      chartAnchor: "tasks",
      relatedLink: "/dashboard/tasks",
    });
  }

  if (medicationAdherence !== null) {
    if (medicationAdherence.percent < 60) {
      highlights.push({
        severity: "critical",
        title: "Medication adherence low",
        detail: `Adherence in period: ${medicationAdherence.percent}% (below 60%).`,
        chartAnchor: "medications",
        relatedLink: "/dashboard/medications",
      });
    } else if (medicationAdherence.percent < 75) {
      highlights.push({
        severity: "warn",
        title: "Medication adherence drop",
        detail: `Adherence in period: ${medicationAdherence.percent}% (below 75%).`,
        chartAnchor: "medications",
        relatedLink: "/dashboard/medications",
      });
    }
  }

  const agitatedShareNow = moodAgitatedShare(moodsInRange);
  const agitatedSharePrior = moodAgitatedShare(moodsInPrior);
  if (
    agitatedSharePrior !== null &&
    agitatedShareNow !== null &&
    agitatedShareNow >= agitatedSharePrior + 15
  ) {
    highlights.push({
      severity: "warn",
      title: "Mood shift",
      detail: `Agitated mood share increased by 15+ percentage points vs prior period.`,
      chartAnchor: "mood",
      relatedLink: "/dashboard",
    });
  }

  const routineRateNow = routineCompletionRate(routineInRange);
  const routineRatePrior = routineCompletionRate(routineInPrior);
  if (
    routineRatePrior !== null &&
    routineRateNow !== null &&
    routineRateNow <= routineRatePrior - 20
  ) {
    highlights.push({
      severity: "warn",
      title: "Routine completion dip",
      detail: `Completion rate dropped 20%+ vs prior period.`,
      chartAnchor: "routine",
      relatedLink: "/dashboard/routines",
    });
  }

  if (burdenInRange.length >= 1 && burdenInPrior.length >= 1) {
    const delta =
      burdenInRange[burdenInRange.length - 1].score -
      burdenInPrior[burdenInPrior.length - 1].score;
    if (delta >= 10) {
      highlights.push({
        severity: "critical",
        title: "Burden score jump",
        detail: `ZBI score increased by ${delta} points vs prior period.`,
        chartAnchor: "burden",
        relatedLink: "/dashboard/caregiver-burden",
      });
    }
  }

  return highlights;
}

function moodAgitatedShare(series: SeriesPoint[]): number | null {
  let total = 0;
  let agitated = 0;
  for (const s of series) {
    const t = (s.total as number) ?? 0;
    const a = (s.agitated as number) ?? 0;
    total += t;
    agitated += a;
  }
  if (total === 0) return null;
  return Math.round((agitated / total) * 100);
}

function routineCompletionRate(series: SeriesPoint[]): number | null {
  let total = 0;
  let completed = 0;
  for (const s of series) {
    total += (s.total as number) ?? 0;
    completed += (s.completed as number) ?? 0;
  }
  if (total === 0) return null;
  return Math.round((completed / total) * 100);
}

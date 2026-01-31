"use client";

import * as React from "react";
import { useTeamStore } from "@/store/use-team-store";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import { format } from "date-fns";
import {
  Compass,
  ChevronDown,
  ChevronRight,
  Save,
  Plus,
  AlertTriangle,
  Info,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Pill,
  Repeat,
  Scale,
  FileText,
  BarChart3,
  ClipboardList,
  Clock,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface SnapshotData {
  rangeDays: number;
  series: {
    tasks?: {
      date: string;
      completed?: number;
      overdue?: number;
      dueSoon?: number;
    }[];
    medications?: {
      date: string;
      completed?: number;
      total?: number;
      percent?: number;
    }[];
    mood?: {
      date: string;
      positive?: number;
      low?: number;
      agitated?: number;
      total?: number;
    }[];
    routine?: {
      date: string;
      completed?: number;
      total?: number;
      percent?: number;
    }[];
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
  highlights: {
    severity: "info" | "warn" | "critical";
    title: string;
    detail: string;
    relatedLink?: string;
    chartAnchor?: string;
  }[];
}

interface JourneySection {
  id: string;
  key: string;
  title: string;
  content: Record<string, unknown>;
  version: number;
  updatedAt: string;
  updatedBy: { id: string; name: string; imageUrl?: string | null } | null;
}

interface JourneyEntry {
  id: string;
  type: string;
  title: string;
  content: Record<string, unknown> | { text?: string };
  authorId: string | null;
  author: { id: string; name: string; imageUrl?: string | null } | null;
  linkedEntityType: string | null;
  linkedEntityId: string | null;
  occurredAt: string;
  createdAt: string;
}

/** Section content is empty if it's {} or only has empty "text" (or no meaningful keys). */
function sectionHasContent(
  content: Record<string, unknown> | null | undefined,
): boolean {
  if (!content || typeof content !== "object") return false;
  const keys = Object.keys(content);
  if (keys.length === 0) return false;
  if (keys.length === 1 && keys[0] === "text") {
    const t = content.text;
    return typeof t === "string" && t.trim().length > 0;
  }
  return keys.some((k) => {
    const v = content[k];
    if (v == null) return false;
    if (typeof v === "string") return v.trim().length > 0;
    if (typeof v === "object" && v !== null) return Object.keys(v).length > 0;
    return true;
  });
}

const ENTRY_TYPE_LABELS: Record<string, string> = {
  UPDATE: "Update",
  MILESTONE: "Milestone",
  MED_CHANGE: "Med change",
  APPOINTMENT: "Appointment",
  BEHAVIOR: "Behavior",
  SAFETY: "Safety",
  MOOD_EVENT: "Mood",
  ROUTINE_EVENT: "Routine",
  TASK_EVENT: "Task",
  BURDEN_EVENT: "Burden",
  NOTE_EVENT: "Note",
};

export default function PatientJourneyPage() {
  const router = useRouter();
  const { activeTeam } = useTeamStore();
  const [loading, setLoading] = React.useState(true);
  const [accessDenied, setAccessDenied] = React.useState(false);
  const [canEdit, setCanEdit] = React.useState(false);
  const [journey, setJourney] = React.useState<{
    id: string;
    title: string;
    patientDisplayName: string | null;
    sections: JourneySection[];
    snapshots: { rangeDays: number; computedAt: string; data: SnapshotData }[];
  } | null>(null);
  const [entries, setEntries] = React.useState<{
    items: JourneyEntry[];
    nextCursor: string | null;
    hasMore: boolean;
  }>({ items: [], nextCursor: null, hasMore: false });
  const [rangeDays, setRangeDays] = React.useState<7 | 30>(7);
  const [entryFilter, setEntryFilter] = React.useState<string>("all");
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [addEntryOpen, setAddEntryOpen] = React.useState(false);
  const [savingSection, setSavingSection] = React.useState<string | null>(null);
  const [activeNav, setActiveNav] = React.useState<
    "overview" | "care-plan" | "timeline"
  >("overview");
  const chartRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const overviewRef = React.useRef<HTMLDivElement | null>(null);
  const carePlanSectionRef = React.useRef<HTMLDivElement | null>(null);
  const timelineRef = React.useRef<HTMLDivElement | null>(null);

  const scrollToSection = (section: "overview" | "care-plan" | "timeline") => {
    setActiveNav(section);
    const el =
      section === "overview"
        ? overviewRef.current
        : section === "care-plan"
          ? carePlanSectionRef.current
          : timelineRef.current;
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Update active nav when user scrolls (scroll spy)
  React.useEffect(() => {
    const container = document.querySelector("[data-patient-journey-scroll]");
    if (!container) return;
    const refs = [
      { key: "overview" as const, ref: overviewRef.current },
      { key: "care-plan" as const, ref: carePlanSectionRef.current },
      { key: "timeline" as const, ref: timelineRef.current },
    ].filter((r) => r.ref);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const key = refs.find((r) => r.ref === entry.target)?.key;
          if (key) setActiveNav(key);
        }
      },
      { root: container, rootMargin: "-20% 0px -60% 0px", threshold: 0 },
    );
    refs.forEach(({ ref }) => ref && observer.observe(ref));
    return () => observer.disconnect();
  }, [journey]);

  const hasCarePlanMetadata = React.useMemo(() => {
    if (!journey?.sections?.length) return false;
    return journey.sections.some((s) => sectionHasContent(s.content));
  }, [journey?.sections]);

  const emptySectionCount = React.useMemo(() => {
    if (!journey?.sections?.length) return 0;
    return journey.sections.filter((s) => !sectionHasContent(s.content)).length;
  }, [journey?.sections]);

  const fetchJourney = React.useCallback(
    async (entriesCursor?: string) => {
      if (!activeTeam) return;
      try {
        if (!entriesCursor) setLoading(true);
        else setLoadingMore(true);
        const url = entriesCursor
          ? `/api/teams/${activeTeam.id}/journey?entriesCursor=${encodeURIComponent(entriesCursor)}&limit=20`
          : `/api/teams/${activeTeam.id}/journey`;
        const res = await fetch(url);
        if (res.status === 403) {
          setAccessDenied(true);
          setLoading(false);
          return;
        }
        if (!res.ok) throw new Error("Failed to load Patient Journey");
        const data = await res.json();
        if (!entriesCursor) {
          setJourney(data.journey);
          setEntries(data.entries);
          const accessRes = await fetch(
            `/api/teams/${activeTeam.id}/journey/access`,
          );
          if (accessRes.ok) {
            const accessData = await accessRes.json();
            setCanEdit(accessData.canEdit ?? false);
          }
        } else {
          setEntries((prev) => ({
            ...data.entries,
            items: [...prev.items, ...(data.entries.items || [])],
          }));
        }
      } catch (e) {
        console.error(e);
        toast.error("Failed to load Patient Journey");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeTeam],
  );

  React.useEffect(() => {
    fetchJourney();
  }, [fetchJourney]);

  const scrollToChart = (anchor?: string) => {
    if (anchor && chartRefs.current[anchor]) {
      chartRefs.current[anchor]?.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (!activeTeam) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-8">
          <p className="text-muted-foreground">No team selected</p>
        </Card>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-8 max-w-md">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-center mb-2">
            Access restricted
          </h2>
          <p className="text-muted-foreground text-center text-sm mb-4">
            Patient Journey is only available to Admins and Physicians.
          </p>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Back to dashboard
          </Button>
        </Card>
      </div>
    );
  }

  if (loading && !journey) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Spinner className="mx-auto mb-4 text-primary" size="lg" />
          <p className="text-muted-foreground">Loading Patient Journey...</p>
        </div>
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-8">
          <p className="text-muted-foreground">
            Unable to load Patient Journey
          </p>
          <Button variant="outline" onClick={() => fetchJourney()}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  const snapshot = journey.snapshots.find((s) => s.rangeDays === rangeDays);
  const data = snapshot?.data as SnapshotData | undefined;
  const filteredEntries =
    entryFilter === "all"
      ? entries.items
      : entries.items.filter((e) => e.type === entryFilter);

  const carePlanFilled = journey.sections.filter((s) =>
    sectionHasContent(s.content),
  ).length;
  const carePlanTotal = journey.sections.length;
  const carePlanProgress =
    carePlanTotal > 0 ? Math.round((carePlanFilled / carePlanTotal) * 100) : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden w-full">
      {/* Sticky header: title + section nav + export */}
      <div className="shrink-0 border-b bg-background w-full sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold truncate flex items-center gap-2">
                <Compass className="h-8 w-8 text-muted-foreground" />
                Patient Journey
              </h1>
              <p className="text-sm text-muted-foreground truncate mt-0.5">
                {journey.patientDisplayName ||
                  activeTeam.patientName ||
                  activeTeam.name}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={async () => {
                try {
                  const res = await fetch(
                    `/api/teams/${activeTeam.id}/journey/export?rangeDays=30`,
                  );
                  if (!res.ok) throw new Error("Export failed");
                  const blob = await res.blob();
                  const disposition = res.headers.get("Content-Disposition");
                  const filename =
                    disposition?.match(/filename="([^"]+)"/)?.[1] ??
                    `patient-journey-30d-${new Date().toISOString().slice(0, 10)}.json`;
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = filename;
                  a.click();
                  URL.revokeObjectURL(a.href);
                  toast.success("Journey exported");
                } catch (e) {
                  toast.error("Failed to export");
                }
              }}
            >
              <Download className="h-4 w-4 mr-1.5" />
              Export
            </Button>
          </div>
          {/* Section nav */}
          <nav className="flex flex-wrap items-center gap-1 rounded-lg border bg-muted/30 p-1">
            <Button
              variant={activeNav === "overview" ? "secondary" : "ghost"}
              size="sm"
              className="gap-1.5"
              onClick={() => scrollToSection("overview")}
            >
              <BarChart3 className="h-4 w-4" />
              Overview
            </Button>
            <Button
              variant={activeNav === "care-plan" ? "secondary" : "ghost"}
              size="sm"
              className="gap-1.5"
              onClick={() => scrollToSection("care-plan")}
            >
              <ClipboardList className="h-4 w-4" />
              Care plan
              {carePlanTotal > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-0.5 h-5 px-1.5 text-[10px]"
                >
                  {carePlanFilled}/{carePlanTotal}
                </Badge>
              )}
            </Button>
            <Button
              variant={activeNav === "timeline" ? "secondary" : "ghost"}
              size="sm"
              className="gap-1.5"
              onClick={() => scrollToSection("timeline")}
            >
              <Clock className="h-4 w-4" />
              Timeline
              {entries.items.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-0.5 h-5 px-1.5 text-[10px]"
                >
                  {entries.items.length}
                </Badge>
              )}
            </Button>
          </nav>
        </div>
      </div>

      <div
        className="flex-1 overflow-auto p-4 space-y-8 max-w-5xl mx-auto w-full"
        data-patient-journey-scroll
      >
        {/* Overview: time range + stats + highlights + charts */}
        <section id="overview" ref={overviewRef} className="scroll-mt-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              Overview
            </h2>
            <div className="flex rounded-lg border p-1 bg-muted/20">
              <Button
                variant={rangeDays === 7 ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setRangeDays(7)}
              >
                7 days
              </Button>
              <Button
                variant={rangeDays === 30 ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setRangeDays(30)}
              >
                30 days
              </Button>
            </div>
          </div>

          {data && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
                <Card className="overflow-hidden">
                  <CardContent className="p-3 flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Completed</p>
                      <p className="text-xl font-bold tabular-nums">
                        {data.totals.tasksCompleted}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card
                  className={
                    data.totals.tasksOverdue > 0
                      ? "overflow-hidden border-destructive/50 bg-destructive/5"
                      : "overflow-hidden"
                  }
                >
                  <CardContent className="p-3 flex items-start gap-3">
                    <div
                      className={
                        data.totals.tasksOverdue > 0
                          ? "rounded-lg bg-destructive/20 p-2"
                          : "rounded-lg bg-muted p-2"
                      }
                    >
                      <AlertCircle
                        className={
                          data.totals.tasksOverdue > 0
                            ? "h-4 w-4 text-destructive"
                            : "h-4 w-4 text-muted-foreground"
                        }
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Overdue</p>
                      <p className="text-xl font-bold tabular-nums">
                        {data.totals.tasksOverdue}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="overflow-hidden">
                  <CardContent className="p-3 flex items-start gap-3">
                    <div className="rounded-lg bg-muted p-2">
                      <Pill className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        Med adherence
                      </p>
                      <p className="text-xl font-bold tabular-nums">
                        {data.totals.medicationAdherencePercent != null
                          ? `${data.totals.medicationAdherencePercent}%`
                          : "—"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="overflow-hidden">
                  <CardContent className="p-3 flex items-start gap-3">
                    <div className="rounded-lg bg-muted p-2">
                      <Repeat className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Routine %</p>
                      <p className="text-xl font-bold tabular-nums">
                        {data.totals.routineCompletionPercent != null
                          ? `${data.totals.routineCompletionPercent}%`
                          : "—"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="overflow-hidden">
                  <CardContent className="p-3 flex items-start gap-3">
                    <div className="rounded-lg bg-muted p-2">
                      <Scale className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        Burden score
                      </p>
                      <p className="text-xl font-bold tabular-nums">
                        {data.totals.burdenLastScore ?? "—"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="overflow-hidden">
                  <CardContent className="p-3 flex items-start gap-3">
                    <div className="rounded-lg bg-muted p-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Notes</p>
                      <p className="text-xl font-bold tabular-nums">
                        {data.totals.notesCreated}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {data.highlights && data.highlights.length > 0 && (
                <Card className="mb-4 border-l-4 border-l-amber-500">
                  <CardHeader className="py-3">
                    <span className="text-sm font-medium">Highlights</span>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2">
                      {data.highlights.slice(0, 5).map((h, i) => (
                        <li key={i}>
                          <button
                            type="button"
                            className={`text-left w-full rounded px-3 py-2 text-sm flex items-start gap-2 ${
                              h.severity === "critical"
                                ? "bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200"
                                : h.severity === "warn"
                                  ? "bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200"
                                  : "bg-muted/50"
                            }`}
                            onClick={() => scrollToChart(h.chartAnchor)}
                          >
                            {h.severity === "critical" ? (
                              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            ) : h.severity === "warn" ? (
                              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                            ) : (
                              <Info className="h-4 w-4 shrink-0 mt-0.5" />
                            )}
                            <span>
                              <strong>{h.title}</strong> — {h.detail}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Charts */}
              {data.series?.tasks && data.series.tasks.length > 0 && (
                <div
                  ref={(el) => {
                    chartRefs.current["tasks"] = el;
                  }}
                  className="mb-6"
                >
                  <Card>
                    <CardHeader className="py-3">
                      <span className="text-sm font-medium">
                        Tasks: Completed vs Overdue
                      </span>
                    </CardHeader>
                    <CardContent className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.series.tasks}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="completed"
                            stackId="1"
                            stroke="hsl(var(--chart-2))"
                            fill="hsl(var(--chart-2))"
                            name="Completed"
                          />
                          <Area
                            type="monotone"
                            dataKey="overdue"
                            stackId="1"
                            stroke="hsl(var(--destructive))"
                            fill="hsl(var(--destructive))"
                            name="Overdue"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              )}

              {data.series?.medications &&
                data.series.medications.length > 0 && (
                  <div
                    ref={(el) => {
                      chartRefs.current["medications"] = el;
                    }}
                    className="mb-6"
                  >
                    <Card>
                      <CardHeader className="py-3">
                        <span className="text-sm font-medium">
                          Medication adherence %
                        </span>
                      </CardHeader>
                      <CardContent className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={data.series.medications}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Line
                              type="monotone"
                              dataKey="percent"
                              stroke="hsl(var(--primary))"
                              name="Adherence %"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                )}

              {data.series?.mood && data.series.mood.length > 0 && (
                <div
                  ref={(el) => {
                    chartRefs.current["mood"] = el;
                  }}
                  className="mb-6"
                >
                  <Card>
                    <CardHeader className="py-3">
                      <span className="text-sm font-medium">
                        Mood distribution
                      </span>
                    </CardHeader>
                    <CardContent className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={data.series.mood}
                          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Legend />
                          <Bar
                            dataKey="positive"
                            stackId="a"
                            fill="hsl(var(--chart-1))"
                            name="Positive"
                          />
                          <Bar
                            dataKey="low"
                            stackId="a"
                            fill="hsl(var(--chart-2))"
                            name="Low"
                          />
                          <Bar
                            dataKey="agitated"
                            stackId="a"
                            fill="hsl(var(--destructive))"
                            name="Agitated"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              )}

              {data.series?.routine && data.series.routine.length > 0 && (
                <div
                  ref={(el) => {
                    chartRefs.current["routine"] = el;
                  }}
                  className="mb-6"
                >
                  <Card>
                    <CardHeader className="py-3">
                      <span className="text-sm font-medium">
                        Routine completion %
                      </span>
                    </CardHeader>
                    <CardContent className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.series.routine}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="percent"
                            stroke="hsl(var(--chart-3))"
                            name="Completion %"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              )}

              {data.series?.burden && data.series.burden.length > 0 && (
                <div
                  ref={(el) => {
                    chartRefs.current["burden"] = el;
                  }}
                  className="mb-6"
                >
                  <Card>
                    <CardHeader className="py-3">
                      <span className="text-sm font-medium">
                        Burden scale (ZBI)
                      </span>
                    </CardHeader>
                    <CardContent className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.series.burden}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="score"
                            stroke="hsl(var(--chart-4))"
                            name="Score"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}

          {!data && (
            <Card className="p-8 text-center text-muted-foreground">
              <p>
                No snapshot data for {rangeDays} days. It will be computed on
                next load.
              </p>
            </Card>
          )}
        </section>

        {/* Care plan sections */}
        <section
          id="care-plan"
          ref={carePlanSectionRef}
          className="scroll-mt-4"
        >
          <div className="flex items-center justify-between gap-4 mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-muted-foreground" />
              Care plan
            </h2>
            {carePlanTotal > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Progress value={carePlanProgress} className="h-2 w-24" />
                <span className="tabular-nums">
                  {carePlanFilled} of {carePlanTotal} sections
                </span>
              </div>
            )}
          </div>
          {(!hasCarePlanMetadata || emptySectionCount > 0) && (
            <Card className="mb-4 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-900 dark:text-amber-100">
                      {!hasCarePlanMetadata
                        ? "Add care plan details"
                        : `${emptySectionCount} section${emptySectionCount === 1 ? "" : "s"} still empty`}
                    </p>
                    <p className="text-sm text-amber-800 dark:text-amber-200 mt-0.5">
                      {!hasCarePlanMetadata
                        ? "Basics, safety, goals, medications, and other sections help the care team stay aligned. Add content to each section below."
                        : "Fill in the empty sections below so the care plan is complete."}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100 shrink-0"
                  onClick={() => {
                    carePlanSectionRef.current?.scrollIntoView({
                      behavior: "smooth",
                    });
                  }}
                >
                  {canEdit ? "Add details below" : "View sections"}
                </Button>
              </CardContent>
            </Card>
          )}
          <div className="space-y-2">
            {journey.sections.map((section) => (
              <SectionCard
                key={section.id}
                section={section}
                canEdit={canEdit}
                teamId={activeTeam.id}
                onSaved={() => fetchJourney()}
                savingSection={savingSection}
                setSavingSection={setSavingSection}
              />
            ))}
          </div>
        </section>

        {/* Timeline */}
        <section id="timeline" ref={timelineRef} className="scroll-mt-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Timeline
            </h2>
            {canEdit && (
              <Button size="sm" onClick={() => setAddEntryOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" />
                Add entry
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Filter by type to focus on updates, milestones, or events.
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge
              variant={entryFilter === "all" ? "default" : "outline"}
              className="cursor-pointer py-1.5 px-3 text-xs font-medium"
              onClick={() => setEntryFilter("all")}
            >
              All
            </Badge>
            {Object.entries(ENTRY_TYPE_LABELS).map(([type, label]) => (
              <Badge
                key={type}
                variant={entryFilter === type ? "default" : "outline"}
                className="cursor-pointer py-1.5 px-3 text-xs font-medium"
                onClick={() => setEntryFilter(type)}
              >
                {label}
              </Badge>
            ))}
          </div>
          <ul className="space-y-0">
            {filteredEntries.map((entry) => (
              <li
                key={entry.id}
                className="timeline-item relative flex gap-3 pb-3 last:pb-0 last:[&_.timeline-connector]:hidden"
              >
                {/* Timeline dot + connector line */}
                <div className="flex flex-col items-center shrink-0 pt-1">
                  <div
                    className={
                      !entry.authorId
                        ? "h-3 w-3 rounded-full border-2 border-muted-foreground/50 bg-muted"
                        : "h-3 w-3 rounded-full border-2 border-primary bg-background"
                    }
                  />
                  <div className="timeline-connector w-px flex-1 min-h-8 bg-border mt-1" />
                </div>
                <Card
                  className={
                    "flex-1 min-w-0 " +
                    (!entry.authorId
                      ? "border-l-2 border-l-muted-foreground/50"
                      : "")
                  }
                >
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-normal"
                      >
                        {ENTRY_TYPE_LABELS[entry.type] ?? entry.type}
                      </Badge>
                      <span className="font-medium">{entry.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground sm:ml-auto flex-wrap">
                      {entry.author ? (
                        <span className="flex items-center gap-1.5">
                          <UserAvatar
                            src={entry.author.imageUrl ?? undefined}
                            alt={entry.author.name || "Author"}
                            fallback={(entry.author.name || "?")
                              .split(/\s+/)
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                            className="h-5 w-5"
                          />
                          {entry.author.name}
                        </span>
                      ) : (
                        <span className="text-xs">(system)</span>
                      )}
                      <span className="text-xs tabular-nums">
                        {format(
                          new Date(entry.occurredAt),
                          "MMM d, yyyy · h:mm a",
                        )}
                      </span>
                    </div>
                    {entry.linkedEntityId && (
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto text-xs w-full sm:w-auto"
                        asChild
                      >
                        <a
                          href={`/dashboard/tasks?task=${entry.linkedEntityId}`}
                        >
                          View source →
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
          {entries.hasMore && entries.nextCursor && (
            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                onClick={() => fetchJourney(entries.nextCursor ?? undefined)}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Load more
              </Button>
            </div>
          )}
        </section>
      </div>

      {/* Add entry modal */}
      <AddEntryModal
        open={addEntryOpen}
        onOpenChange={setAddEntryOpen}
        teamId={activeTeam.id}
        onAdded={() => {
          setAddEntryOpen(false);
          fetchJourney();
        }}
      />
    </div>
  );
}

function SectionCard({
  section,
  canEdit,
  teamId,
  onSaved,
  savingSection,
  setSavingSection,
}: {
  section: JourneySection;
  canEdit: boolean;
  teamId: string;
  onSaved: () => void;
  savingSection: string | null;
  setSavingSection: (id: string | null) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [contentText, setContentText] = React.useState(
    typeof section.content === "object" &&
      section.content &&
      "text" in section.content
      ? String((section.content as { text?: string }).text ?? "")
      : JSON.stringify(section.content, null, 2),
  );

  const handleSave = async () => {
    setSavingSection(section.id);
    try {
      const res = await fetch(
        `/api/teams/${teamId}/journey/sections/${section.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: { text: contentText } }),
        },
      );
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Section saved");
      onSaved();
    } catch (e) {
      toast.error("Failed to save section");
    } finally {
      setSavingSection(null);
    }
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <div className="flex items-center gap-2">
              {open ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="font-medium">{section.title}</span>
            </div>
            <span className="text-xs text-muted-foreground flex items-center gap-2">
              {section.updatedBy && (
                <>
                  <UserAvatar
                    src={section.updatedBy.imageUrl ?? undefined}
                    alt={section.updatedBy.name || "User"}
                    fallback={(section.updatedBy.name || "?")
                      .split(/\s+/)
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                    className="h-5 w-5"
                  />
                  <span>
                    Last updated by {section.updatedBy.name} on{" "}
                    {format(new Date(section.updatedAt), "MMM d, yyyy")}
                  </span>
                </>
              )}
              {!section.updatedBy && (
                <span>
                  Last updated on{" "}
                  {format(new Date(section.updatedAt), "MMM d, yyyy")}
                </span>
              )}
            </span>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4">
            {canEdit ? (
              <div className="space-y-2">
                <Label>Content</Label>
                <textarea
                  className="min-h-[120px] w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={contentText}
                  onChange={(e) => setContentText(e.target.value)}
                />
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={savingSection === section.id}
                >
                  {savingSection === section.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save
                </Button>
              </div>
            ) : (
              <pre className="text-sm whitespace-pre-wrap text-muted-foreground">
                {contentText || "No content yet."}
              </pre>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function AddEntryModal({
  open,
  onOpenChange,
  teamId,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  onAdded: () => void;
}) {
  const [type, setType] = React.useState("UPDATE");
  const [title, setTitle] = React.useState("");
  const [detail, setDetail] = React.useState("");
  const [occurredAt, setOccurredAt] = React.useState(
    format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  );
  const [saving, setSaving] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/journey/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: title.trim(),
          content: detail.trim() || undefined,
          occurredAt: new Date(occurredAt).toISOString(),
        }),
      });
      if (!res.ok) throw new Error("Failed to create entry");
      toast.success("Entry added");
      setTitle("");
      setDetail("");
      setOccurredAt(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
      onAdded();
    } catch (e) {
      toast.error("Failed to add entry");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add timeline entry</DialogTitle>
          <DialogDescription>
            Add a manual entry to the Patient Journey timeline.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ENTRY_TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short title"
              required
            />
          </div>
          <div>
            <Label>Details (optional)</Label>
            <textarea
              className="min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Additional details"
            />
          </div>
          <div>
            <Label>Occurred at</Label>
            <Input
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Add entry
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

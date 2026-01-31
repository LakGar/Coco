"use client";

import * as React from "react";
import { useTeamStore } from "@/store/use-team-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { format } from "date-fns";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  AlertCircle,
  Pill,
  Users,
  History,
  Calendar,
  TrendingUp,
  ListTodo,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface InsightsData {
  tasksCompletedToday: number;
  tasksCompletedThisWeek: number;
  tasksDueToday: number;
  tasksOverdue: number;
  tasksDueNext7Days: {
    id: string;
    name: string;
    dueDate: string | null;
    type: string | null;
  }[];
  tasksByType: Record<string, number>;
  medicationsTotal: number;
  medicationsDoneThisWeek: number;
  medicationsAdherencePercent: number | null;
  recentAuditCount: number;
  memberCount: number;
}

const TYPE_LABELS: Record<string, string> = {
  MEDICATION: "Medications",
  APPOINTMENTS: "Appointments",
  SOCIAL: "Social",
  HEALTH_PERSONAL: "Health & personal",
  OTHER: "Other",
};

export default function InsightsPage() {
  const { activeTeam } = useTeamStore();
  const [data, setData] = React.useState<InsightsData | null>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchInsights = React.useCallback(async () => {
    if (!activeTeam) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/teams/${activeTeam.id}/insights`);
      if (!res.ok) throw new Error("Failed to load insights");
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load insights");
    } finally {
      setLoading(false);
    }
  }, [activeTeam]);

  React.useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  if (!activeTeam) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-8">
          <p className="text-muted-foreground">No team selected</p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Spinner className="mx-auto mb-4 text-primary" size="lg" />
          <p className="text-muted-foreground">Loading insights...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-8">
          <p className="text-muted-foreground">Unable to load insights</p>
          <Button className="mt-4" variant="outline" onClick={fetchInsights}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  const typeEntries = Object.entries(data.tasksByType).filter(
    ([_, count]) => count > 0,
  );

  return (
    <div className="flex flex-col h-full overflow-hidden w-full">
      <div className="shrink-0 border-b bg-background w-full sticky top-0 z-50">
        <div className="px-4 py-4">
          <h1 className="text-2xl md:text-3xl font-bold truncate flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-muted-foreground" />
            Insights
          </h1>
          <p className="text-sm text-muted-foreground truncate mt-1">
            Data for {activeTeam.patientName || activeTeam.name}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Completed today
                </span>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{data.tasksCompletedToday}</p>
                <p className="text-xs text-muted-foreground mt-1">tasks done</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Due today
                </span>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{data.tasksDueToday}</p>
                <p className="text-xs text-muted-foreground mt-1">remaining</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Overdue
                </span>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{data.tasksOverdue}</p>
                <p className="text-xs text-muted-foreground mt-1">tasks</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  This week
                </span>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {data.tasksCompletedThisWeek}
                </p>
                <p className="text-xs text-muted-foreground mt-1">completed</p>
              </CardContent>
            </Card>
          </div>

          {/* Medications & activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Pill className="h-4 w-4" />
                  Medications
                </span>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{data.medicationsTotal}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Total tracked · {data.medicationsDoneThisWeek} completed this
                  week
                </p>
                {data.medicationsAdherencePercent != null && (
                  <p className="text-sm font-medium mt-2">
                    Adherence: {data.medicationsAdherencePercent}%
                  </p>
                )}
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <Link href="/dashboard/medications">View medications</Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Team & activity
                </span>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{data.memberCount}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  team members
                </p>
                <p className="text-sm text-muted-foreground">
                  {data.recentAuditCount} audit events
                </p>
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <Link href="/dashboard/audit">View audit trail</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Tasks by type */}
          {typeEntries.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <ListTodo className="h-4 w-4" />
                  Open tasks by type
                </span>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {typeEntries.map(([type, count]) => (
                    <li
                      key={type}
                      className="flex justify-between items-center text-sm"
                    >
                      <span>{TYPE_LABELS[type] ?? type}</span>
                      <span className="font-medium">{count}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Upcoming (next 7 days) */}
          {data.tasksDueNext7Days.length > 0 && (
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Upcoming (next 7 days)
                </span>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/tasks">View all tasks</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {data.tasksDueNext7Days.map((t) => (
                    <li
                      key={t.id}
                      className="flex justify-between items-center text-sm gap-2"
                    >
                      <span className="truncate">{t.name}</span>
                      <span className="text-muted-foreground shrink-0">
                        {t.dueDate
                          ? format(new Date(t.dueDate), "MMM d, h:mm a")
                          : "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

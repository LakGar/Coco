"use client";

import * as React from "react";
import { useTeamStore } from "@/store/use-team-store";
import { useDataStore, type Task } from "@/store/use-data-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pill,
  Plus,
  Calendar,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { getTaskTypeColor } from "@/lib/task-types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { PermissionGuard } from "@/components/permission-guard";
import { TaskForm } from "@/components/task-form";

// Build list of due dates for recurring medications
function buildRecurringDueDates(
  startDate: Date,
  recurring: "none" | "daily" | "weekly",
  repeatCount: number,
): Date[] {
  if (recurring === "none" || repeatCount < 1) {
    return [startDate];
  }
  const dates: Date[] = [new Date(startDate)];
  for (let i = 1; i < repeatCount; i++) {
    const next = new Date(startDate);
    if (recurring === "daily") {
      next.setDate(next.getDate() + i);
    } else {
      next.setDate(next.getDate() + 7 * i);
    }
    dates.push(next);
  }
  return dates;
}

interface MedicationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  patientName: string | null;
  teamMembers: Array<{
    id: string;
    name: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    imageUrl?: string | null;
  }>;
  onSuccess: () => void;
}

function MedicationForm({
  open,
  onOpenChange,
  teamId,
  patientName,
  teamMembers,
  onSuccess,
}: MedicationFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    priority: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
    assignedToId: "",
    dueDate: "",
    dueTime: "",
    recurring: "none" as "none" | "daily" | "weekly",
    repeatCount: 7,
  });

  React.useEffect(() => {
    if (open) {
      setFormData({
        name: "",
        description: "",
        priority: "MEDIUM",
        assignedToId: "",
        dueDate: "",
        dueTime: "",
        recurring: "none",
        repeatCount: 7,
      });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const startDate = formData.dueDate
        ? formData.dueTime
          ? new Date(`${formData.dueDate}T${formData.dueTime}`)
          : new Date(`${formData.dueDate}T00:00:00`)
        : null;
      if (!startDate) {
        toast.error("Please set at least a due date.");
        setLoading(false);
        return;
      }
      const dueDates = buildRecurringDueDates(
        startDate,
        formData.recurring,
        formData.repeatCount,
      );
      const payloadBase = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        patientName: patientName?.trim() || null,
        assignedToId: formData.assignedToId || null,
        priority: formData.priority,
        status: "TODO" as const,
        type: "MEDICATION" as const,
        isPersonal: false,
      };
      let created = 0;
      for (const d of dueDates) {
        const res = await fetch(`/api/teams/${teamId}/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payloadBase,
            dueDate: d.toISOString(),
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(
            err.error || err.message || "Failed to create medication",
          );
        }
        created++;
      }
      toast.success(
        created === 1
          ? "Medication added"
          : `${created} medication tasks created`,
      );
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to add medication",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg flex flex-col h-full p-0">
        <SheetHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
          <SheetTitle>Add Medication</SheetTitle>
          <SheetDescription>
            Add a medication for the current patient. You can make it recurring
            to create multiple tasks.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <FieldGroup>
              <Field>
                <FieldLabel>
                  Medication name <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="e.g. Morning pills"
                    required
                  />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>Description (optional)</FieldLabel>
                <FieldContent>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Dosage, notes..."
                    className="min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>Priority</FieldLabel>
                <FieldContent>
                  <Select
                    value={formData.priority}
                    onValueChange={(v: "LOW" | "MEDIUM" | "HIGH" | "URGENT") =>
                      setFormData((p) => ({ ...p, priority: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>Assign to (optional)</FieldLabel>
                <FieldContent>
                  <Select
                    value={formData.assignedToId || "unassigned"}
                    onValueChange={(v) =>
                      setFormData((p) => ({
                        ...p,
                        assignedToId: v === "unassigned" ? "" : v,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {teamMembers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>
                    First due date <span className="text-destructive">*</span>
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, dueDate: e.target.value }))
                      }
                      required
                    />
                  </FieldContent>
                </Field>
                <Field>
                  <FieldLabel>Time (optional)</FieldLabel>
                  <FieldContent>
                    <Input
                      type="time"
                      value={formData.dueTime}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, dueTime: e.target.value }))
                      }
                    />
                  </FieldContent>
                </Field>
              </div>
              <Field>
                <FieldLabel>Repeat</FieldLabel>
                <FieldContent>
                  <Select
                    value={formData.recurring}
                    onValueChange={(v: "none" | "daily" | "weekly") =>
                      setFormData((p) => ({ ...p, recurring: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        No repeat (single task)
                      </SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
              {(formData.recurring === "daily" ||
                formData.recurring === "weekly") && (
                <Field>
                  <FieldLabel>Create how many tasks?</FieldLabel>
                  <FieldContent>
                    <Input
                      type="number"
                      min={1}
                      max={365}
                      value={formData.repeatCount}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          repeatCount: Math.max(
                            1,
                            Math.min(365, parseInt(e.target.value, 10) || 1),
                          ),
                        }))
                      }
                    />
                  </FieldContent>
                </Field>
              )}
            </FieldGroup>
          </div>
          <SheetFooter className="px-6 py-4 border-t shrink-0 bg-background">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Medication"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export default function MedicationsPage() {
  const { activeTeam } = useTeamStore();
  const {
    tasks: tasksFromStore,
    teamData: teamDataFromStore,
    fetchTasks,
    fetchTeamData,
    updateTask,
    removeTask,
    loading,
    errors,
  } = useDataStore();
  const [formOpen, setFormOpen] = React.useState(false);
  const [editTask, setEditTask] = React.useState<Task | null>(null);
  const [taskFormOpen, setTaskFormOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [taskToDelete, setTaskToDelete] = React.useState<Task | null>(null);

  React.useEffect(() => {
    if (!activeTeam) return;
    const load = async () => {
      try {
        await Promise.all([
          fetchTasks(activeTeam.id),
          fetchTeamData(activeTeam.id),
        ]);
      } catch (e) {
        console.error("Error loading medications/team:", e);
      }
    };
    load();
  }, [activeTeam?.id, fetchTasks, fetchTeamData]);

  const tasks = React.useMemo(() => {
    if (!activeTeam) return [];
    const stored = tasksFromStore[activeTeam.id];
    return Array.isArray(stored) ? stored : [];
  }, [tasksFromStore, activeTeam]);

  const medications = React.useMemo(
    () => tasks.filter((t) => t.type === "MEDICATION" && !t.isPersonal),
    [tasks],
  );

  const teamData = React.useMemo(() => {
    if (!activeTeam) return null;
    return teamDataFromStore[activeTeam.id] || null;
  }, [teamDataFromStore, activeTeam]);

  const isLoading = React.useMemo(() => {
    if (!activeTeam) return false;
    const hasData =
      tasksFromStore[activeTeam.id] !== undefined ||
      teamDataFromStore[activeTeam.id] !== undefined;
    if (hasData) return false;
    return (
      loading[`tasks-${activeTeam.id}`] || loading[`teamData-${activeTeam.id}`]
    );
  }, [loading, activeTeam, tasksFromStore, teamDataFromStore]);

  const error = React.useMemo(() => {
    if (!activeTeam) return "No active team selected";
    return (
      errors[`tasks-${activeTeam.id}`] ||
      errors[`teamData-${activeTeam.id}`] ||
      null
    );
  }, [errors, activeTeam]);

  const canCreate =
    teamData?.currentUser.isAdmin ??
    teamData?.currentUser.canCreateTasks ??
    false;

  const getInitials = (
    name: string | null,
    firstName: string | null,
    lastName: string | null,
    email: string,
  ) => {
    if (name)
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    if (firstName || lastName)
      return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
    return email[0].toUpperCase();
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "URGENT":
        return "bg-red-500/10 text-red-700 dark:text-red-400";
      case "HIGH":
        return "bg-orange-500/10 text-orange-700 dark:text-orange-400";
      case "MEDIUM":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
      case "LOW":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DONE":
        return <CheckCircle2 className="h-4 w-4" />;
      case "CANCELLED":
        return <XCircle className="h-4 w-4" />;
      case "DUE":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleEdit = (task: Task) => {
    setEditTask(task);
    setTaskFormOpen(true);
  };

  const handleDeleteClick = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!activeTeam || !taskToDelete) return;
    const taskId = taskToDelete.id;
    removeTask(activeTeam.id, taskId);
    try {
      const res = await fetch(`/api/teams/${activeTeam.id}/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Medication task deleted");
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
      await fetchTasks(activeTeam.id, true);
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete medication");
      await fetchTasks(activeTeam.id, true);
    }
  };

  const handleFormSuccess = async () => {
    if (activeTeam) await fetchTasks(activeTeam.id, true);
    setTaskFormOpen(false);
    setEditTask(null);
  };

  const handleCheckboxChange = async (task: Task, checked: boolean) => {
    if (!activeTeam || !canCreate) return;
    const newStatus = checked ? "DONE" : "TODO";
    updateTask(activeTeam.id, task.id, { status: newStatus });
    try {
      const res = await fetch(`/api/teams/${activeTeam.id}/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      await fetchTasks(activeTeam.id, true);
    } catch (e) {
      console.error(e);
      toast.error("Failed to update medication");
      await fetchTasks(activeTeam.id, true);
    }
  };

  const renderMedicationItem = (task: Task) => {
    const isDone = task.status === "DONE";
    return (
      <li key={task.id}>
        <Card
          className="group hover:shadow-md transition-all cursor-pointer"
          onClick={() => handleEdit(task)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div
                className="shrink-0 pt-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={(e) => handleCheckboxChange(task, e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Pill
                    className={`h-4 w-4 shrink-0 ${getTaskTypeColor("MEDICATION")}`}
                  />
                  <h3
                    className={`font-semibold text-sm ${isDone ? "line-through text-muted-foreground" : ""}`}
                  >
                    {task.name}
                  </h3>
                  <Badge
                    variant="outline"
                    className={`text-xs ${getPriorityColor(task.priority)}`}
                  >
                    {task.priority}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {getStatusIcon(task.status)}
                    <span className="ml-1">{task.status}</span>
                  </Badge>
                </div>
                {task.description && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {task.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {task.dueDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(task.dueDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: task.dueDate ? "numeric" : undefined,
                        minute: task.dueDate ? "2-digit" : undefined,
                      })}
                    </span>
                  )}
                  {task.assignedTo && (
                    <span className="flex items-center gap-1">
                      <Avatar className="h-4 w-4">
                        <AvatarImage
                          src={task.assignedTo.imageUrl || undefined}
                        />
                        <AvatarFallback className="text-[8px]">
                          {getInitials(
                            task.assignedTo.name,
                            task.assignedTo.firstName,
                            task.assignedTo.lastName,
                            task.assignedTo.email,
                          )}
                        </AvatarFallback>
                      </Avatar>
                      {task.assignedTo.name || task.assignedTo.email}
                    </span>
                  )}
                </div>
              </div>
              {canCreate && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                  onClick={(e) => handleDeleteClick(task, e)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </li>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Spinner className="mx-auto mb-4 text-primary" size="lg" />
          <p className="text-muted-foreground">Loading medications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-muted-foreground">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <PermissionGuard permission="canViewTasks">
      <div className="flex flex-col h-full overflow-hidden w-full">
        <div className="shrink-0 border-b bg-background w-full sticky top-0 z-50">
          <div className="px-4 py-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl md:text-3xl font-bold truncate flex items-center gap-2">
                  <Pill className="h-8 w-8 text-blue-500" />
                  Medications
                </h1>
                <p className="text-sm text-muted-foreground truncate">
                  {activeTeam?.patientName ? (
                    <>For {activeTeam.patientName}</>
                  ) : (
                    "Current patient"
                  )}
                  {" · "}
                  {medications.length}{" "}
                  {medications.length === 1 ? "medication" : "medications"}
                </p>
              </div>
              {canCreate && (
                <Button
                  onClick={() => setFormOpen(true)}
                  size="default"
                  className="h-10 px-4"
                >
                  <Plus className="md:mr-2 h-4 w-4" />
                  <span className="hidden md:inline">Add Medication</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {medications.length === 0 ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <Card className="p-12 text-center max-w-md">
                <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No medications yet
                </h3>
                <p className="text-muted-foreground mb-4">
                  Add medications for{" "}
                  {activeTeam?.patientName || "the current patient"}.
                </p>
                {canCreate && (
                  <Button onClick={() => setFormOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Medication
                  </Button>
                )}
              </Card>
            </div>
          ) : (
            <ul className="space-y-2 w-full">
              {medications.map(renderMedicationItem)}
            </ul>
          )}
        </div>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete medication task</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{taskToDelete?.name}"? This
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setTaskToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <MedicationForm
          open={formOpen}
          onOpenChange={setFormOpen}
          teamId={activeTeam!.id}
          patientName={activeTeam?.patientName ?? null}
          teamMembers={teamData?.members ?? []}
          onSuccess={handleFormSuccess}
        />

        {activeTeam && editTask && (
          <TaskFormWrapper
            open={taskFormOpen}
            onOpenChange={(open) => {
              setTaskFormOpen(open);
              if (!open) setEditTask(null);
            }}
            task={editTask}
            teamId={activeTeam.id}
            patientName={activeTeam.patientName ?? null}
            teamMembers={teamData?.members ?? []}
            onSuccess={handleFormSuccess}
            onDelete={async (taskId) => {
              try {
                const res = await fetch(
                  `/api/teams/${activeTeam.id}/tasks/${taskId}`,
                  { method: "DELETE" },
                );
                if (!res.ok) throw new Error("Failed to delete");
                toast.success("Medication task deleted");
                setTaskFormOpen(false);
                setEditTask(null);
                handleFormSuccess();
              } catch (e) {
                toast.error("Failed to delete task");
              }
            }}
          />
        )}
      </div>
    </PermissionGuard>
  );
}

// Re-use existing TaskForm for editing (no changes to task implementation)
function TaskFormWrapper({
  open,
  onOpenChange,
  task,
  teamId,
  patientName,
  teamMembers,
  onSuccess,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
  teamId: string;
  patientName: string | null;
  teamMembers: Array<{ id: string; name: string; email: string }>;
  onSuccess: () => void;
  onDelete?: (taskId: string) => void;
}) {
  const taskForForm = React.useMemo(
    () => ({
      id: task.id,
      name: task.name,
      description: task.description ?? undefined,
      patientName: task.patientName ?? undefined,
      assignedToId: task.assignedTo?.id ?? undefined,
      priority: task.priority,
      status: task.status,
      type: task.type ?? undefined,
      isPersonal: task.isPersonal ?? false,
      dueDate: task.dueDate ?? undefined,
    }),
    [task],
  );
  return (
    <TaskForm
      open={open}
      onOpenChange={onOpenChange}
      task={taskForForm}
      teamId={teamId}
      patientName={patientName}
      teamMembers={teamMembers}
      onSuccess={onSuccess}
      onDelete={onDelete}
    />
  );
}

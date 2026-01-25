"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTeamStore } from "@/store/use-team-store";
import {
  useDataStore,
  type Routine,
  type TeamData,
} from "@/store/use-data-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { RoutineForm } from "@/components/routine-form";
import { NightlyJournalModal } from "@/components/nightly-journal-modal";
import {
  Plus,
  Search,
  Repeat,
  BookOpen,
  PenTool,
  Calendar,
  X,
  XCircle,
  Check,
  X as XIcon,
} from "lucide-react";
import { RoutineCircularChart } from "@/components/routine-circular-chart";
import { toast } from "sonner";
import { PermissionGuard } from "@/components/permission-guard";

export default function RoutinesPage() {
  const { activeTeam } = useTeamStore();
  const {
    routines: routinesFromStore,
    teamData: teamDataFromStore,
    fetchRoutines,
    fetchTeamData,
    addRoutine,
    updateRoutine,
    removeRoutine,
    loading,
    errors,
  } = useDataStore();
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingRoutine, setEditingRoutine] = React.useState<Routine | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeFilter, setActiveFilter] = React.useState<
    "all" | "active" | "inactive"
  >("all");
  const [journalModalOpen, setJournalModalOpen] = React.useState(false);
  const [selectedRoutine, setSelectedRoutine] = React.useState<Routine | null>(
    null,
  );
  const [lastEntry, setLastEntry] = React.useState<any>(null);

  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = !shouldReduceMotion;

  // Fetch routines and team data on mount and when team changes
  React.useEffect(() => {
    if (!activeTeam) return;

    const loadData = async () => {
      try {
        await Promise.all([
          fetchRoutines(activeTeam.id),
          fetchTeamData(activeTeam.id),
        ]);
      } catch (error) {
        console.error("Error loading routines/team data:", error);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTeam?.id]); // Only depend on team ID, not the functions

  // Get routines and team data from store
  const routines = React.useMemo(() => {
    if (!activeTeam) return [];
    const storedRoutines = routinesFromStore[activeTeam.id];
    return Array.isArray(storedRoutines) ? storedRoutines : [];
  }, [routinesFromStore, activeTeam]);

  const teamData = React.useMemo(() => {
    if (!activeTeam) return null;
    return teamDataFromStore[activeTeam.id] || null;
  }, [teamDataFromStore, activeTeam]);

  // Get loading/error states - only show loading if actively fetching AND no data
  const isLoading = React.useMemo(() => {
    if (!activeTeam) return false;

    const hasAnyData =
      routinesFromStore[activeTeam.id] !== undefined ||
      teamDataFromStore[activeTeam.id] !== undefined;

    // If we have any data, don't show loading
    if (hasAnyData) {
      return false;
    }

    // Only show loading if we're actively fetching and have no data
    return (
      loading[`routines-${activeTeam.id}`] ||
      loading[`teamData-${activeTeam.id}`]
    );
  }, [loading, activeTeam, routinesFromStore, teamDataFromStore]);

  const error = React.useMemo(() => {
    if (!activeTeam) return "No active team selected";
    return (
      errors[`routines-${activeTeam.id}`] ||
      errors[`teamData-${activeTeam.id}`] ||
      null
    );
  }, [errors, activeTeam]);

  const handleFormSuccess = async () => {
    if (!activeTeam) return;
    await fetchRoutines(activeTeam.id, true); // Force refresh
  };

  const handleDeleteRoutine = async (routineId: string) => {
    if (!activeTeam) return;

    // Optimistic update
    removeRoutine(activeTeam.id, routineId);

    try {
      const response = await fetch(
        `/api/teams/${activeTeam.id}/routines/${routineId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete routine");
      }

      toast.success("Routine deleted successfully");
      await fetchRoutines(activeTeam.id, true); // Force refresh
    } catch (error) {
      console.error("Error deleting routine:", error);
      toast.error("Failed to delete routine");
      // Revert optimistic update on error
      await fetchRoutines(activeTeam.id, true);
    }
  };

  const handleCreateRoutine = () => {
    if (!canCreateRoutines) {
      toast.error(
        "You do not have permission to create routines. Please contact your team admin.",
      );
      return;
    }
    setEditingRoutine(null);
    setFormOpen(true);
  };

  const handleEditRoutine = (routine: Routine) => {
    setEditingRoutine(routine);
    setFormOpen(true);
  };

  // Check if today is a valid day for the routine
  const isTodayValidForRoutine = (routine: Routine): boolean => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
    return routine.recurrenceDaysOfWeek.includes(dayOfWeek);
  };

  const handleFillJournal = async (routine: Routine) => {
    if (!activeTeam) return;

    // Validate that today is a valid day for this routine
    if (!isTodayValidForRoutine(routine)) {
      const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const validDays = routine.recurrenceDaysOfWeek
        .sort()
        .map((d) => dayNames[d])
        .join(", ");
      const todayName = dayNames[new Date().getDay()];

      toast.error(
        `This routine is only for: ${validDays}. Today is ${todayName}, so you cannot fill this journal today.`,
        { duration: 5000 },
      );
      return;
    }

    try {
      const lastEntryResponse = await fetch(
        `/api/teams/${activeTeam.id}/routines/${routine.id}/instances?limit=1`,
      );
      if (lastEntryResponse.ok) {
        const lastEntryData = await lastEntryResponse.json();
        setLastEntry(lastEntryData.instances?.[0] || null);
      }
    } catch (error) {
      console.error("Error fetching last entry:", error);
      setLastEntry(null);
    }

    setSelectedRoutine(routine);
    setJournalModalOpen(true);
  };

  const handleSaveJournal = async (entry: {
    routineId: string;
    entryDate: string;
    answers?: Record<string, boolean>;
    notes?: string;
  }) => {
    if (!activeTeam) return;

    try {
      const response = await fetch(
        `/api/teams/${activeTeam.id}/routines/${entry.routineId}/instances`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entryDate: entry.entryDate,
            answers: entry.answers,
            notes: entry.notes,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to save journal entry");
      }

      toast.success("Journal entry saved!");
      setJournalModalOpen(false);
      await fetchRoutines(activeTeam.id, true); // Force refresh
    } catch (error) {
      console.error("Error saving journal entry:", error);
      throw error;
    }
  };

  const filteredRoutines = React.useMemo(() => {
    return routines.filter((routine) => {
      const matchesSearch =
        !searchQuery ||
        routine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        routine.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesActive =
        activeFilter === "all" ||
        (activeFilter === "active" && routine.isActive) ||
        (activeFilter === "inactive" && !routine.isActive);

      return matchesSearch && matchesActive;
    });
  }, [routines, searchQuery, activeFilter]);

  const canCreateRoutines =
    teamData?.currentUser.isAdmin ||
    (teamData?.currentUser.canCreateRoutines ?? false);

  // Check permission to view routines
  const canViewRoutines =
    (teamData?.currentUser.isAdmin || teamData?.currentUser.canViewRoutines) ??
    true;

  // Show error state with retry option (only if no data at all)
  if (error && routines.length === 0 && !isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <Card className="p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold mb-2">
            Failed to load routines
          </h2>
          <p className="text-muted-foreground mb-6">
            {error ||
              "An error occurred while loading routines. Please try again."}
          </p>
          <Button
            onClick={() => {
              if (activeTeam) {
                fetchRoutines(activeTeam.id, true);
                fetchTeamData(activeTeam.id, true);
              }
            }}
            variant="outline"
          >
            <Repeat className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  if (isLoading && routines.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Spinner className="mx-auto mb-4 text-primary" size="lg" />
          <p className="text-muted-foreground">Loading routines...</p>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard permission="canViewRoutines">
      <div className="flex flex-col h-full overflow-hidden w-full">
        {/* Header */}
        <div className="shrink-0 border-b bg-background w-full overflow-hidden sticky top-0 z-50">
          <div className="px-4 py-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl md:text-3xl font-bold truncate">
                  Daily Journal
                </h1>
                <p className="text-sm md:text-md text-muted-foreground truncate">
                  {filteredRoutines.length}{" "}
                  {filteredRoutines.length === 1 ? "routine" : "routines"}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {canCreateRoutines && (
                  <Button
                    onClick={handleCreateRoutine}
                    size="default"
                    className="h-10 px-4"
                  >
                    <Plus className="md:mr-2 h-4 w-4" />
                    <span className="hidden md:inline">Create Routine</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Error Banner - Show if there's an error but we have some data */}
            {error && routines.length > 0 && (
              <div className="mb-4 p-3 rounded-lg border border-destructive/50 bg-destructive/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <XCircle className="h-4 w-4 text-destructive shrink-0" />
                  <p className="text-sm text-destructive truncate">
                    {error}. Some data may be outdated.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (activeTeam) {
                      fetchRoutines(activeTeam.id, true);
                      fetchTeamData(activeTeam.id, true);
                    }
                  }}
                  className="shrink-0"
                >
                  <Repeat className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              </div>
            )}

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search routines..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-12 h-10"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant={activeFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveFilter("all")}
                  className="h-10 flex-1 sm:flex-initial"
                >
                  All
                </Button>
                <Button
                  variant={activeFilter === "active" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveFilter("active")}
                  className="h-10 flex-1 sm:flex-initial"
                >
                  Active
                </Button>
                <Button
                  variant={activeFilter === "inactive" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveFilter("inactive")}
                  className="h-10 flex-1 sm:flex-initial"
                >
                  Inactive
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {filteredRoutines.length === 0 ? (
            <motion.div
              initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4 }}
              className="flex items-center justify-center h-full p-4"
            >
              <Card className="p-12 text-center max-w-full">
                <motion.div
                  initial={shouldAnimate ? { scale: 0.8 } : false}
                  animate={shouldAnimate ? { scale: 1 } : {}}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                </motion.div>
                <h3 className="text-xl font-semibold mb-2">
                  {routines.length === 0
                    ? "No routines yet"
                    : "No routines found"}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {routines.length === 0
                    ? "Create a daily journal routine to track daily activities and observations. Perfect for tracking meals, mood, activities, and more."
                    : "Try adjusting your search or filters to see more routines."}
                </p>
                {canCreateRoutines && (
                  <Button onClick={handleCreateRoutine} size="lg" className="">
                    <Plus className="mr-2 h-5 w-5" />
                    Create Your First Routine
                  </Button>
                )}
              </Card>
            </motion.div>
          ) : (
            <div className="h-full overflow-auto w-full p-4">
              <div className="space-y-4 w-full">
                {filteredRoutines.map((routine, index) => {
                  const insights = routine._count || { instances: 0 };
                  const lastEntry = routine.instances?.[0];

                  return (
                    <motion.div
                      key={routine.id}
                      initial={
                        shouldAnimate
                          ? { opacity: 0, y: 10, scale: 0.98 }
                          : false
                      }
                      animate={
                        shouldAnimate ? { opacity: 1, y: 0, scale: 1 } : {}
                      }
                      transition={{
                        duration: 0.3,
                        delay: index * 0.05,
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                      whileHover={shouldAnimate ? { y: -2, scale: 1.01 } : {}}
                    >
                      <Card className="group hover:border-border transition-all rounded-lg border border-border/50 bg-card/50">
                        <CardContent className="p-4 md:p-6">
                          <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">
                            {/* Left: Questions List */}
                            <div className="flex-1 min-w-0 space-y-4 w-full">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-lg md:text-xl font-semibold">
                                    {routine.name}
                                  </h3>
                                  {!routine.isActive && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      Inactive
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditRoutine(routine);
                                    }}
                                    className="h-9 px-3 flex-1 sm:flex-initial"
                                  >
                                    Edit
                                  </Button>
                                  {routine.isActive && (
                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleFillJournal(routine);
                                      }}
                                      disabled={
                                        !isTodayValidForRoutine(routine)
                                      }
                                      className="h-9 px-3 md:px-4 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-initial"
                                    >
                                      <PenTool className="h-3.5 w-3.5 mr-1.5" />
                                      <span className="hidden sm:inline">
                                        Fill Journal
                                      </span>
                                      <span className="sm:hidden">Fill</span>
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {/* Questions with Last Answers */}
                              <div className="space-y-2">
                                {routine.checklistItems.map(
                                  (question, qIndex) => {
                                    // Check if question was completed or skipped in last entry
                                    const wasCompleted =
                                      lastEntry?.completedItems?.includes(
                                        question,
                                      ) || false;
                                    const wasSkipped =
                                      lastEntry?.skippedItems?.includes(
                                        question,
                                      ) || false;
                                    const hasAnswer =
                                      wasCompleted || wasSkipped;
                                    const lastAnswer = wasCompleted
                                      ? true
                                      : wasSkipped
                                        ? false
                                        : undefined;

                                    return (
                                      <div
                                        key={qIndex}
                                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 p-2.5 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
                                      >
                                        <span className="text-sm flex-1">
                                          {question}
                                        </span>
                                        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                                          {hasAnswer ? (
                                            <>
                                              {lastAnswer ? (
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                  <Check className="h-4 w-4" />
                                                  <span className="text-xs font-medium">
                                                    Yes
                                                  </span>
                                                </div>
                                              ) : (
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                  <XIcon className="h-4 w-4" />
                                                  <span className="text-xs font-medium">
                                                    No
                                                  </span>
                                                </div>
                                              )}
                                              {lastEntry?.entryDate && (
                                                <span className="text-xs text-muted-foreground">
                                                  {new Date(
                                                    lastEntry.entryDate,
                                                  ).toLocaleDateString(
                                                    "en-US",
                                                    {
                                                      month: "short",
                                                      day: "numeric",
                                                    },
                                                  )}
                                                </span>
                                              )}
                                            </>
                                          ) : (
                                            <span className="text-xs text-muted-foreground">
                                              Not answered
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  },
                                )}
                              </div>
                            </div>

                            {/* Right: Circular Chart */}
                            <div className="shrink-0 flex flex-col items-center gap-2 w-full md:w-auto">
                              <RoutineCircularChart
                                recurrenceDaysOfWeek={
                                  routine.recurrenceDaysOfWeek
                                }
                                instances={routine.instances || []}
                              />
                              <p className="text-xs text-muted-foreground text-center max-w-[120px]">
                                {routine.recurrenceDaysOfWeek.length === 7
                                  ? "Every day"
                                  : routine.recurrenceDaysOfWeek.length === 5 &&
                                      routine.recurrenceDaysOfWeek.every((d) =>
                                        [1, 2, 3, 4, 5].includes(d),
                                      )
                                    ? "Weekdays"
                                    : routine.recurrenceDaysOfWeek.length ===
                                          2 &&
                                        routine.recurrenceDaysOfWeek.includes(
                                          0,
                                        ) &&
                                        routine.recurrenceDaysOfWeek.includes(6)
                                      ? "Weekends"
                                      : `${routine.recurrenceDaysOfWeek.length} days/week`}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Routine Form */}
        {activeTeam && (
          <RoutineForm
            open={formOpen}
            onOpenChange={setFormOpen}
            routine={editingRoutine as any}
            teamId={activeTeam.id}
            patientName={activeTeam.patientName || null}
            teamMembers={teamData?.members || []}
            onSuccess={handleFormSuccess}
            onDelete={handleDeleteRoutine}
          />
        )}

        {/* Journal Modal */}
        {selectedRoutine && (
          <NightlyJournalModal
            open={journalModalOpen}
            onOpenChange={setJournalModalOpen}
            routine={selectedRoutine}
            lastEntry={lastEntry}
            onSave={handleSaveJournal}
          />
        )}
      </div>
    </PermissionGuard>
  );
}

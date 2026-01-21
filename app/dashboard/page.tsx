"use client"

import * as React from "react"
import { useTeamStore } from "@/store/use-team-store"
import { useDataStore, type Task, type Routine, type Mood } from "@/store/use-data-store"
import { Spinner } from "@/components/ui/spinner"
import { Card, CardContent } from "@/components/ui/card"
import { MoodCard } from "@/components/mood-card"
import { TodaySummaryCard } from "@/components/today-summary-card"
import { TasksPreview } from "@/components/tasks-preview"
import { InsightsPreview } from "@/components/insights-preview"
import { RecentActivity } from "@/components/recent-activity"
import { WelcomeHeader } from "@/components/welcome-header"
import { NotesPreview } from "@/components/notes-preview"
import { CarePlanPreview } from "@/components/care-plan-preview"
import { RoutinesPreview } from "@/components/routines-preview"
import { UpcomingTasksPreview } from "@/components/upcoming-tasks-preview"
import { TaskForm } from "@/components/task-form"
import { NightlyJournalModal } from "@/components/nightly-journal-modal"
import { format, isToday, isPast, startOfDay } from "date-fns"
import { useRouter } from "next/navigation"
import { XCircle, Repeat } from "lucide-react"
import { Button } from "@/components/ui/button"

// Types are now imported from use-data-store

export default function DashboardPage() {
  const { activeTeam } = useTeamStore()
  const router = useRouter()
  
  // Use Zustand store for data
  const {
    tasks: allTasksFromStore,
    routines: routinesFromStore,
    moods: moodsFromStore,
    fetchTasks,
    fetchRoutines,
    fetchMoods,
    updateTask,
    loading,
    errors,
  } = useDataStore()

  // Get data for current team
  const allTasks = React.useMemo(() => {
    return activeTeam ? (allTasksFromStore[activeTeam.id] || []) : []
  }, [allTasksFromStore, activeTeam])

  const routines = React.useMemo(() => {
    return activeTeam ? (routinesFromStore[activeTeam.id] || []) : []
  }, [routinesFromStore, activeTeam])

  const moods = React.useMemo(() => {
    return activeTeam ? (moodsFromStore[activeTeam.id] || []) : []
  }, [moodsFromStore, activeTeam])

  const latestMood = React.useMemo(() => {
    return moods.length > 0 ? moods[0] : null
  }, [moods])

  // Filter tasks for today + overdue
  const tasks = React.useMemo(() => {
    const today = startOfDay(new Date())
    return allTasks.filter((task: Task) => {
      if (task.status === "DONE" || task.status === "CANCELLED") return false
      if (!task.dueDate) return false
      const dueDate = new Date(task.dueDate)
      return isToday(dueDate) || isPast(dueDate)
    })
  }, [allTasks])

  // UI state
  const [taskFormOpen, setTaskFormOpen] = React.useState(false)
  const [journalModalOpen, setJournalModalOpen] = React.useState(false)
  const [selectedRoutine, setSelectedRoutine] = React.useState<Routine | null>(null)
  const [lastJournalEntry, setLastJournalEntry] = React.useState<any>(null)

  // Fetch all data on mount and when team changes
  React.useEffect(() => {
    if (!activeTeam) return

    const loadData = async () => {
      await Promise.all([
        fetchTasks(activeTeam.id),
        fetchRoutines(activeTeam.id),
        fetchMoods(activeTeam.id),
      ])
    }

    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTeam?.id]) // Only depend on team ID, not the functions

  // Get loading/error states - only show loading if actively fetching AND no data
  const isLoading = React.useMemo(() => {
    if (!activeTeam) return false
    
    const hasAnyData = 
      (allTasksFromStore[activeTeam.id] !== undefined) ||
      (routinesFromStore[activeTeam.id] !== undefined) ||
      (moodsFromStore[activeTeam.id] !== undefined)
    
    // If we have any data, don't show loading
    if (hasAnyData) {
      return false
    }
    
    // Only show loading if we're actively fetching and have no data
    const isCurrentlyLoading = 
      loading[`tasks-${activeTeam.id}`] ||
      loading[`routines-${activeTeam.id}`] ||
      loading[`moods-${activeTeam.id}`]
    
    return isCurrentlyLoading
  }, [loading, activeTeam, allTasksFromStore, routinesFromStore, moodsFromStore])

  const error = React.useMemo(() => {
    if (!activeTeam) return null
    return (
      errors[`tasks-${activeTeam.id}`] ||
      errors[`routines-${activeTeam.id}`] ||
      errors[`moods-${activeTeam.id}`] ||
      null
    )
  }, [errors, activeTeam])

  // Handle errors gracefully - don't crash the page
  const hasErrors = error !== null
  const hasData = 
    (allTasksFromStore[activeTeam?.id || ""] !== undefined) ||
    (routinesFromStore[activeTeam?.id || ""] !== undefined) ||
    (moodsFromStore[activeTeam?.id || ""] !== undefined)

  // Calculate today's summary
  const today = new Date()
  const dayOfWeek = today.getDay()
  
  const routinesScheduled = React.useMemo(() => {
    if (!routines || routines.length === 0) return 0
    const count = routines.filter((r) => {
      if (!r.isActive) return false
      if (!r.recurrenceDaysOfWeek || !Array.isArray(r.recurrenceDaysOfWeek) || r.recurrenceDaysOfWeek.length === 0) return false
      return r.recurrenceDaysOfWeek.includes(dayOfWeek)
    }).length
    return count
  }, [routines, dayOfWeek])

  const tasksDue = React.useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) return 0
    return tasks.length
  }, [tasks])

  const journalFilled = React.useMemo(() => {
    if (!routines || routines.length === 0) return true
    
    const todayRoutines = routines.filter((r) => {
      if (!r.isActive) return false
      if (!r.recurrenceDaysOfWeek || !Array.isArray(r.recurrenceDaysOfWeek) || r.recurrenceDaysOfWeek.length === 0) return false
      return r.recurrenceDaysOfWeek.includes(dayOfWeek)
    })

    if (todayRoutines.length === 0) return true

    const todayStr = format(today, "yyyy-MM-dd")
    return todayRoutines.some((r) => {
      if (!r.instances || !Array.isArray(r.instances) || r.instances.length === 0) return false
      return r.instances.some((inst) => {
        if (!inst.entryDate) return false
        try {
          const entryDate = format(new Date(inst.entryDate), "yyyy-MM-dd")
          return entryDate === todayStr
        } catch (e) {
          return false
        }
      })
    })
  }, [routines, dayOfWeek, today])

  // Calculate routines stats
  const activeRoutinesCount = routines.filter((r) => r.isActive).length
  const completedRoutinesToday = React.useMemo(() => {
    const todayStr = format(today, "yyyy-MM-dd")
    return routines.filter((r) => {
      if (!r.isActive) return false
      if (!r.recurrenceDaysOfWeek.includes(dayOfWeek)) return false
      return r.instances?.some((inst) => {
        const entryDate = format(new Date(inst.entryDate), "yyyy-MM-dd")
        return entryDate === todayStr
      })
    }).length
  }, [routines, dayOfWeek, today])

  // Generate insights (simple rule-based for now)
  const insights = React.useMemo(() => {
    const insightsList: Array<{
      id: string
      type: "sleep" | "mood" | "routine" | "general"
      message: string
    }> = []

    // Mood insights - micro-payoff insights
    if (moods.length >= 2) {
      const recentMoods = moods.slice(0, 7)
      const today = new Date()
      const todayStr = format(today, "yyyy-MM-dd")
      
      // Check for today's mood
      const todayMood = recentMoods.find((m) => {
        const moodDate = format(new Date(m.observedAt), "yyyy-MM-dd")
        return moodDate === todayStr
      })

      // Positive moods
      const positiveMoods = recentMoods.filter(
        (m) => m.rating === "CALM" || m.rating === "CONTENT" || m.rating === "RELAXED"
      )
      
      // Low moods
      const lowMoods = recentMoods.filter(
        (m) => m.rating === "SAD" || m.rating === "WITHDRAWN" || m.rating === "TIRED"
      )
      
      // Agitated moods
      const agitatedMoods = recentMoods.filter(
        (m) => m.rating === "ANXIOUS" || m.rating === "IRRITABLE" || m.rating === "RESTLESS" || m.rating === "CONFUSED"
      )

      // Today-specific insights
      if (todayMood) {
        if (todayMood.rating === "CALM" || todayMood.rating === "CONTENT" || todayMood.rating === "RELAXED") {
          insightsList.push({
            id: "mood-today-positive",
            type: "mood",
            message: "No agitation logged today",
          })
        }
      }

      // Recent trend insights (past 2-3 days)
      if (recentMoods.length >= 2) {
        const lastTwo = recentMoods.slice(0, 2)
        const bothPositive = lastTwo.every(
          (m) => m.rating === "CALM" || m.rating === "CONTENT" || m.rating === "RELAXED"
        )
        const bothCalm = lastTwo.every((m) => m.rating === "CALM")

        if (bothCalm) {
          insightsList.push({
            id: "mood-calm-streak",
            type: "mood",
            message: "Mood has been calmer the past 2 days",
          })
        } else if (bothPositive) {
          insightsList.push({
            id: "mood-positive-streak",
            type: "mood",
            message: "Mood has been more positive recently",
          })
        }
      }

      // Week trend
      if (recentMoods.length >= 3) {
        if (agitatedMoods.length === 0 && positiveMoods.length >= 2) {
          insightsList.push({
            id: "mood-week-positive",
            type: "mood",
            message: "No agitation noted this week",
          })
        } else if (agitatedMoods.length > positiveMoods.length) {
          insightsList.push({
            id: "mood-week-agitated",
            type: "mood",
            message: "More agitation noted earlier this week",
          })
        }
      }
    }

    // Routine insights
    const activeRoutines = routines.filter((r) => r.isActive)
    if (activeRoutines.length > 0) {
      const lastWeekInstances = activeRoutines.flatMap((r) => {
        return (r.instances || []).filter((inst) => {
          const entryDate = new Date(inst.entryDate)
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          return entryDate >= weekAgo
        })
      })

      if (lastWeekInstances.length === 0) {
        insightsList.push({
          id: "routine-missing",
          type: "routine",
          message: "Routine entries have been inconsistent this week",
        })
      }
    }

    return insightsList
  }, [moods, routines])

  // Build recent activity
  const recentActivity = React.useMemo(() => {
    const activities: Array<{
      id: string
      type: "mood" | "task" | "routine" | "note"
      message: string
      author: {
        id: string
        name: string | null
        firstName: string | null
        lastName: string | null
        imageUrl: string | null
      }
      timestamp: string
    }> = []

    // Add recent moods
    moods.slice(0, 2).forEach((mood) => {
      const ratingLabels: Record<string, string> = {
        CALM: "calm",
        CONTENT: "content",
        NEUTRAL: "neutral",
        RELAXED: "relaxed",
        SAD: "sad",
        WITHDRAWN: "withdrawn",
        TIRED: "tired",
        ANXIOUS: "anxious",
        IRRITABLE: "irritable",
        RESTLESS: "restless",
        CONFUSED: "confused",
      }
      activities.push({
        id: `mood-${mood.id}`,
        type: "mood",
        message: `tracked mood as ${ratingLabels[mood.rating] || mood.rating.toLowerCase()}`,
        author: mood.loggedBy,
        timestamp: mood.observedAt,
      })
    })

    // Add recent tasks
    tasks.slice(0, 2).forEach((task) => {
      if (task.status === "DONE") {
        activities.push({
          id: `task-${task.id}`,
          type: "task",
          message: `completed "${task.name}"`,
          author: task.createdBy,
          timestamp: task.createdAt,
        })
      }
    })

    // Sort by timestamp (most recent first)
    activities.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })

    return activities.slice(0, 2)
  }, [moods, tasks])

  // Handle journal fill
  const handleFillJournal = () => {
    const todayRoutines = routines.filter((r) => {
      if (!r.isActive) return false
      return r.recurrenceDaysOfWeek.includes(dayOfWeek)
    })

    if (todayRoutines.length > 0) {
      const routine = todayRoutines[0]
      setSelectedRoutine(routine)

      // Find last entry for this routine
      const lastEntry = routine.instances?.[0] || null
      setLastJournalEntry(lastEntry)

      setJournalModalOpen(true)
    }
  }

  const handleJournalSave = async () => {
    // Refresh routines to get updated instances
    if (activeTeam) {
      await fetchRoutines(activeTeam.id, true) // Force refresh
    }
    setJournalModalOpen(false)
  }

  const handleMoodTracked = async () => {
    // Refresh moods
    if (activeTeam) {
      await fetchMoods(activeTeam.id, true) // Force refresh
    }
  }

  const handleTaskComplete = async (taskId: string) => {
    if (!activeTeam) return

    try {
      // Optimistic update
      updateTask(activeTeam.id, taskId, { status: "DONE" })

      const response = await fetch(`/api/teams/${activeTeam.id}/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "DONE" }),
      })

      if (!response.ok) {
        // Revert on error
        await fetchTasks(activeTeam.id, true)
        throw new Error("Failed to complete task")
      }
    } catch (error) {
      console.error("Error completing task:", error)
      // Refresh to get correct state
      if (activeTeam) {
        await fetchTasks(activeTeam.id, true)
      }
    }
  }

  if (!activeTeam) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Please select a team to view the dashboard</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show loading only if we have no data at all
  if (isLoading && !hasData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Spinner className="h-8 w-8 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Show error only if we have no data at all
  if (hasErrors && !hasData) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <Card className="p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Failed to load dashboard</h2>
          <p className="text-muted-foreground mb-6">
            {error || "An error occurred while loading data. Please try again."}
          </p>
          <Button
            onClick={() => {
              if (activeTeam) {
                fetchTasks(activeTeam.id, true)
                fetchRoutines(activeTeam.id, true)
                fetchMoods(activeTeam.id, true)
              }
            }}
            variant="outline"
          >
            <Repeat className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-auto w-full">
      <div className="flex-1 p-4 md:p-6 space-y-5 max-w-6xl mx-auto w-full">
        {/* Error Banner - Show if there's an error but we have some data */}
        {hasErrors && hasData && (
          <div className="p-3 rounded-lg border border-destructive/50 bg-destructive/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <XCircle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-sm text-destructive">
                {error}. Some data may be outdated.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (activeTeam) {
                  fetchTasks(activeTeam.id, true)
                  fetchRoutines(activeTeam.id, true)
                  fetchMoods(activeTeam.id, true)
                }
              }}
              className="shrink-0"
            >
              <Repeat className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        )}

        {/* Welcome Header with Quick Actions */}
        <WelcomeHeader
          teamName={activeTeam.name}
          onFillJournal={handleFillJournal}
          onAddTask={() => setTaskFormOpen(true)}
        />

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left Column */}
          <div className="space-y-5">
            {/* Mood Card */}
            <MoodCard
              teamId={activeTeam.id}
              latestMood={latestMood || undefined}
              onMoodTracked={handleMoodTracked}
            />

            {/* Today Summary */}
            <TodaySummaryCard
              routinesScheduled={routinesScheduled ?? 0}
              tasksDue={tasksDue ?? 0}
              journalFilled={journalFilled ?? false}
              onJournalClick={handleFillJournal}
            />

            {/* Routines Preview */}
            <RoutinesPreview
              routinesCount={activeRoutinesCount}
              completedToday={completedRoutinesToday}
              onViewRoutines={() => router.push("/dashboard/routines")}
            />

            {/* Insights Preview */}
            {insights.length > 0 && (
              <InsightsPreview insights={insights} />
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-5">
            {/* Tasks Preview */}
            <TasksPreview
              tasks={tasks}
              onCompleteTask={handleTaskComplete}
            />

            {/* Upcoming Tasks Preview */}
            <UpcomingTasksPreview
              tasks={allTasks}
            />

            {/* Notes Preview */}
            <NotesPreview />

            {/* Care Plan Preview */}
            <CarePlanPreview />

            {/* Recent Activity */}
            {recentActivity.length > 0 && (
              <RecentActivity activities={recentActivity} />
            )}
          </div>
        </div>
      </div>

      {/* Task Form Modal */}
      <TaskForm
        open={taskFormOpen}
        onOpenChange={setTaskFormOpen}
        teamId={activeTeam.id}
        onSuccess={() => {
          setTaskFormOpen(false)
          // Refresh tasks
          if (activeTeam) {
            fetchTasks(activeTeam.id, true) // Force refresh
          }
        }}
      />

      {/* Journal Modal */}
      {selectedRoutine && (
        <NightlyJournalModal
          open={journalModalOpen}
          onOpenChange={setJournalModalOpen}
          routine={selectedRoutine}
          lastEntry={lastJournalEntry}
          onSave={handleJournalSave}
        />
      )}
    </div>
  )
}

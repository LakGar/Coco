"use client"

import * as React from "react"
import { useTeamStore } from "@/store/use-team-store"
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

interface Task {
  id: string
  name: string
  dueDate?: string | null
  status: "TODO" | "DONE" | "CANCELLED" | "DUE"
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  createdAt: string
  createdBy: {
    id: string
    name: string | null
    firstName: string | null
    lastName: string | null
    imageUrl: string | null
  }
}

interface Routine {
  id: string
  name: string
  isActive: boolean
  recurrenceDaysOfWeek: number[]
  instances?: Array<{
    id: string
    entryDate: string
    answers?: Record<string, boolean>
    notes?: string | null
    filledOutAt?: string
  }>
}

interface Mood {
  id: string
  rating: "CALM" | "CONTENT" | "NEUTRAL" | "RELAXED" | "SAD" | "WITHDRAWN" | "TIRED" | "ANXIOUS" | "IRRITABLE" | "RESTLESS" | "CONFUSED"
  notes?: string | null
  observedAt: string
  loggedBy: {
    id: string
    name: string | null
    firstName: string | null
    lastName: string | null
    imageUrl: string | null
  }
}

export default function DashboardPage() {
  const { activeTeam } = useTeamStore()
  const router = useRouter()
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Data state
  const [tasks, setTasks] = React.useState<Task[]>([])
  const [allTasks, setAllTasks] = React.useState<Task[]>([])
  const [routines, setRoutines] = React.useState<Routine[]>([])
  const [moods, setMoods] = React.useState<Mood[]>([])
  const [latestMood, setLatestMood] = React.useState<Mood | null>(null)

  // UI state
  const [taskFormOpen, setTaskFormOpen] = React.useState(false)
  const [journalModalOpen, setJournalModalOpen] = React.useState(false)
  const [selectedRoutine, setSelectedRoutine] = React.useState<Routine | null>(null)
  const [lastJournalEntry, setLastJournalEntry] = React.useState<any>(null)

  // Fetch all data
  React.useEffect(() => {
    const fetchData = async () => {
      if (!activeTeam) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Fetch all tasks
        const tasksResponse = await fetch(`/api/teams/${activeTeam.id}/tasks`)
        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json()
          const fetchedTasks = tasksData.tasks || []
          setAllTasks(fetchedTasks)
          
          // Filter for today + overdue, not done
          const today = startOfDay(new Date())
          const todayTasks = fetchedTasks.filter((task: Task) => {
            if (task.status === "DONE" || task.status === "CANCELLED") return false
            if (!task.dueDate) return false
            const dueDate = new Date(task.dueDate)
            return isToday(dueDate) || isPast(dueDate)
          })
          
          setTasks(todayTasks)
        }

        // Fetch routines
        const routinesResponse = await fetch(`/api/teams/${activeTeam.id}/routines`)
        if (routinesResponse.ok) {
          const routinesData = await routinesResponse.json()
          setRoutines(routinesData.routines || [])
        }

        // Fetch moods
        const moodsResponse = await fetch(`/api/teams/${activeTeam.id}/moods`)
        if (moodsResponse.ok) {
          const moodsData = await moodsResponse.json()
          setMoods(moodsData)
          if (moodsData.length > 0) {
            setLatestMood(moodsData[0])
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        setError("Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [activeTeam])

  // Calculate today's summary
  const today = new Date()
  const dayOfWeek = today.getDay()
  
  const routinesScheduled = routines.filter((r) => {
    if (!r.isActive) return false
    return r.recurrenceDaysOfWeek.includes(dayOfWeek)
  }).length

  const tasksDue = tasks.length

  const journalFilled = React.useMemo(() => {
    const todayRoutines = routines.filter((r) => {
      if (!r.isActive) return false
      return r.recurrenceDaysOfWeek.includes(dayOfWeek)
    })

    if (todayRoutines.length === 0) return true

    const todayStr = format(today, "yyyy-MM-dd")
    return todayRoutines.some((r) => {
      return r.instances?.some((inst) => {
        const entryDate = format(new Date(inst.entryDate), "yyyy-MM-dd")
        return entryDate === todayStr
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

    // Mood insights
    if (moods.length >= 3) {
      const recentMoods = moods.slice(0, 7)
      const goodMoods = recentMoods.filter(
        (m) => m.rating === "GOOD" || m.rating === "VERY_GOOD"
      ).length
      const poorMoods = recentMoods.filter(
        (m) => m.rating === "VERY_POOR" || m.rating === "POOR"
      ).length

      if (poorMoods > goodMoods) {
        insightsList.push({
          id: "mood-trend",
          type: "mood",
          message: "Mood appears lower than usual this week",
        })
      } else if (goodMoods > poorMoods) {
        insightsList.push({
          id: "mood-positive",
          type: "mood",
          message: "Mood has been more positive recently",
        })
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
      const routinesResponse = await fetch(`/api/teams/${activeTeam.id}/routines`)
      if (routinesResponse.ok) {
        const routinesData = await routinesResponse.json()
        setRoutines(routinesData.routines || [])
      }
    }
    setJournalModalOpen(false)
  }

  const handleMoodTracked = async () => {
    // Refresh moods
    if (activeTeam) {
      const moodsResponse = await fetch(`/api/teams/${activeTeam.id}/moods`)
      if (moodsResponse.ok) {
        const moodsData = await moodsResponse.json()
        setMoods(moodsData)
        if (moodsData.length > 0) {
          setLatestMood(moodsData[0])
        }
      }
    }
  }

  const handleTaskComplete = async (taskId: string) => {
    if (!activeTeam) return

    try {
      const response = await fetch(`/api/teams/${activeTeam.id}/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "DONE" }),
      })

      if (response.ok) {
        // Optimistically update
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: "DONE" as const } : t))
        )
      }
    } catch (error) {
      console.error("Error completing task:", error)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-auto w-full">
      <div className="flex-1 p-4 md:p-6 space-y-5 max-w-6xl mx-auto w-full">
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
              routinesScheduled={routinesScheduled}
              tasksDue={tasksDue}
              journalFilled={journalFilled}
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
            fetch(`/api/teams/${activeTeam.id}/tasks`)
              .then((res) => res.json())
              .then((data) => {
                const allTasks = data.tasks || []
                const today = startOfDay(new Date())
                const todayTasks = allTasks.filter((task: Task) => {
                  if (task.status === "DONE" || task.status === "CANCELLED") return false
                  if (!task.dueDate) return false
                  const dueDate = new Date(task.dueDate)
                  return isToday(dueDate) || isPast(dueDate)
                })
                setTasks(todayTasks)
              })
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

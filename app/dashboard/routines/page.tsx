"use client"

import * as React from "react"
import { motion, useReducedMotion } from "framer-motion"
import { useTeamStore } from "@/store/use-team-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { RoutineForm } from "@/components/routine-form"
import { Plus, Search, Repeat, Calendar, Clock, TrendingUp, Flame, CheckCircle2, XCircle, X, Check, SkipForward, BookOpen, BarChart3, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Routine {
  id: string
  name: string
  description?: string | null
  patientName?: string | null
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  recurrenceType: "DAILY" | "WEEKLY" | "MONTHLY" | "CUSTOM_WEEKDAYS" | "SPECIFIC_DATES"
  recurrenceDaysOfWeek: number[]
  recurrenceDayOfMonth?: number | null
  recurrenceSpecificDates?: string[]
  startDate: string
  endDate?: string | null
  timeOfDay?: string | null
  autoGenerateTasks: boolean
  generateDaysAhead: number
  hasJournalEntry: boolean
  journalPrompts: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy: {
    id: string
    name: string | null
    firstName: string | null
    lastName: string | null
    email: string
    imageUrl: string | null
  }
  assignedTo?: {
    id: string
    name: string | null
    firstName: string | null
    lastName: string | null
    email: string
    imageUrl: string | null
  } | null
  instances?: Array<{
    id: string
    scheduledDate: string
    isCompleted: boolean
    completedAt?: string | null
    isSkipped: boolean
    journalData?: any
  }>
  _count?: {
    instances: number
    tasks: number
  }
}

interface TeamData {
  team: {
    id: string
    name: string
    patientId?: string | null
  }
  members: Array<{
    id: string
    name: string
    email: string
  }>
  currentUser: {
    id: string
    isAdmin: boolean
    accessLevel: string
  }
}

export default function RoutinesPage() {
  const { activeTeam } = useTeamStore()
  const [routines, setRoutines] = React.useState<Routine[]>([])
  const [teamData, setTeamData] = React.useState<TeamData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [formOpen, setFormOpen] = React.useState(false)
  const [editingRoutine, setEditingRoutine] = React.useState<Routine | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [activeFilter, setActiveFilter] = React.useState<"all" | "active" | "inactive">("all")
  const [trackingDialogOpen, setTrackingDialogOpen] = React.useState(false)
  const [selectedRoutine, setSelectedRoutine] = React.useState<Routine | null>(null)
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date())
  const [journalEntries, setJournalEntries] = React.useState<Record<string, string>>({})
  const [detailViewOpen, setDetailViewOpen] = React.useState(false)
  const [detailRoutine, setDetailRoutine] = React.useState<Routine | null>(null)
  const [detailInstances, setDetailInstances] = React.useState<any[]>([])
  const [loadingInstances, setLoadingInstances] = React.useState(false)

  // Animation preferences
  const shouldReduceMotion = useReducedMotion()
  const shouldAnimate = !shouldReduceMotion

  // Generate mock routines for testing
  const generateMockRoutines = (): Routine[] => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)
    const nextMonth = new Date(today)
    nextMonth.setMonth(nextMonth.getMonth() + 1)

    const mockUsers = [
      { id: "1", name: "John Doe", firstName: "John", lastName: "Doe", email: "john@example.com", imageUrl: null },
      { id: "2", name: "Jane Smith", firstName: "Jane", lastName: "Smith", email: "jane@example.com", imageUrl: null },
    ]

    const routineNames = [
      "Morning Medication",
      "Evening Medication",
      "Daily Exercise",
      "Weekly Therapy Session",
      "Blood Pressure Check",
      "Meal Planning",
      "Sleep Tracking",
      "Mood Journal",
      "Weekly Doctor Check-in",
      "Meditation Practice",
    ]

    const descriptions = [
      "Take morning medications with breakfast",
      "Take evening medications before bed",
      "30 minutes of light exercise or walking",
      "Weekly check-in with therapist",
      "Monitor and record blood pressure readings",
      "Plan meals for the week",
      "Track sleep quality and duration",
      "Daily mood and energy level tracking",
      "Weekly check-in call with primary care doctor",
      "10 minutes of mindfulness meditation",
    ]

    const recurrenceTypes: Routine["recurrenceType"][] = [
      "DAILY",
      "DAILY",
      "DAILY",
      "WEEKLY",
      "DAILY",
      "WEEKLY",
      "DAILY",
      "DAILY",
      "WEEKLY",
      "CUSTOM_WEEKDAYS",
    ]

    const priorities: Routine["priority"][] = [
      "HIGH",
      "HIGH",
      "MEDIUM",
      "MEDIUM",
      "HIGH",
      "LOW",
      "MEDIUM",
      "LOW",
      "HIGH",
      "LOW",
    ]

    return routineNames.map((name, i) => {
      const startDate = i < 3 ? today : i < 6 ? tomorrow : nextWeek
      const endDate = i % 3 === 0 ? nextMonth : null
      
      return {
        id: `mock-routine-${i + 1}`,
        name,
        description: descriptions[i],
        patientName: activeTeam?.patientName || "Patient Name",
        priority: priorities[i],
        recurrenceType: recurrenceTypes[i],
        recurrenceDaysOfWeek: recurrenceTypes[i] === "WEEKLY" ? [1] : recurrenceTypes[i] === "CUSTOM_WEEKDAYS" ? [1, 3, 5] : [],
        recurrenceDayOfMonth: null,
        recurrenceSpecificDates: [],
        startDate: startDate.toISOString(),
        endDate: endDate?.toISOString() || null,
        timeOfDay: i % 2 === 0 ? "09:00" : "18:00",
        autoGenerateTasks: true,
        generateDaysAhead: 7,
        hasJournalEntry: i >= 6, // Last 4 have journal entries
        journalPrompts: i >= 6 ? ["How did you feel?", "Any notes?"] : [],
        isActive: i < 8, // First 8 are active
        createdAt: startDate.toISOString(),
        updatedAt: startDate.toISOString(),
        createdBy: mockUsers[0],
        assignedTo: i % 2 === 0 ? mockUsers[0] : mockUsers[1],
        instances: i < 5 ? Array.from({ length: 10 }, (_, j) => {
          const instanceDate = new Date(today)
          instanceDate.setDate(instanceDate.getDate() - (10 - j))
          return {
            id: `instance-${i}-${j}`,
            scheduledDate: instanceDate.toISOString(),
            isCompleted: j < 7, // First 7 completed
            completedAt: j < 7 ? instanceDate.toISOString() : null,
            isSkipped: j === 8,
            journalData: j < 7 && i >= 6 ? { mood: "good", notes: "Feeling great!" } : null,
          }
        }) : [],
        _count: {
          instances: i < 5 ? 10 : 0,
          tasks: i < 5 ? 8 : 0,
        },
      }
    })
  }

  // Fetch routines
  React.useEffect(() => {
    const fetchData = async () => {
      if (!activeTeam) {
        setError("No active team selected")
        setLoading(false)
        return
      }

      try {
        // Fetch team members for form
        const teamResponse = await fetch(`/api/teams/${activeTeam.id}/members`)
        if (teamResponse.ok) {
          const teamData = await teamResponse.json()
          setTeamData(teamData)
        }

        // Use mock routines for testing
        const mockRoutines = generateMockRoutines()
        setRoutines(mockRoutines)

        // Uncomment below to use real API instead of mock data:
        // const routinesResponse = await fetch(`/api/teams/${activeTeam.id}/routines`)
        // if (!routinesResponse.ok) {
        //   throw new Error("Failed to load routines")
        // }
        // const data = await routinesResponse.json()
        // setRoutines(data.routines || [])
      } catch (error) {
        console.error("Error fetching data:", error)
        setError("Failed to load routines")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [activeTeam])

  // Filter routines
  const filteredRoutines = React.useMemo(() => {
    return routines.filter((routine) => {
      const matchesSearch =
        !searchQuery ||
        routine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        routine.description?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesActive =
        activeFilter === "all" ||
        (activeFilter === "active" && routine.isActive) ||
        (activeFilter === "inactive" && !routine.isActive)

      return matchesSearch && matchesActive
    })
  }, [routines, searchQuery, activeFilter])

  // Calculate insights for a routine
  const getRoutineInsights = (routine: Routine) => {
    if (!routine.instances || routine.instances.length === 0) {
      return {
        completionRate: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalInstances: 0,
        completedInstances: 0,
      }
    }

    const completed = routine.instances.filter(i => i.isCompleted).length
    const total = routine.instances.length
    const completionRate = total > 0 ? (completed / total) * 100 : 0

    // Calculate current streak
    const sortedInstances = [...routine.instances].sort((a, b) => 
      new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()
    )
    
    let currentStreak = 0
    for (const instance of sortedInstances) {
      if (instance.isCompleted) {
        currentStreak++
      } else {
        break
      }
    }

    // Calculate longest streak
    let longestStreak = 0
    let tempStreak = 0
    for (const instance of sortedInstances.reverse()) {
      if (instance.isCompleted) {
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        tempStreak = 0
      }
    }

    return {
      completionRate,
      currentStreak,
      longestStreak,
      totalInstances: total,
      completedInstances: completed,
    }
  }

  const handleCreateRoutine = () => {
    setEditingRoutine(null)
    setFormOpen(true)
  }

  const handleEditRoutine = (routine: Routine) => {
    setEditingRoutine(routine)
    setFormOpen(true)
  }

  const handleViewDetails = async (routine: Routine) => {
    setDetailRoutine(routine)
    setDetailViewOpen(true)
    setLoadingInstances(true)

    // Fetch detailed instances for this routine
    if (!activeTeam || routine.id.startsWith("mock-")) {
      // Use mock instances
      setDetailInstances(routine.instances || [])
      setLoadingInstances(false)
      return
    }

    try {
      const response = await fetch(
        `/api/teams/${activeTeam.id}/routines/${routine.id}/instances?limit=100`
      )
      if (response.ok) {
        const data = await response.json()
        setDetailInstances(data.instances || [])
      }
    } catch (error) {
      console.error("Error fetching instances:", error)
      setDetailInstances([])
    } finally {
      setLoadingInstances(false)
    }
  }

  const handleTrackRoutine = (routine: Routine) => {
    setSelectedRoutine(routine)
    setSelectedDate(new Date())
    setJournalEntries({})
    setTrackingDialogOpen(true)
  }

  const handleQuickComplete = async (routine: Routine) => {
    if (!activeTeam || !routine.id) return

    // For routines with journal entries, open the dialog
    if (routine.hasJournalEntry && routine.journalPrompts && routine.journalPrompts.length > 0) {
      handleTrackRoutine(routine)
      return
    }

    // For simple routines, complete immediately
    await handleCompleteInstance(routine, new Date(), true)
  }

  const handleCompleteInstance = async (routine: Routine, date: Date, completed: boolean) => {
    if (!activeTeam || !routine.id) return

    try {
      // For mock data, just update the local state
      if (routine.id.startsWith("mock-")) {
        setRoutines(prev => prev.map(r => {
          if (r.id === routine.id) {
            const today = new Date(date)
            today.setHours(12, 0, 0, 0)
            const existingInstance = r.instances?.find(i => {
              const instanceDate = new Date(i.scheduledDate)
              instanceDate.setHours(12, 0, 0, 0)
              return instanceDate.getTime() === today.getTime()
            })
            
            if (existingInstance) {
              return {
                ...r,
                instances: r.instances?.map(i => 
                  i.id === existingInstance.id 
                    ? { ...i, isCompleted: completed, completedAt: completed ? new Date().toISOString() : null, isSkipped: !completed }
                    : i
                ) || []
              }
            } else {
              // Create new instance
              return {
                ...r,
                instances: [
                  ...(r.instances || []),
                  {
                    id: `instance-${r.id}-${Date.now()}`,
                    scheduledDate: today.toISOString(),
                    isCompleted: completed,
                    completedAt: completed ? new Date().toISOString() : null,
                    isSkipped: !completed,
                    journalData: routine.hasJournalEntry && completed ? journalEntries : null,
                  }
                ]
              }
            }
          }
          return r
        }))
        toast.success(completed ? "✓ Marked as complete!" : "Skipped for today")
        return
      }

      // Real API call would go here
      // Find or create instance
      const instanceDate = new Date(date)
      instanceDate.setHours(12, 0, 0, 0)

      const instancesResponse = await fetch(
        `/api/teams/${activeTeam.id}/routines/${routine.id}/instances?startDate=${instanceDate.toISOString()}&endDate=${instanceDate.toISOString()}`
      )
      
      let instanceId: string | null = null
      if (instancesResponse.ok) {
        const instancesData = await instancesResponse.json()
        const existingInstance = instancesData.instances?.[0]
        if (existingInstance) {
          instanceId = existingInstance.id
        }
      }

      if (instanceId) {
        const response = await fetch(
          `/api/teams/${activeTeam.id}/routines/${routine.id}/instances/${instanceId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              isCompleted: completed,
              isSkipped: !completed,
              journalData: routine.hasJournalEntry && completed ? journalEntries : null,
            }),
          }
        )

        if (!response.ok) {
          throw new Error("Failed to update routine instance")
        }

        toast.success(completed ? "✓ Marked as complete!" : "Skipped for today")
        handleFormSuccess()
      }
    } catch (error) {
      console.error("Error completing routine:", error)
      toast.error("Failed to update routine")
    }
  }

  const handleFormSuccess = () => {
    if (activeTeam) {
      fetch(`/api/teams/${activeTeam.id}/routines`)
        .then((res) => res.json())
        .then((data) => setRoutines(data.routines || []))
        .catch((err) => console.error("Error refreshing routines:", err))
    }
  }

  const handleDeleteRoutine = async (routineId: string) => {
    if (!activeTeam) return

    try {
      const response = await fetch(`/api/teams/${activeTeam.id}/routines/${routineId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete routine")
      }

      toast.success("Routine deleted successfully")
      handleFormSuccess()
    } catch (error) {
      console.error("Error deleting routine:", error)
      toast.error("Failed to delete routine")
    }
  }

  const getRecurrenceLabel = (routine: Routine): string => {
    switch (routine.recurrenceType) {
      case "DAILY":
        return "Daily"
      case "WEEKLY":
        const days = routine.recurrenceDaysOfWeek.map(d => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]).join(", ")
        return `Weekly (${days})`
      case "MONTHLY":
        return `Monthly (day ${routine.recurrenceDayOfMonth})`
      case "CUSTOM_WEEKDAYS":
        const weekdays = routine.recurrenceDaysOfWeek.map(d => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]).join(", ")
        return `Custom (${weekdays})`
      case "SPECIFIC_DATES":
        return `${routine.recurrenceSpecificDates?.length || 0} specific dates`
      default:
        return "Unknown"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-500/10 text-red-700 dark:text-red-400"
      case "HIGH":
        return "bg-orange-500/10 text-orange-700 dark:text-orange-400"
      case "MEDIUM":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
      case "LOW":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const canCreateRoutines = teamData?.currentUser.accessLevel === "FULL" || teamData?.currentUser.isAdmin

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Spinner className="mx-auto mb-4 text-primary" size="lg" />
          <p className="text-muted-foreground">Loading routines...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-8 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Error</h2>
          <p className="text-muted-foreground">{error}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden w-full">
      {/* Header - Fixed */}
      <div className="shrink-0 border-b bg-background w-full overflow-hidden sticky top-0 z-50">
        <div className="px-4 py-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl md:text-3xl font-bold truncate">Routines</h1>
              <p className="text-sm md:text-md text-muted-foreground truncate">
                {filteredRoutines.length} {filteredRoutines.length === 1 ? "routine" : "routines"}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {canCreateRoutines && (
                <Button onClick={handleCreateRoutine} size="default" className="h-10 px-4">
                  <Plus className="md:mr-2 h-4 w-4" />
                  <span className="hidden md:inline">Add Routine</span>
                </Button>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-3 w-full">
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
                className="h-10"
              >
                All
              </Button>
              <Button
                variant={activeFilter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("active")}
                className="h-10"
              >
                Active
              </Button>
              <Button
                variant={activeFilter === "inactive" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("inactive")}
                className="h-10"
              >
                Inactive
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Routines Content */}
      <div className="flex-1 overflow-hidden">
        {filteredRoutines.length === 0 ? (
          <motion.div
            initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-center h-full p-4"
          >
            <Card className="p-12 text-center max-w-md">
              <Repeat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {routines.length === 0 ? "No routines yet" : "No routines found"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {routines.length === 0
                  ? "Routines help you track recurring activities and build healthy habits. Create your first routine to get started with daily journaling and insights."
                  : "Try adjusting your search or filters to see more routines."}
              </p>
              {canCreateRoutines && (
                <Button onClick={handleCreateRoutine}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Routine
                </Button>
              )}
              {!canCreateRoutines && routines.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Contact a team admin to create routines.
                </p>
              )}
            </Card>
          </motion.div>
        ) : (
          <div className="h-full overflow-auto w-full p-4">
            <div className="space-y-4 max-w-6xl mx-auto">
              {filteredRoutines.map((routine, index) => {
                const insights = getRoutineInsights(routine)
                return (
                  <motion.div
                    key={routine.id}
                    initial={shouldAnimate ? { opacity: 0, y: 10, scale: 0.98 } : false}
                    animate={shouldAnimate ? { opacity: 1, y: 0, scale: 1 } : {}}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.05,
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                    }}
                    whileHover={shouldAnimate ? { y: -2, scale: 1.01 } : {}}
                  >
                    <Card
                      className={`group hover:shadow-md transition-all rounded-md ${
                        !routine.isActive ? "opacity-60" : ""
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0" onClick={() => handleEditRoutine(routine)}>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold">{routine.name}</h3>
                              {!routine.isActive && (
                                <Badge variant="outline" className="text-xs">
                                  Inactive
                                </Badge>
                              )}
                              <Badge variant="outline" className={`text-xs ${getPriorityColor(routine.priority)}`}>
                                {routine.priority}
                              </Badge>
                            </div>
                            
                            {routine.description && (
                              <p className="text-sm text-muted-foreground mb-3">{routine.description}</p>
                            )}

                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                              <div className="flex items-center gap-1.5">
                                <Repeat className="h-4 w-4" />
                                <span>{getRecurrenceLabel(routine)}</span>
                              </div>
                              {routine.timeOfDay && (
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-4 w-4" />
                                  <span>{routine.timeOfDay}</span>
                                </div>
                              )}
                              {routine.hasJournalEntry && (
                                <Badge variant="outline" className="text-xs">
                                  Journal
                                </Badge>
                              )}
                            </div>

                            {/* Insights */}
                            {insights.totalInstances > 0 && (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t">
                                <div>
                                  <div className="text-xs text-muted-foreground mb-1">Completion Rate</div>
                                  <div className="text-lg font-semibold">{Math.round(insights.completionRate)}%</div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                    <Flame className="h-3 w-3" />
                                    Current Streak
                                  </div>
                                  <div className="text-lg font-semibold">{insights.currentStreak}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" />
                                    Longest Streak
                                  </div>
                                  <div className="text-lg font-semibold">{insights.longestStreak}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground mb-1">Total</div>
                                  <div className="text-lg font-semibold">
                                    {insights.completedInstances}/{insights.totalInstances}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2 shrink-0">
                            {/* View Details Button */}
                            <Button
                              variant="outline"
                              size="lg"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewDetails(routine)
                              }}
                              className="h-12 px-4 text-base"
                            >
                              <BarChart3 className="h-5 w-5 mr-2" />
                              View Details
                            </Button>
                            
                            {/* Quick Action Buttons - Large and Simple for Older Users */}
                            {routine.isActive && (
                              <>
                                {routine.hasJournalEntry && routine.journalPrompts && routine.journalPrompts.length > 0 ? (
                                  <Button
                                    size="lg"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleTrackRoutine(routine)
                                    }}
                                    className="h-14 px-6 text-lg font-semibold"
                                  >
                                    <CheckCircle2 className="h-6 w-6 mr-2" />
                                    Complete
                                  </Button>
                                ) : (
                                  <Button
                                    size="lg"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleQuickComplete(routine)
                                    }}
                                    className="h-14 px-8 text-lg font-semibold"
                                  >
                                    <Check className="h-6 w-6 mr-2" />
                                    Done Today
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
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
          routine={editingRoutine}
          teamId={activeTeam.id}
          patientName={activeTeam.patientName || null}
          teamMembers={teamData?.members || []}
          onSuccess={handleFormSuccess}
          onDelete={handleDeleteRoutine}
        />
      )}

      {/* Simple Tracking Dialog - Designed for Older Users */}
      <Dialog open={trackingDialogOpen} onOpenChange={setTrackingDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-2xl font-bold">{selectedRoutine?.name}</DialogTitle>
            <DialogDescription className="text-base">
              {selectedRoutine?.hasJournalEntry 
                ? "Complete this routine and add your journal entry"
                : "Mark this routine as complete or skip it"}
            </DialogDescription>
          </DialogHeader>

          {selectedRoutine && (
            <div className="flex-1 overflow-y-auto space-y-6 py-4">
              {/* Date Selection - Simple and Large */}
              <div>
                <Label className="text-lg font-semibold mb-3 block">Date</Label>
                <Input
                  type="date"
                  value={selectedDate.toISOString().split("T")[0]}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="h-14 text-lg"
                />
              </div>

              {/* Journal Entry - Only if routine has journal prompts */}
              {selectedRoutine.hasJournalEntry && selectedRoutine.journalPrompts && selectedRoutine.journalPrompts.length > 0 && (
                <div className="space-y-4">
                  <Label className="text-lg font-semibold block">Journal Entry</Label>
                  {selectedRoutine.journalPrompts.map((prompt, index) => (
                    <div key={index} className="space-y-2">
                      <Label className="text-base font-medium block">{prompt}</Label>
                      <textarea
                        value={journalEntries[prompt] || ""}
                        onChange={(e) =>
                          setJournalEntries({ ...journalEntries, [prompt]: e.target.value })
                        }
                        placeholder="Type your response here..."
                        className="w-full min-h-[100px] rounded-md border-2 border-input bg-transparent px-4 py-3 text-base shadow-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Large Action Buttons - Fixed at bottom */}
              <div className="flex flex-col gap-3 pt-4 border-t shrink-0">
                <Button
                  size="lg"
                  onClick={() => {
                    if (selectedRoutine) {
                      handleCompleteInstance(selectedRoutine, selectedDate, true)
                      setTrackingDialogOpen(false)
                      setJournalEntries({})
                    }
                  }}
                  className="h-16 text-xl font-bold"
                >
                  <CheckCircle2 className="h-7 w-7 mr-3" />
                  Mark as Complete
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    if (selectedRoutine) {
                      handleCompleteInstance(selectedRoutine, selectedDate, false)
                      setTrackingDialogOpen(false)
                      setJournalEntries({})
                    }
                  }}
                  className="h-16 text-xl font-semibold"
                >
                  <SkipForward className="h-7 w-7 mr-3" />
                  Skip for Today
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Detailed View Dialog - Journal, Completion Tracking, Insights */}
      <Dialog open={detailViewOpen} onOpenChange={setDetailViewOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-2xl font-bold">{detailRoutine?.name}</DialogTitle>
            <DialogDescription className="text-base">
              View completion history, journal entries, and insights
            </DialogDescription>
          </DialogHeader>

          {detailRoutine && (
            <div className="flex-1 overflow-y-auto space-y-6 py-4">
              {/* Enhanced Insights */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">Completion Rate</div>
                  <div className="text-3xl font-bold">
                    {Math.round(getRoutineInsights(detailRoutine).completionRate)}%
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${getRoutineInsights(detailRoutine).completionRate}%` }}
                    />
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    <Flame className="h-4 w-4" />
                    Current Streak
                  </div>
                  <div className="text-3xl font-bold">{getRoutineInsights(detailRoutine).currentStreak}</div>
                  <div className="text-xs text-muted-foreground mt-1">days in a row</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    Longest Streak
                  </div>
                  <div className="text-3xl font-bold">{getRoutineInsights(detailRoutine).longestStreak}</div>
                  <div className="text-xs text-muted-foreground mt-1">best streak</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">Total Completed</div>
                  <div className="text-3xl font-bold">
                    {getRoutineInsights(detailRoutine).completedInstances}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    of {getRoutineInsights(detailRoutine).totalInstances} total
                  </div>
                </Card>
              </div>

              {/* Completion Calendar View */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Completion History
                </h3>
                <Card className="p-4">
                  {loadingInstances ? (
                    <div className="flex items-center justify-center py-8">
                      <Spinner className="text-primary" />
                    </div>
                  ) : detailInstances.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No completion history yet. Start tracking to see your progress!
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {detailInstances
                        .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())
                        .map((instance) => {
                          const date = new Date(instance.scheduledDate)
                          const isToday = date.toDateString() === new Date().toDateString()
                          const isPast = date < new Date() && !isToday
                          
                          return (
                            <div
                              key={instance.id}
                              className={`flex items-center justify-between p-3 rounded-md border ${
                                instance.isCompleted
                                  ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                                  : instance.isSkipped
                                  ? "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800"
                                  : isPast
                                  ? "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800"
                                  : "bg-background border-border"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {instance.isCompleted ? (
                                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                ) : instance.isSkipped ? (
                                  <SkipForward className="h-5 w-5 text-gray-500" />
                                ) : (
                                  <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                                )}
                                <div>
                                  <div className="font-medium">
                                    {date.toLocaleDateString("en-US", {
                                      weekday: "long",
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })}
                                    {isToday && (
                                      <Badge variant="outline" className="ml-2 text-xs">
                                        Today
                                      </Badge>
                                    )}
                                  </div>
                                  {instance.completedAt && (
                                    <div className="text-sm text-muted-foreground">
                                      Completed at {new Date(instance.completedAt).toLocaleTimeString("en-US", {
                                        hour: "numeric",
                                        minute: "2-digit",
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {instance.isCompleted && instance.journalData && (
                                <BookOpen className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          )
                        })}
                    </div>
                  )}
                </Card>
              </div>

              {/* Journal Entries View */}
              {detailRoutine.hasJournalEntry && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Journal Entries
                  </h3>
                  <Card className="p-4">
                    {detailInstances.filter(i => i.isCompleted && i.journalData).length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No journal entries yet. Complete a routine with journal tracking to see entries here.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {detailInstances
                          .filter(i => i.isCompleted && i.journalData)
                          .sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())
                          .map((instance) => {
                            const date = new Date(instance.scheduledDate)
                            const journalData = instance.journalData as Record<string, any>
                            
                            return (
                              <div key={instance.id} className="border-l-4 border-primary pl-4 py-2">
                                <div className="text-sm font-medium text-muted-foreground mb-2">
                                  {date.toLocaleDateString("en-US", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </div>
                                {detailRoutine.journalPrompts.map((prompt, index) => (
                                  <div key={index} className="mb-3">
                                    <div className="text-sm font-semibold mb-1">{prompt}</div>
                                    <div className="text-base text-muted-foreground">
                                      {journalData[prompt] || "No response"}
                                    </div>
                                  </div>
                                ))}
                                {Object.entries(journalData)
                                  .filter(([key]) => !detailRoutine.journalPrompts.includes(key))
                                  .map(([key, value]) => (
                                    <div key={key} className="mb-3">
                                      <div className="text-sm font-semibold mb-1">{key}</div>
                                      <div className="text-base text-muted-foreground">{String(value)}</div>
                                    </div>
                                  ))}
                              </div>
                            )
                          })}
                      </div>
                    )}
                  </Card>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (detailRoutine) {
                      handleEditRoutine(detailRoutine)
                      setDetailViewOpen(false)
                    }
                  }}
                  className="flex-1"
                >
                  Edit Routine
                </Button>
                {detailRoutine.isActive && (
                  <Button
                    onClick={() => {
                      if (detailRoutine) {
                        setDetailViewOpen(false)
                        handleTrackRoutine(detailRoutine)
                      }
                    }}
                    className="flex-1"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Track Today
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}


"use client"

import * as React from "react"
import { motion, useReducedMotion } from "framer-motion"
import { useTeamStore } from "@/store/use-team-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TaskForm } from "@/components/task-form"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Search, Filter, Calendar, User, CheckCircle2, XCircle, Clock, AlertCircle, X, Trash2, MoreVertical, LayoutGrid, List, GanttChart, ChevronDown, ChevronUp } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"

interface Task {
  id: string
  name: string
  description?: string | null
  patientName?: string | null
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  status: "TODO" | "DONE" | "CANCELLED" | "DUE"
  dueDate?: string | null
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

export default function TasksPage() {
  const { activeTeam } = useTeamStore()
  const [tasks, setTasks] = React.useState<Task[]>([])
  const [teamData, setTeamData] = React.useState<TeamData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [formOpen, setFormOpen] = React.useState(false)
  const [editingTask, setEditingTask] = React.useState<Task | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [taskToDelete, setTaskToDelete] = React.useState<Task | null>(null)

  // Filters
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [priorityFilter, setPriorityFilter] = React.useState<string>("all")
  const [dueDateFilter, setDueDateFilter] = React.useState<string>("all") // all, overdue, today, thisWeek, upcoming
  const [filterModalOpen, setFilterModalOpen] = React.useState(false)
  
  // View mode: "kanban" | "list" | "timeline"
  const [viewMode, setViewMode] = React.useState<"kanban" | "list" | "timeline">("list")
  
  // Drag and drop
  const [draggedTask, setDraggedTask] = React.useState<Task | null>(null)
  const [dragOverColumn, setDragOverColumn] = React.useState<string | null>(null)
  
  // Collapsible sections state
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
    previous: false, // Closed by default
    today: true,
    tomorrow: true,
    "this-week": true,
    "next-week": true,
    "next-month": true,
    "no-date": true,
  })
  
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  // Animation preferences - must be at top level
  const shouldReduceMotion = useReducedMotion()
  const shouldAnimate = !shouldReduceMotion

  // Fetch team data and tasks
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

        // Fetch tasks from API
        const tasksResponse = await fetch(`/api/teams/${activeTeam.id}/tasks`)
        if (!tasksResponse.ok) {
          throw new Error("Failed to load tasks")
        }
        const data = await tasksResponse.json()
        setTasks(data.tasks || [])
      } catch (error) {
        console.error("Error fetching data:", error)
        setError("Failed to load tasks")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [activeTeam])

  // Filter tasks
  const filteredTasks = React.useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        !searchQuery ||
        task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.patientName?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === "all" || task.status === statusFilter
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter

      // Due date filtering
      let matchesDueDate = true
      if (dueDateFilter !== "all" && task.dueDate) {
        const now = new Date()
        const dueDate = new Date(task.dueDate)
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const taskDue = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())
        const daysDiff = Math.floor((taskDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        switch (dueDateFilter) {
          case "overdue":
            matchesDueDate = dueDate < now && task.status !== "DONE"
            break
          case "today":
            matchesDueDate = daysDiff === 0
            break
          case "thisWeek":
            matchesDueDate = daysDiff >= 0 && daysDiff <= 7
            break
          case "upcoming":
            matchesDueDate = daysDiff > 7
            break
        }
      } else if (dueDateFilter !== "all" && !task.dueDate) {
        matchesDueDate = false
      }

      return matchesSearch && matchesStatus && matchesPriority && matchesDueDate
    })
  }, [tasks, searchQuery, statusFilter, priorityFilter, dueDateFilter])

  const handleCreateTask = () => {
    setEditingTask(null)
    setFormOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setFormOpen(true)
  }

  const handleDeleteClick = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation()
    setTaskToDelete(task)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!activeTeam || !taskToDelete) return

    try {
      const response = await fetch(`/api/teams/${activeTeam.id}/tasks/${taskToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete task")
      }

      toast.success("Task deleted successfully")
      setDeleteDialogOpen(false)
      setTaskToDelete(null)
      
      // Refresh tasks
      const tasksResponse = await fetch(`/api/teams/${activeTeam.id}/tasks`)
      if (tasksResponse.ok) {
        const data = await tasksResponse.json()
        setTasks(data.tasks || [])
      }
    } catch (error) {
      console.error("Error deleting task:", error)
      toast.error("Failed to delete task")
    }
  }

  const handleFormSuccess = () => {
    // Refresh tasks
    if (activeTeam) {
      fetch(`/api/teams/${activeTeam.id}/tasks`)
        .then((res) => res.json())
        .then((data) => setTasks(data.tasks || []))
        .catch((err) => console.error("Error refreshing tasks:", err))
    }
  }

  const handleCheckboxChange = async (task: Task, checked: boolean, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!activeTeam || !canCreateTasks) return

    const newStatus = checked ? "DONE" : "TODO"
    
    // Optimistically update UI
    const updatedTasks = tasks.map((t) =>
      t.id === task.id ? { ...t, status: newStatus as Task["status"] } : t
    )
    setTasks(updatedTasks)

    try {
      const response = await fetch(`/api/teams/${activeTeam.id}/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Failed to update task status")
      }

      // Refresh tasks to get latest data
      const tasksResponse = await fetch(`/api/teams/${activeTeam.id}/tasks`)
      if (tasksResponse.ok) {
        const data = await tasksResponse.json()
        setTasks(data.tasks || [])
      }
    } catch (error) {
      console.error("Error updating task status:", error)
      toast.error("Failed to update task status")
      // Revert optimistic update
      setTasks(tasks)
    }
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", task.id)
  }

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverColumn(status)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    setDragOverColumn(null)

    if (!draggedTask || !activeTeam || draggedTask.status === newStatus) {
      setDraggedTask(null)
      return
    }

    // Optimistically update UI
    const updatedTasks = tasks.map((task) =>
      task.id === draggedTask.id ? { ...task, status: newStatus as Task["status"] } : task
    )
    setTasks(updatedTasks)

    try {
      const response = await fetch(`/api/teams/${activeTeam.id}/tasks/${draggedTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Failed to update task status")
      }

      // Refresh tasks to get latest data
      const tasksResponse = await fetch(`/api/teams/${activeTeam.id}/tasks`)
      if (tasksResponse.ok) {
        const data = await tasksResponse.json()
        setTasks(data.tasks || [])
      }
    } catch (error) {
      console.error("Error updating task status:", error)
      toast.error("Failed to update task status")
      // Revert optimistic update
      setTasks(tasks)
    } finally {
      setDraggedTask(null)
    }
  }

  // Sort tasks for timeline view
  const sortedTasksForTimeline = React.useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }
      if (a.dueDate) return -1
      if (b.dueDate) return 1
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })
  }, [filteredTasks])

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

  const getPriorityDot = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-500"
      case "HIGH":
        return "bg-orange-500"
      case "MEDIUM":
        return "bg-yellow-500"
      case "LOW":
        return "bg-blue-500"
      default:
        return "bg-muted"
    }
  }

  // Group tasks by status for Kanban view
  const tasksByStatus = React.useMemo(() => {
    const grouped: Record<string, Task[]> = {
      TODO: [],
      DUE: [],
      DONE: [],
      CANCELLED: [],
    }

    filteredTasks.forEach((task) => {
      if (grouped[task.status]) {
        grouped[task.status].push(task)
      }
    })

    return grouped
  }, [filteredTasks])

  const getInitials = (name: string | null, firstName: string | null, lastName: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    if (firstName || lastName) {
      return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase()
    }
    return email[0].toUpperCase()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DONE":
        return <CheckCircle2 className="h-4 w-4" />
      case "CANCELLED":
        return <XCircle className="h-4 w-4" />
      case "DUE":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const canCreateTasks = teamData?.currentUser.accessLevel !== "READ_ONLY"

  // Clean team name by removing "'s care team" suffix
  const getCleanTeamName = (teamName: string | undefined | null): string => {
    if (!teamName) return "—"
    return teamName.replace(/'s care team$/i, "").trim()
  }

  // Get status background color classes for cards
  const getStatusBackgroundColor = (status: string) => {
    switch (status) {
      case "DONE":
        return "border-l-4 border-l-emerald-600 dark:bg-emerald-900/40 dark:border-l-emerald-500"
      case "DUE":
        return " border-l-4 border-l-orange-600 dark:bg-orange-900/40 dark:border-l-orange-500"
      case "CANCELLED":
        return " border-l-4 border-l-red-600 dark:bg-red-900/40 dark:border-l-red-500"
      case "TODO":
      default:
        return " border-l-4 border-l-blue-500 dark:bg-blue-900/40 dark:border-l-blue-400"
    }
  }

  // Get status color for legend
  const getStatusLegendColor = (status: string) => {
    switch (status) {
      case "DONE":
        return "bg-emerald-600"
      case "DUE":
        return "bg-orange-600"
      case "CANCELLED":
        return "bg-red-600"
      case "TODO":
      default:
        return "bg-blue-500"
    }
  }

  // Get relative day label (Today, Tomorrow, Yesterday, etc.)
  const getRelativeDayLabel = (dueDate: string | null | undefined): string => {
    if (!dueDate) return ""
    
    const now = new Date()
    const due = new Date(dueDate)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate())
    
    const daysDiff = Math.floor((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff < 0) {
      if (daysDiff === -1) {
        return "Yesterday"
      } else {
        return `${Math.abs(daysDiff)} days ago`
      }
    } else if (daysDiff === 0) {
      return "Today"
    } else if (daysDiff === 1) {
      return "Tomorrow"
    } else if (daysDiff < 7) {
      return `In ${daysDiff} days`
    } else if (daysDiff < 30) {
      return `In ${daysDiff} days`
    } else {
      return `In ${daysDiff} days`
    }
  }

  // Get time period category for grouping
  const getTimePeriod = (dueDate: string | null | undefined): string => {
    if (!dueDate) return "no-date"
    
    const now = new Date()
    const due = new Date(dueDate)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate())
    
    const daysDiff = Math.floor((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff < 0) {
      return "previous"
    } else if (daysDiff === 0) {
      return "today"
    } else if (daysDiff === 1) {
      return "tomorrow"
    } else if (daysDiff >= 2 && daysDiff < 7) {
      return "this-week"
    } else if (daysDiff >= 7 && daysDiff < 30) {
      return "next-week"
    } else {
      return "next-month"
    }
  }

  // Group and sort tasks by time period
  const groupedTasksByTime = React.useMemo(() => {
    const groups: Record<string, Task[]> = {
      previous: [],
      today: [],
      tomorrow: [],
      "this-week": [],
      "next-week": [],
      "next-month": [],
      "no-date": [],
    }

    filteredTasks.forEach((task) => {
      const period = getTimePeriod(task.dueDate)
      groups[period].push(task)
    })

    // Sort tasks within each group by due date/time
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      })
    })

    return groups
  }, [filteredTasks])

  const timePeriodOrder = ["previous", "today", "tomorrow", "this-week", "next-week", "next-month", "no-date"]
  const timePeriodLabels: Record<string, string> = {
    previous: "Previous",
    today: "Today",
    tomorrow: "Tomorrow",
    "this-week": "This Week",
    "next-week": "Next Week",
    "next-month": "Next Month",
    "no-date": "No Date",
  }

  // Check if task should be marked as DUE
  const getEffectiveStatus = (task: Task): Task["status"] => {
    if (task.status === "DONE" || task.status === "CANCELLED") {
      return task.status
    }
    
    if (task.dueDate) {
      const now = new Date()
      const due = new Date(task.dueDate)
      if (due < now) {
        return "DUE"
      }
    }
    
    return task.status
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Spinner className="mx-auto mb-4 text-primary" size="lg" />
          <p className="text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-8 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
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
              <h1 className="text-2xl md:text-3xl font-bold truncate">Tasks</h1>
              <p className="text-sm md:text-md text-muted-foreground truncate">
            {filteredTasks.length} {filteredTasks.length === 1 ? "task" : "tasks"}
            {searchQuery || statusFilter !== "all" || priorityFilter !== "all"
              ? ` (filtered from ${tasks.length})`
              : ""}
          </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {/* Status Legend - Top Right */}
              {viewMode === "list" && (
                <div className="hidden xl:flex items-center gap-2.5 px-3 py-2 bg-muted/50 rounded-lg border">
                  <span className="text-xs font-semibold text-muted-foreground">Status:</span>
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className={`h-3.5 w-3.5 rounded-full ${getStatusLegendColor("TODO")}`} />
                      <span className="text-xs font-medium text-muted-foreground">To Do</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`h-3.5 w-3.5 rounded-full ${getStatusLegendColor("DUE")}`} />
                      <span className="text-xs font-medium text-muted-foreground">Due</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`h-3.5 w-3.5 rounded-full ${getStatusLegendColor("DONE")}`} />
                      <span className="text-xs font-medium text-muted-foreground">Done</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`h-3.5 w-3.5 rounded-full ${getStatusLegendColor("CANCELLED")}`} />
                      <span className="text-xs font-medium text-muted-foreground">Cancelled</span>
                    </div>
                  </div>
                </div>
              )}
              {/* View Toggle */}
              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewMode === "kanban" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-r-none border-0 h-10 px-3"
                  onClick={() => setViewMode("kanban")}
                >
                  <LayoutGrid className="h-5 w-5" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none border-0 border-x h-10 px-3"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-5 w-5" />
                </Button>
                <Button
                  variant={viewMode === "timeline" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-l-none border-0 h-10 px-3"
                  onClick={() => setViewMode("timeline")}
                >
                  <GanttChart className="h-5 w-5" />
                </Button>
        </div>
        {canCreateTasks && (
                <Button onClick={handleCreateTask} size="default" className="h-10 px-4">
                  <Plus className="md:mr-2 h-4 w-4" />
                  <span className="hidden md:inline ">Add Task</span>
          </Button>
        )}
      </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-3 w-full">
            <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              
                className="pl-10 pr-12 h-10 "
            />
            {(statusFilter !== "all" || priorityFilter !== "all" || dueDateFilter !== "all") && (
              <Button
                variant="ghost"
                size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => {
                  setStatusFilter("all")
                  setPriorityFilter("all")
                  setDueDateFilter("all")
                }}
              >
                  <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        <Button
          variant="outline"
          onClick={() => setFilterModalOpen(true)}
              className="relative shrink-0 h-10 px-4"
              size="default"
        >
              <Filter className="mr-2 h-5 w-5" />
              <span className="hidden sm:inline ">Filters</span>
          {(statusFilter !== "all" || priorityFilter !== "all" || dueDateFilter !== "all") && (
                <span className="ml-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
              {[statusFilter, priorityFilter, dueDateFilter].filter((f) => f !== "all").length}
            </span>
          )}
        </Button>
      </div>
</div>
      </div>
      {/* Tasks Content */}
      <div className="flex-1 overflow-hidden">
      {filteredTasks.length === 0 ? (
          <div className="flex items-center justify-center h-full p-4">
            <Card className="p-12 text-center max-w-md">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
          <p className="text-muted-foreground mb-4">
            {tasks.length === 0
              ? "Get started by creating your first task."
              : "Try adjusting your filters to see more tasks."}
          </p>
          {canCreateTasks && tasks.length === 0 && (
            <Button onClick={handleCreateTask}>
              <Plus className="mr-2 h-4 w-4" />
              Create Task
            </Button>
          )}
        </Card>
          </div>
        ) : viewMode === "kanban" ? (
          <div className="h-full overflow-x-auto overflow-y-hidden lg:overflow-x-auto lg:overflow-y-hidden">
            <div className="flex flex-col lg:flex-row gap-4 p-4 h-full lg:min-w-max">
          {[
            { status: "TODO", label: "To Do", icon: Clock, color: "text-muted-foreground" },
            { status: "DUE", label: "Due", icon: AlertCircle, color: "text-orange-500" },
            { status: "DONE", label: "Done", icon: CheckCircle2, color: "text-green-500" },
            { status: "CANCELLED", label: "Cancelled", icon: XCircle, color: "text-red-500" },
          ].map((column, columnIndex) => {
            const columnTasks = tasksByStatus[column.status] || []
            const Icon = column.icon
                const isDragOver = dragOverColumn === column.status

            return (
                  <motion.div
                    key={column.status}
                    initial={shouldAnimate ? { opacity: 0, x: -20 } : false}
                    animate={shouldAnimate ? { opacity: 1, x: 0 } : {}}
                    transition={{
                      duration: 0.3,
                      delay: columnIndex * 0.1,
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                    className={`shrink-0 w-full lg:w-80 flex flex-col lg:h-full h-auto max-h-[50vh] lg:max-h-none ${
                      isDragOver ? "bg-primary/5" : ""
                    }`}
                    onDragOver={(e) => handleDragOver(e, column.status)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, column.status)}
                  >
                    <div className="flex items-center justify-between mb-4 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${column.color.replace("text-", "bg-")}`} />
                    <h3 className="font-semibold text-sm">{column.label}</h3>
                    <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-xs">
                      {columnTasks.length}
                    </Badge>
                  </div>
                  {canCreateTasks && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={handleCreateTask}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                  {columnTasks.map((task, taskIndex) => (
                    <motion.div
                      key={task.id}
                      initial={shouldAnimate ? { opacity: 0, y: 10, scale: 0.98 } : false}
                      animate={shouldAnimate ? { opacity: 1, y: 0, scale: 1 } : {}}
                      transition={{
                        duration: 0.3,
                        delay: taskIndex * 0.05,
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                      whileHover={shouldAnimate ? { y: -2, scale: 1.01 } : {}}
                      whileDrag={shouldAnimate ? { scale: 1.05, rotate: 2 } : {}}
                    >
                      <Card
                          draggable={canCreateTasks}
                          onDragStart={(e) => handleDragStart(e, task)}
                          className={`group hover:shadow-md transition-all cursor-pointer bg-card ${
                            draggedTask?.id === task.id ? "opacity-50" : ""
                          }`}
                      onClick={() => handleEditTask(task)}
                    >
                      <CardContent className="p-4">
                        {/* Tags */}
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          {task.patientName && (
                            <Badge variant="outline" className="text-xs">
                              <User className="h-3 w-3 mr-1" />
                              {task.patientName}
                            </Badge>
                          )}
                          <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                            <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${getPriorityDot(task.priority)}`} />
                            {task.priority}
                          </Badge>
                        </div>

                        {/* Task Name */}
                        <h3 className="font-semibold text-sm mb-2 line-clamp-2">{task.name}</h3>

                        {/* Description */}
                        {task.description && (
                          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <div className="flex items-center gap-2">
                            {task.assignedTo ? (
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={task.assignedTo.imageUrl || undefined} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(
                                    task.assignedTo.name,
                                    task.assignedTo.firstName,
                                    task.assignedTo.lastName,
                                    task.assignedTo.email
                                  )}
                                </AvatarFallback>
                              </Avatar>
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-3 w-3 text-muted-foreground" />
                              </div>
                            )}
                            {task.dueDate && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(task.dueDate).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            )}
                          </div>
                          {canCreateTasks && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteClick(task, e)
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                        </motion.div>
                      ))}
                      {columnTasks.length === 0 && (
                        <motion.div
                          initial={shouldAnimate ? { opacity: 0 } : false}
                          animate={shouldAnimate ? { opacity: 1 } : {}}
                          transition={{ duration: 0.3 }}
                          className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed rounded-lg"
                        >
                          No tasks
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        ) : viewMode === "list" ? (
          <div className="h-full overflow-auto w-full p-4">
            <div className="space-y-6 mx-auto">
              {filteredTasks.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex items-center justify-center h-full min-h-[400px]"
                >
                  <Card className="p-12 text-center max-w-md w-full ">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-muted-foreground">No tasks found</p>
                  </Card>
                </motion.div>
              ) : (
                timePeriodOrder.map((period, periodIndex) => {
                  const tasksInPeriod = groupedTasksByTime[period]
                  if (tasksInPeriod.length === 0) return null
                  const isExpanded = expandedSections[period]

                  return (
                    <motion.div
                      key={period}
                      initial={shouldAnimate ? { opacity: 0, y: 10 } : false}
                      animate={shouldAnimate ? { opacity: 1, y: 0 } : {}}
                      transition={{
                        duration: 0.3,
                        delay: periodIndex * 0.05,
                      }}
                      className="space-y-3"
                    >
                      <motion.button
                        onClick={() => toggleSection(period)}
                        whileHover={shouldAnimate ? { x: 2 } : {}}
                        whileTap={shouldAnimate ? { scale: 0.98 } : {}}
                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted/50 rounded-md transition-colors w-full text-left"
                      >
                        <motion.div
                          animate={shouldAnimate ? { rotate: isExpanded ? 0 : -90 } : {}}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                        >
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </motion.div>
                        <h2 className="text-base font-normal text-muted-foreground">
                          {timePeriodLabels[period]} ({tasksInPeriod.length})
                        </h2>
                      </motion.button>
                      {isExpanded && (
                        <motion.div
                          initial={shouldAnimate ? { opacity: 0, height: 0 } : false}
                          animate={shouldAnimate ? { opacity: 1, height: "auto" } : {}}
                          exit={shouldAnimate ? { opacity: 0, height: 0 } : {}}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="space-y-3 overflow-hidden"
                        >
                          {tasksInPeriod.map((task, taskIndex) => {
                            const effectiveStatus = getEffectiveStatus(task)
                            return (
                              <motion.div
                                key={task.id}
                                initial={shouldAnimate ? { opacity: 0, y: 10, scale: 0.98 } : false}
                                animate={shouldAnimate ? { opacity: 1, y: 0, scale: 1 } : {}}
                                transition={{
                                  duration: 0.3,
                                  delay: taskIndex * 0.03,
                                  type: "spring",
                                  stiffness: 400,
                                  damping: 30,
                                }}
                                whileHover={shouldAnimate ? { 
                                  y: -2, 
                                  scale: 1,
                                  transition: { duration: 0.2 }
                                } : {}}
                              >
                                <Card
                                  className={`group hover:shadow-md transition-all cursor-pointer rounded-md ${getStatusBackgroundColor(effectiveStatus)}`}
                                  onClick={() => handleEditTask(task)}
                                >
                                <CardContent className="p-3">
                                  <div className="flex items-center gap-3">
                                    <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                                      <input
                                        type="checkbox"
                                        checked={effectiveStatus === "DONE"}
                                        onChange={(e) => handleCheckboxChange(task, e.target.checked, e as any)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0 flex items-center gap-3">
                                      {task.dueDate && (
                                        <div className="text-xs shrink-0 w-28">
                                          <div className="font- text-[15px]">
                                           {new Date(task.dueDate).toLocaleTimeString("en-US", {
                                                hour: "numeric",
                                                minute: "2-digit",
                                                hour12: true,
                                              })}
                                          </div>
                                          <div className="text-muted-foreground text-md">
                                            {new Date(task.dueDate).toLocaleDateString("en-US", {
                                              month: "short",
                                              day: "numeric",
                                              year: "numeric",
                                            })}
                                          </div>
                                        </div>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <div className={`font-normal text-md truncate ${
                                          effectiveStatus === "DONE" ? "line-through text-muted-foreground" : ""
                                        }`}>
                                          {task.name}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="shrink-0">
                                      <Badge 
                                        variant="outline" 
                                        className={`text-[11px] px-1.5 py-1.5 h-6 shrink-0 leading-none ${getPriorityColor(task.priority)}`}
                                      >
                                        <span className={`h-1 w-1 rounded-sm mr-0.5 ${getPriorityDot(task.priority)}`} />
                                        {task.priority}
                                      </Badge>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                              </motion.div>
                            )
                          })}
                        </motion.div>
                      )}
                    </motion.div>
                  )
                })
              )}
            </div>
          </div>
          ) : (
            <div className="h-full overflow-y-auto p-4">
              <div className="max-w-4xl mx-auto space-y-4">
                {sortedTasksForTimeline.map((task, taskIndex) => (
                  <motion.div
                    key={task.id}
                    initial={shouldAnimate ? { opacity: 0, x: -20, scale: 0.98 } : false}
                    animate={shouldAnimate ? { opacity: 1, x: 0, scale: 1 } : {}}
                    transition={{
                      duration: 0.3,
                      delay: taskIndex * 0.05,
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                    }}
                    whileHover={shouldAnimate ? { x: 4, scale: 1.01 } : {}}
                  >
                    <Card
                      className="group hover:shadow-md transition-all cursor-pointer"
                      onClick={() => handleEditTask(task)}
                    >
                  <CardContent className="p-4">
                      <div className="flex gap-4">
                      <div className="shrink-0 w-24 text-right">
                        {task.dueDate ? (
                          <div className="text-sm font-semibold">
                            {new Date(task.dueDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">No date</div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          {task.dueDate && new Date(task.dueDate).toLocaleDateString("en-US", { year: "numeric" })}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {task.status}
                          </Badge>
                          {task.patientName && (
                            <Badge variant="outline" className="text-xs">
                              <User className="h-3 w-3 mr-1" />
                              {task.patientName}
                            </Badge>
                          )}
                          <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                            <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${getPriorityDot(task.priority)}`} />
                            {task.priority}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-base mb-1">{task.name}</h3>
                        {task.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {task.assignedTo ? (
                            <div className="flex items-center gap-1">
                              <Avatar className="h-4 w-4">
                                <AvatarImage src={task.assignedTo.imageUrl || undefined} />
                                <AvatarFallback className="text-[8px]">
                                  {getInitials(
                                    task.assignedTo.name,
                                    task.assignedTo.firstName,
                                    task.assignedTo.lastName,
                                    task.assignedTo.email
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              <span>{task.assignedTo.name || task.assignedTo.email}</span>
                            </div>
                          ) : (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Unassigned
                            </span>
                          )}
                        </div>
                      </div>
                      {canCreateTasks && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteClick(task, e)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{taskToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setTaskToDelete(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
            >
              Delete Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filter Modal */}
      <Sheet open={filterModalOpen} onOpenChange={setFilterModalOpen}>
        <SheetContent className="sm:max-w-md p-4">
          <SheetHeader>
            <SheetTitle>Filter Tasks</SheetTitle>
            <SheetDescription>
              Filter tasks by status, priority, and due date
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            <div className="space-y-3">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="TODO">To Do</SelectItem>
                  <SelectItem value="DUE">Due</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Priority</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Due Date</Label>
              <Select value={dueDateFilter} onValueChange={setDueDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Dates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="thisWeek">This Week</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setStatusFilter("all")
                  setPriorityFilter("all")
                  setDueDateFilter("all")
                }}
              >
                Clear All
              </Button>
              <Button
                className="flex-1"
                onClick={() => setFilterModalOpen(false)}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Task Form */}
      {activeTeam && (
        <TaskForm
          open={formOpen}
          onOpenChange={setFormOpen}
          task={editingTask}
          teamId={activeTeam.id}
          patientName={activeTeam.patientName || null}
          teamMembers={teamData?.members || []}
          onSuccess={handleFormSuccess}
          onDelete={async (taskId: string) => {
            if (!activeTeam) return
            try {
              const response = await fetch(`/api/teams/${activeTeam.id}/tasks/${taskId}`, {
                method: "DELETE",
              })
              if (!response.ok) {
                throw new Error("Failed to delete task")
              }
              toast.success("Task deleted successfully")
              setFormOpen(false)
              setEditingTask(null)
              handleFormSuccess()
            } catch (error) {
              console.error("Error deleting task:", error)
              toast.error("Failed to delete task")
            }
          }}
        />
      )}
    </div>
  )
}


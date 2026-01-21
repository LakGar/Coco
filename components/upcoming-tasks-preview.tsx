"use client"

import * as React from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { format, startOfDay, addDays } from "date-fns"

interface Task {
  id: string
  name: string
  dueDate?: string | null
  status: "TODO" | "DONE" | "CANCELLED" | "DUE"
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
}

interface UpcomingTasksPreviewProps {
  tasks: Task[]
  onTaskClick?: (taskId: string) => void
}

export function UpcomingTasksPreview({
  tasks,
  onTaskClick,
}: UpcomingTasksPreviewProps) {
  const router = useRouter()
  const shouldReduceMotion = useReducedMotion()
  const shouldAnimate = !shouldReduceMotion

  const handleTaskClick = (taskId: string) => {
    if (onTaskClick) {
      onTaskClick(taskId)
    } else {
      router.push(`/dashboard/tasks`)
    }
  }

  const getTimeLabel = (dueDate?: string | null) => {
    if (!dueDate) return null
    const date = new Date(dueDate)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    if (taskDate.getTime() === today.getTime()) {
      return `Today at ${format(date, "h:mm a")}`
    }
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    if (taskDate.getTime() === tomorrow.getTime()) {
      return `Tomorrow at ${format(date, "h:mm a")}`
    }
    return format(date, "MMM d, h:mm a")
  }

  // Filter for upcoming tasks (not today, not overdue, not done)
  const upcomingTasks = React.useMemo(() => {
    return tasks.filter((task) => {
      if (task.status === "DONE" || task.status === "CANCELLED") return false
      if (!task.dueDate) return false
      
      const dueDate = new Date(task.dueDate)
      const now = new Date()
      const today = startOfDay(now)
      const nextWeek = addDays(today, 7)
      
      // Normalize dates to start of day for comparison
      const dueDateStart = startOfDay(dueDate)
      
      // Include tasks due after today and within the next 7 days
      // Exclude today's tasks (those go in the "Tasks" section)
      const isAfterToday = dueDateStart.getTime() > today.getTime()
      const isWithinNextWeek = dueDateStart.getTime() <= nextWeek.getTime()
      
      return isAfterToday && isWithinNextWeek
    })
    // Limit to 3 max, prioritize by due date (soonest first)
    .sort((a, b) => {
      if (!a.dueDate || !b.dueDate) return 0
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    })
    .slice(0, 3) // Max 3 tasks - protect this limit
  }, [tasks])

  // Always show the section, even if empty

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: 10 } : false}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.3, delay: 0.35 }}
    >
      <Card className="border border-border/50 hover:border-border transition-all bg-card/50">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-base font-medium">Upcoming Tasks</h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard/tasks")}
              className="text-xs h-7 px-3 border-border/50 hover:bg-muted/50"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
          <div className="space-y-1.5">
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => handleTaskClick(task.id)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left group border border-transparent hover:border-border/50"
                >
                  <Clock className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      {task.name}
                    </p>
                    {task.dueDate && (
                      <p className="text-xs text-muted-foreground">
                        {getTimeLabel(task.dueDate)}
                      </p>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4">
                No upcoming tasks in the next week
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}


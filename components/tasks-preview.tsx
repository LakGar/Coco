"use client"

import * as React from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"

interface Task {
  id: string
  name: string
  dueDate?: string | null
  status: "TODO" | "DONE" | "CANCELLED" | "DUE"
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
}

interface TasksPreviewProps {
  tasks: Task[]
  onTaskClick?: (taskId: string) => void
  onCompleteTask?: (taskId: string) => void
}

export function TasksPreview({
  tasks,
  onTaskClick,
  onCompleteTask,
}: TasksPreviewProps) {
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

  const handleComplete = async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation()
    if (onCompleteTask) {
      onCompleteTask(taskId)
    }
  }

  const getStatusIcon = (status: string, dueDate?: string | null) => {
    if (status === "DONE") {
      return <CheckCircle2 className="h-4 w-4 text-emerald-500/60" />
    }
    if (status === "DUE" || (dueDate && new Date(dueDate) < new Date())) {
      return <AlertCircle className="h-4 w-4 text-red-500/60" />
    }
    return <Clock className="h-4 w-4 text-amber-500/60" />
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
    if (taskDate.getTime() === today.getTime() + 86400000) {
      return `Tomorrow at ${format(date, "h:mm a")}`
    }
    return format(date, "MMM d, h:mm a")
  }

  // Show max 4 tasks
  const displayTasks = tasks.slice(0, 4)

  if (displayTasks.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: 10 } : false}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <Card className="border border-border/50 hover:border-border transition-all bg-card/50">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-medium">Tasks</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard/tasks")}
              className="text-xs h-7 px-3 border-border/50 hover:bg-muted/50"
            >
              View all
            </Button>
          </div>
          <div className="space-y-1.5">
            {displayTasks.map((task, index) => (
              <button
                key={task.id}
                onClick={() => handleTaskClick(task.id)}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left group border border-transparent hover:border-border/50"
              >
                <button
                  onClick={(e) => handleComplete(e, task.id)}
                  className="shrink-0 hover:scale-110 transition-transform"
                  disabled={task.status === "DONE"}
                >
                  {getStatusIcon(task.status, task.dueDate)}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${task.status === "DONE" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {task.name}
                  </p>
                  {task.dueDate && (
                    <p className="text-xs text-muted-foreground">
                      {getTimeLabel(task.dueDate)}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}


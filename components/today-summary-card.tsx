"use client"

import * as React from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, CheckCircle2, BookOpen, Clock } from "lucide-react"
import { useRouter } from "next/navigation"

interface TodaySummaryCardProps {
  routinesScheduled: number
  tasksDue: number
  journalFilled: boolean
  onRoutinesClick?: () => void
  onTasksClick?: () => void
  onJournalClick?: () => void
}

export function TodaySummaryCard({
  routinesScheduled,
  tasksDue,
  journalFilled,
  onRoutinesClick,
  onTasksClick,
  onJournalClick,
}: TodaySummaryCardProps) {
  const router = useRouter()
  const shouldReduceMotion = useReducedMotion()
  const shouldAnimate = !shouldReduceMotion

  const handleRoutinesClick = () => {
    if (onRoutinesClick) {
      onRoutinesClick()
    } else {
      router.push("/dashboard/routines")
    }
  }

  const handleTasksClick = () => {
    if (onTasksClick) {
      onTasksClick()
    } else {
      router.push("/dashboard/tasks")
    }
  }

  const handleJournalClick = () => {
    if (onJournalClick) {
      onJournalClick()
    } else {
      router.push("/dashboard/routines")
    }
  }

  // Ensure we have valid numbers
  const safeRoutinesScheduled = typeof routinesScheduled === 'number' ? routinesScheduled : 0
  const safeTasksDue = typeof tasksDue === 'number' ? tasksDue : 0
  const safeJournalFilled = typeof journalFilled === 'boolean' ? journalFilled : false

  const items = [
    {
      icon: Calendar,
      label: `${safeRoutinesScheduled} routine${safeRoutinesScheduled === 1 ? "" : "s"} scheduled`,
      onClick: handleRoutinesClick,
      color: "text-blue-600",
      show: true,
    },
    {
      icon: CheckCircle2,
      label: `${safeTasksDue} task${safeTasksDue === 1 ? "" : "s"} due`,
      onClick: handleTasksClick,
      color: "text-emerald-600",
      show: true,
    },
    {
      icon: BookOpen,
      label: safeJournalFilled ? "Journal filled" : "Journal not filled yet",
      onClick: handleJournalClick,
      color: safeJournalFilled ? "text-emerald-600" : "text-amber-600",
      show: safeRoutinesScheduled > 0, // Only show journal status if there are routines scheduled
    },
  ].filter((item) => item.show)

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: 10 } : false}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card className="border border-border/50 hover:border-border transition-all bg-card/50">
        <CardContent className="p-5">
          <h3 className="text-base font-medium mb-4">Today</h3>
          <div className="space-y-2">
            {items.map((item, index) => {
              const Icon = item.icon
              return (
                <button
                  key={index}
                  onClick={item.onClick}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left border border-transparent hover:border-border/50"
                >
                  <Icon className={`h-4 w-4 text-blue-600 shrink-0`} />
                  <span className="text-sm text-foreground flex-1">{item.label}</span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}


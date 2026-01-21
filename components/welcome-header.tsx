"use client"

import * as React from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { BookOpen, Plus, FileText, ClipboardList } from "lucide-react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"

interface WelcomeHeaderProps {
  teamName?: string
  onFillJournal?: () => void
  onAddTask?: () => void
  onAddNote?: () => void
  onViewCarePlan?: () => void
}

export function WelcomeHeader({
  teamName,
  onFillJournal,
  onAddTask,
  onAddNote,
  onViewCarePlan,
}: WelcomeHeaderProps) {
  const router = useRouter()
  const shouldReduceMotion = useReducedMotion()
  const shouldAnimate = !shouldReduceMotion

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }

  const quickActions = [
    {
      label: "Journal",
      icon: BookOpen,
      onClick: onFillJournal || (() => router.push("/dashboard/routines")),
    },
    {
      label: "Task",
      icon: Plus,
      onClick: onAddTask || (() => router.push("/dashboard/tasks")),
    },
    {
      label: "Note",
      icon: FileText,
      onClick: onAddNote || (() => {router.push("/dashboard/notes")}),
    },
    {
      label: "Care Plan",
      icon: ClipboardList,
      onClick: onViewCarePlan || (() => {router.push("/dashboard/care-plan")}),
    },
  ]

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: -10 } : false}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div>
        <h1 className="text-3xl font-semibold tracking-tight mb-1">
          {getGreeting()}
        </h1>
        <p className="text-muted-foreground text-sm">
          {format(new Date(), "EEEE, MMMM d")}
          {teamName && ` • ${teamName}`}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {quickActions.map((action, index) => {
          const Icon = action.icon
          return (
            <Button
              key={index}
              onClick={action.onClick}
              variant="outline"
              size="sm"
              className="h-9 px-4 bg-background/50 hover:bg-muted/50 border-border/50"
            >
              <Icon className="h-4 w-4 mr-2" />
              {action.label}
            </Button>
          )
        })}
      </div>
    </motion.div>
  )
}


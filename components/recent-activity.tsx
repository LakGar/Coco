"use client"

import * as React from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format, formatDistanceToNow } from "date-fns"
import { BookOpen, CheckCircle2, Smile, FileText } from "lucide-react"

interface ActivityItem {
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
}

interface RecentActivityProps {
  activities: ActivityItem[]
}

const ACTIVITY_ICONS = {
  mood: Smile,
  task: CheckCircle2,
  routine: BookOpen,
  note: FileText,
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const shouldReduceMotion = useReducedMotion()
  const shouldAnimate = !shouldReduceMotion

  // Show only last 2 activities
  const displayActivities = activities.slice(0, 2)

  if (displayActivities.length === 0) {
    return null
  }

  const getAuthorName = (author: ActivityItem["author"]) => {
    if (author.name) return author.name
    if (author.firstName || author.lastName) {
      return `${author.firstName || ""} ${author.lastName || ""}`.trim()
    }
    return "Unknown"
  }

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: 10 } : false}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.3, delay: 0.5 }}
    >
      <Card className="border border-border/50 hover:border-border transition-all bg-card/50">
        <CardContent className="p-5">
          <h3 className="text-base font-medium mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {displayActivities.map((activity, index) => {
              const Icon = ACTIVITY_ICONS[activity.type]
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarImage src={activity.author.imageUrl || undefined} />
                    <AvatarFallback className="text-xs">
                      {getAuthorName(activity.author)
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <p className="text-sm flex-1">
                        <span className="font-medium text-foreground">{getAuthorName(activity.author)}</span>{" "}
                        <span className="text-muted-foreground">{activity.message}</span>
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}


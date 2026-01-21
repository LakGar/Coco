"use client"

import * as React from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

interface RoutinesPreviewProps {
  routinesCount: number
  completedToday: number
  onViewRoutines?: () => void
}

export function RoutinesPreview({
  routinesCount,
  completedToday,
  onViewRoutines,
}: RoutinesPreviewProps) {
  const router = useRouter()
  const shouldReduceMotion = useReducedMotion()
  const shouldAnimate = !shouldReduceMotion

  const handleViewRoutines = () => {
    if (onViewRoutines) {
      onViewRoutines()
    } else {
      router.push("/dashboard/routines")
    }
  }

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: 10 } : false}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <Card className="border border-border/50 hover:border-border transition-all bg-card/50">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-base font-medium">Routines</h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewRoutines}
              className="text-xs h-7 px-3 border-border/50 hover:bg-muted/50"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
          <div className="space-y-3">
            <button
              onClick={handleViewRoutines}
              className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50"
            >
              <span className="text-sm text-muted-foreground">Active routines</span>
              <span className="text-sm font-medium text-emerald-600">{routinesCount}</span>
            </button>
            <button
              onClick={handleViewRoutines}
              className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50"
            >
              <span className="text-sm text-muted-foreground">Completed today</span>
              <span className="text-sm font-medium text-blue-600">{completedToday}</span>
            </button>
            {routinesCount === 0 && (
              <div className="text-sm text-muted-foreground text-center py-2">
                No routines set up yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}


"use client"

import * as React from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Lightbulb, TrendingUp, Moon, Heart } from "lucide-react"

interface InsightsPreviewProps {
  insights: Array<{
    id: string
    type: "sleep" | "mood" | "routine" | "general"
    message: string
    icon?: React.ReactNode
  }>
}

const INSIGHT_ICONS = {
  sleep: Moon,
  mood: Heart,
  routine: TrendingUp,
  general: Lightbulb,
}

export function InsightsPreview({ insights }: InsightsPreviewProps) {
  const shouldReduceMotion = useReducedMotion()
  const shouldAnimate = !shouldReduceMotion

  // Show only the first insight
  const insight = insights[0]

  if (!insight) {
    return null
  }

  const Icon = insight.icon
    ? (insight.icon as React.ComponentType<{ className?: string }>)
    : INSIGHT_ICONS[insight.type] || Lightbulb

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: 10 } : false}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.3, delay: 0.4 }}
    >
      <Card className="border border-border/50 hover:border-border transition-all bg-card/50">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="shrink-0 p-2 rounded-lg bg-muted/30">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">
                Insight
              </h3>
              <p className="text-sm leading-relaxed text-foreground">{insight.message}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}


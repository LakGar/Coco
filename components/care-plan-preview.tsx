"use client"

import * as React from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClipboardList, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"

interface CarePlanPreviewProps {
  onViewCarePlan?: () => void
}

export function CarePlanPreview({ onViewCarePlan }: CarePlanPreviewProps) {
  const router = useRouter()
  const shouldReduceMotion = useReducedMotion()
  const shouldAnimate = !shouldReduceMotion

  const handleViewCarePlan = () => {
    if (onViewCarePlan) {
      onViewCarePlan()
    } else {
      // TODO: Navigate to care plan page when implemented
      router.push("/dashboard")
    }
  }

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: 10 } : false}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.3, delay: 0.4 }}
    >
      <Card className="border border-border/50 hover:border-border transition-all bg-card/50">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-base font-medium">Care Plan</h3>
            </div>
            <Button
              size="sm"
              onClick={handleViewCarePlan}
              className="text-xs h-7 px-3 bg-rose-600 hover:bg-rose-700 text-white"
            >
              View
              <ExternalLink className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              This is our shared understanding of care goals, medications, and important instructions. Read-only for easy reference.
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30"></span>
              <span>Coming soon</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}


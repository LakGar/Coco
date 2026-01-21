"use client"

import * as React from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

interface NotesPreviewProps {
  onAddNote?: () => void
}

export function NotesPreview({ onAddNote }: NotesPreviewProps) {
  const router = useRouter()
  const shouldReduceMotion = useReducedMotion()
  const shouldAnimate = !shouldReduceMotion

  const handleAddNote = () => {
    if (onAddNote) {
      onAddNote()
    } else {
      // TODO: Navigate to notes page when implemented
      router.push("/dashboard")
    }
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
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-base font-medium">Notes</h3>
            </div>
            <Button
              size="sm"
              onClick={handleAddNote}
              className="text-xs h-7 px-3 bg-teal-600 hover:bg-teal-700 text-white"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add
            </Button>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground text-center py-6">
              No notes yet. Add your first note to track observations and important information.
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}


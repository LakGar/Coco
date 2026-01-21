"use client"

import * as React from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface Routine {
  id: string
  name: string
  checklistItems: string[]
  recurrenceDaysOfWeek: number[]
}

interface RoutineInstance {
  id?: string
  routineId: string
  entryDate: string
  answers?: Record<string, boolean>
  notes?: string
}

interface NightlyJournalModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  routine: Routine | null
  lastEntry?: RoutineInstance | null // Last entry for auto-fill
  onSave: (entry: RoutineInstance) => Promise<void>
  entryDate?: Date // Date this journal entry is for (defaults to today)
}

export function NightlyJournalModal({
  open,
  onOpenChange,
  routine,
  lastEntry,
  onSave,
  entryDate = new Date(),
}: NightlyJournalModalProps) {
  const [answers, setAnswers] = React.useState<Record<string, boolean>>({})
  const [notes, setNotes] = React.useState<string>("")
  const [saving, setSaving] = React.useState(false)
  const shouldReduceMotion = useReducedMotion()
  const shouldAnimate = !shouldReduceMotion

  // Initialize answers state - auto-fill from last entry
  React.useEffect(() => {
    if (open && routine) {
      const initialAnswers: Record<string, boolean> = {}
      
      // Auto-fill from last entry if available
      if (lastEntry?.answers) {
        routine.checklistItems.forEach((item) => {
          initialAnswers[item] = lastEntry.answers![item] ?? false
        })
        setNotes(lastEntry.notes || "")
      } else {
        // Otherwise, default to false
        routine.checklistItems.forEach((item) => {
          initialAnswers[item] = false
        })
        setNotes("")
      }
      
      setAnswers(initialAnswers)
    }
  }, [open, routine, lastEntry])

  const handleToggleAnswer = (item: string, value: boolean) => {
    setAnswers((prev) => ({
      ...prev,
      [item]: value,
    }))
  }

  // Check if the selected date is valid for this routine
  const isDateValidForRoutine = (date: Date): boolean => {
    if (!routine) return false
    const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday
    return routine.recurrenceDaysOfWeek.includes(dayOfWeek)
  }

  const handleSave = async () => {
    if (!routine) return
    
    // Validate that the entry date is valid for this routine
    if (!isDateValidForRoutine(entryDate)) {
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
      const validDays = routine.recurrenceDaysOfWeek
        .sort()
        .map(d => dayNames[d])
        .join(", ")
      const selectedDayName = dayNames[entryDate.getDay()]
      
      toast.error(
        `This routine is only for: ${validDays}. You selected ${selectedDayName}, which is not a valid day for this routine.`,
        { duration: 5000 }
      )
      return
    }
    
    setSaving(true)
    try {
      const entry: RoutineInstance = {
        routineId: routine.id,
        entryDate: entryDate.toISOString().split("T")[0],
        answers: answers,
        notes: notes || undefined,
      }

      await onSave(entry)
      toast.success("Journal entry saved!")
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving journal entry:", error)
      toast.error("Failed to save journal entry")
    } finally {
      setSaving(false)
    }
  }

  if (!routine) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-2xl font-bold">Daily Journal</DialogTitle>
          <DialogDescription className="text-base">
            {entryDate.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          <div className="space-y-3">
            {routine.checklistItems.map((item, index) => (
              <motion.div
                key={item}
                initial={shouldAnimate ? { opacity: 0, x: -10 } : false}
                animate={shouldAnimate ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="flex items-center justify-between gap-3 p-4 rounded-lg border-2 hover:border-primary/50 hover:bg-accent/30 transition-all"
              >
                <Label className="text-base font-normal cursor-pointer flex-1">
                  {item}
                </Label>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant={answers[item] === true ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToggleAnswer(item, true)}
                    className={`h-10 px-6 text-base transition-all ${
                      answers[item] === true
                        ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md"
                        : "hover:bg-emerald-50 hover:border-emerald-300"
                    }`}
                  >
                    Yes
                  </Button>
                  <Button
                    variant={answers[item] === false ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleToggleAnswer(item, false)}
                    className={`h-10 px-6 text-base transition-all ${
                      answers[item] === false
                        ? "bg-red-500 hover:bg-red-600 text-white shadow-md"
                        : "hover:bg-red-50 hover:border-red-300"
                    }`}
                  >
                    No
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="notes" className="text-base font-medium">
              Notes (optional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any observations or notes..."
              className="min-h-[100px] text-base"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 hover:bg-gray-100"
            disabled={saving}
          >
            Close
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-md hover:shadow-lg transition-all"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Journal"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}


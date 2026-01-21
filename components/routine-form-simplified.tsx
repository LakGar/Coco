"use client"

import * as React from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Field, FieldContent, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { Trash2, Plus, X } from "lucide-react"
import { ROUTINE_PRESETS, PRESET_CATEGORIES, getAllPresets, type PresetItem } from "@/lib/routine-presets"

interface Routine {
  id?: string
  name: string
  description?: string | null
  checklistItems: string[]
  recurrenceDaysOfWeek: number[]
  startDate: string
  endDate?: string | null
  isActive?: boolean
}

interface RoutineFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  routine?: Routine | null
  teamId: string
  patientName?: string | null
  teamMembers?: Array<{
    id: string
    name: string
    email: string
  }>
  onSuccess?: () => void
  onDelete?: (routineId: string) => void
}

const WEEKDAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
]

export function RoutineForm({
  open,
  onOpenChange,
  routine,
  teamId,
  patientName,
  teamMembers = [],
  onSuccess,
  onDelete,
}: RoutineFormProps) {
  const [loading, setLoading] = React.useState(false)
  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    checklistItems: [] as string[],
    recurrenceDaysOfWeek: [0, 1, 2, 3, 4, 5, 6] as number[], // Default to daily
    startDate: "",
    endDate: "",
    isActive: true,
  })
  const [newQuestion, setNewQuestion] = React.useState("")
  const [showPresets, setShowPresets] = React.useState(false)

  const shouldReduceMotion = useReducedMotion()
  const shouldAnimate = !shouldReduceMotion

  // Reset form when routine changes or sheet opens/closes
  React.useEffect(() => {
    if (open) {
      if (routine) {
        // Edit mode
        setFormData({
          name: routine.name || "",
          description: routine.description || "",
          checklistItems: routine.checklistItems || [],
          recurrenceDaysOfWeek: routine.recurrenceDaysOfWeek || [0, 1, 2, 3, 4, 5, 6],
          startDate: routine.startDate ? new Date(routine.startDate).toISOString().split("T")[0] : "",
          endDate: routine.endDate ? new Date(routine.endDate).toISOString().split("T")[0] : "",
          isActive: routine.isActive !== undefined ? routine.isActive : true,
        })
      } else {
        // Create mode
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        setFormData({
          name: "",
          description: "",
          checklistItems: [],
          recurrenceDaysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Daily by default
          startDate: tomorrow.toISOString().split("T")[0],
          endDate: "",
          isActive: true,
        })
      }
      setNewQuestion("")
      setShowPresets(false)
    }
  }, [open, routine])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (formData.checklistItems.length === 0) {
        toast.error("Please add at least one question to the checklist")
        setLoading(false)
        return
      }

      if (formData.recurrenceDaysOfWeek.length === 0) {
        toast.error("Please select at least one day of the week")
        setLoading(false)
        return
      }

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        patientName: patientName || null,
        checklistItems: formData.checklistItems,
        recurrenceDaysOfWeek: formData.recurrenceDaysOfWeek,
        startDate: formData.startDate,
        endDate: formData.endDate || null,
      }

      const url = routine
        ? `/api/teams/${teamId}/routines/${routine.id}`
        : `/api/teams/${teamId}/routines`

      const method = routine ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save routine")
      }

      toast.success(routine ? "Routine updated successfully" : "Routine created successfully")
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Error saving routine:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save routine")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!routine?.id || !onDelete) return

    if (!confirm(`Are you sure you want to delete "${routine.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      onDelete(routine.id)
      onOpenChange(false)
    } catch (error) {
      console.error("Error deleting routine:", error)
    }
  }

  const toggleWeekday = (day: number) => {
    setFormData(prev => ({
      ...prev,
      recurrenceDaysOfWeek: prev.recurrenceDaysOfWeek.includes(day)
        ? prev.recurrenceDaysOfWeek.filter(d => d !== day)
        : [...prev.recurrenceDaysOfWeek, day].sort(),
    }))
  }

  const addQuestion = (question?: string) => {
    const questionToAdd = question || newQuestion.trim()
    if (questionToAdd && !formData.checklistItems.includes(questionToAdd)) {
      setFormData(prev => ({
        ...prev,
        checklistItems: [...prev.checklistItems, questionToAdd],
      }))
      setNewQuestion("")
      setShowPresets(false)
    }
  }

  const removeQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      checklistItems: prev.checklistItems.filter((_, i) => i !== index),
    }))
  }

  const allPresets = getAllPresets()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg flex flex-col h-full p-0">
        <SheetHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
          <SheetTitle>{routine ? "Edit Routine" : "Create Daily Journal Routine"}</SheetTitle>
          <SheetDescription>
            {routine
              ? "Update the routine details below."
              : "Create a daily journal routine with Yes/No questions. Same questions every day."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <FieldGroup>
              <Field>
                <FieldLabel>
                  Routine Name <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Daily Check-in"
                    required
                    className="text-base"
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Description (Optional)</FieldLabel>
                <FieldContent>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this routine"
                    className="text-base"
                  />
                </FieldContent>
              </Field>

              {/* Checklist Items */}
              <Field>
                <FieldLabel>
                  Journal Questions <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent>
                  <div className="space-y-3">
                    {/* Preset Suggestions */}
                    {!showPresets && formData.checklistItems.length === 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground mb-2">
                          Quick add from suggestions:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {allPresets.slice(0, 5).map((preset) => (
                            <Button
                              key={preset.id}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addQuestion(preset.label)}
                              className="text-xs h-8"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              {preset.label}
                            </Button>
                          ))}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowPresets(true)}
                            className="text-xs h-8"
                          >
                            More...
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Full Preset List */}
                    {showPresets && (
                      <motion.div
                        initial={shouldAnimate ? { opacity: 0, height: 0 } : false}
                        animate={shouldAnimate ? { opacity: 1, height: "auto" } : {}}
                        className="space-y-3 p-4 border rounded-lg bg-muted/30"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium">Add from suggestions:</p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowPresets(false)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {PRESET_CATEGORIES.map((category) => (
                          <div key={category} className="space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              {category}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {ROUTINE_PRESETS[category].map((preset) => (
                                <Button
                                  key={preset.id}
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addQuestion(preset.label)}
                                  disabled={formData.checklistItems.includes(preset.label)}
                                  className="text-xs h-8"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  {preset.label}
                                </Button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}

                    {/* Current Questions */}
                    {formData.checklistItems.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Current questions:</p>
                        {formData.checklistItems.map((item, index) => (
                          <motion.div
                            key={index}
                            initial={shouldAnimate ? { opacity: 0, x: -10 } : false}
                            animate={shouldAnimate ? { opacity: 1, x: 0 } : {}}
                            className="flex items-center gap-2 p-3 rounded-lg border bg-background"
                          >
                            <span className="flex-1 text-sm">{item}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeQuestion(index)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {/* Add Custom Question */}
                    <div className="space-y-2 pt-2 border-t">
                      <p className="text-sm font-medium">Add custom question:</p>
                      <div className="flex gap-2">
                        <Input
                          value={newQuestion}
                          onChange={(e) => setNewQuestion(e.target.value)}
                          placeholder="e.g., Did you take your medication?"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              addQuestion()
                            }
                          }}
                          className="text-base"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => addQuestion()}
                          className="bg-blue-50 hover:bg-blue-100 border-blue-200"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </FieldContent>
              </Field>

              {/* Days of Week */}
              <Field>
                <FieldLabel>
                  Which Days? <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent>
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAYS.map((day) => (
                      <Button
                        key={day.value}
                        type="button"
                        variant={formData.recurrenceDaysOfWeek.includes(day.value) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleWeekday(day.value)}
                        className={`h-10 px-4 ${
                          formData.recurrenceDaysOfWeek.includes(day.value)
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : ""
                        }`}
                      >
                        {day.label}
                      </Button>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (formData.recurrenceDaysOfWeek.length === 7) {
                        setFormData(prev => ({ ...prev, recurrenceDaysOfWeek: [] }))
                      } else {
                        setFormData(prev => ({ ...prev, recurrenceDaysOfWeek: [0, 1, 2, 3, 4, 5, 6] }))
                      }
                    }}
                    className="mt-2 text-xs"
                  >
                    {formData.recurrenceDaysOfWeek.length === 7 ? "Clear All" : "Select All"}
                  </Button>
                </FieldContent>
              </Field>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>
                    Start Date <span className="text-destructive">*</span>
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                      className="text-base"
                    />
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel>End Date (Optional)</FieldLabel>
                  <FieldContent>
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="text-base"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Leave empty for ongoing
                    </p>
                  </FieldContent>
                </Field>
              </div>

              {/* Active Status */}
              <Field>
                <FieldContent>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, isActive: checked === true })
                      }
                    />
                    <Label htmlFor="isActive" className="text-sm font-normal cursor-pointer">
                      Active (routine will prompt for journal entries)
                    </Label>
                  </div>
                </FieldContent>
              </Field>
            </FieldGroup>
          </div>

          <SheetFooter className="px-6 py-4 shrink-0 border-t gap-2">
            {routine && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
                className="mr-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {loading ? "Saving..." : routine ? "Update" : "Create"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}


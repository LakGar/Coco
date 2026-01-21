"use client"

import * as React from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Field, FieldContent, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { Trash2, Plus, X, Check } from "lucide-react"
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
          checklistItems: routine.checklistItems || [],
          recurrenceDaysOfWeek: routine.recurrenceDaysOfWeek || [0, 1, 2, 3, 4, 5, 6],
          startDate: routine.startDate ? new Date(routine.startDate).toISOString().split("T")[0] : "",
          endDate: routine.endDate ? new Date(routine.endDate).toISOString().split("T")[0] : "",
          isActive: routine.isActive !== undefined ? routine.isActive : true,
        })
      } else {
        // Create mode - default to today, daily, indefinite
        const today = new Date()
        setFormData({
          name: "",
          checklistItems: [],
          recurrenceDaysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Daily by default (all days)
          startDate: today.toISOString().split("T")[0],
          endDate: "", // No end date = indefinite
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
        description: null, // No description field
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
      if (!question) {
        setNewQuestion("")
      }
      // Don't close presets - keep them visible
    }
  }

  // Helper function to get readable day selection
  const getDaySelectionLabel = () => {
    const days = formData.recurrenceDaysOfWeek.sort()
    if (days.length === 0) return "No days selected"
    if (days.length === 7) return "Every day"
    
    // Check for weekdays (Mon-Fri = 1-5)
    if (days.length === 5 && days.every(d => [1, 2, 3, 4, 5].includes(d))) {
      return "Weekdays (Mon-Fri)"
    }
    
    // Check for weekends (Sat-Sun = 6, 0)
    if (days.length === 2 && days.includes(0) && days.includes(6)) {
      return "Weekends (Sat-Sun)"
    }
    
    // Otherwise, list the days
    const dayNames = days.map(d => WEEKDAYS.find(w => w.value === d)?.label).filter(Boolean)
    return dayNames.join(", ")
  }

  const removeQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      checklistItems: prev.checklistItems.filter((_, i) => i !== index),
    }))
  }

  const allPresets = getAllPresets()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] w-[98vw] max-h-[98vh] h-[98vh] flex flex-col p-0 m-0 translate-x-[-50%] translate-y-[-50%] left-1/2 top-1/2 rounded-lg">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
          <DialogTitle className="text-2xl">{routine ? "Edit Routine" : "Create Daily Journal Routine"}</DialogTitle>
          <DialogDescription className="text-base">
            {routine
              ? "Update the routine details below."
              : "Create a daily journal routine with Yes/No questions. Same questions every day."}
          </DialogDescription>
        </DialogHeader>

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

              {/* Checklist Items */}
              <Field>
                <FieldLabel>
                  Journal Questions <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent>
                  <div className="space-y-4">
                    {/* Preset Suggestions - Always Visible */}
                    <div className="space-y-3 p-4 border-2 rounded-lg bg-muted/20">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold">Quick Add from Suggestions:</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPresets(!showPresets)}
                          className="h-7 text-xs"
                        >
                          {showPresets ? "Show Less" : "Show All"}
                        </Button>
                      </div>
                      
                      {/* Quick Presets (Top 5) */}
                      <div className="flex flex-wrap gap-2">
                        {allPresets.slice(0, 5).map((preset) => {
                          const isAdded = formData.checklistItems.includes(preset.label)
                          return (
                            <Button
                              key={preset.id}
                              type="button"
                              variant={isAdded ? "default" : "outline"}
                              size="sm"
                              onClick={() => addQuestion(preset.label)}
                              disabled={isAdded}
                              className={`text-xs h-8 ${
                                isAdded 
                                  ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
                                  : "hover:bg-blue-50 hover:border-blue-300"
                              }`}
                            >
                              {isAdded ? (
                                <>
                                  <Check className="h-3 w-3 mr-1" />
                                  Added
                                </>
                              ) : (
                                <>
                                  <Plus className="h-3 w-3 mr-1" />
                                  {preset.label}
                                </>
                              )}
                            </Button>
                          )
                        })}
                      </div>

                      {/* Full Preset List - Expandable */}
                      {showPresets && (
                        <motion.div
                          initial={shouldAnimate ? { opacity: 0, height: 0 } : false}
                          animate={shouldAnimate ? { opacity: 1, height: "auto" } : {}}
                          className="space-y-3 pt-3 border-t"
                        >
                          {PRESET_CATEGORIES.map((category) => (
                            <div key={category} className="space-y-2">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                {category}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {ROUTINE_PRESETS[category].map((preset) => {
                                  const isAdded = formData.checklistItems.includes(preset.label)
                                  return (
                                    <Button
                                      key={preset.id}
                                      type="button"
                                      variant={isAdded ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => addQuestion(preset.label)}
                                      disabled={isAdded}
                                      className={`text-xs h-8 ${
                                        isAdded 
                                          ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
                                          : "hover:bg-blue-50 hover:border-blue-300"
                                      }`}
                                    >
                                      {isAdded ? (
                                        <>
                                          <Check className="h-3 w-3 mr-1" />
                                          Added
                                        </>
                                      ) : (
                                        <>
                                          <Plus className="h-3 w-3 mr-1" />
                                          {preset.label}
                                        </>
                                      )}
                                    </Button>
                                  )
                                })}
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </div>

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

                    {/* Add Custom Questions - Bulk Input */}
                    <div className="space-y-2 pt-2 border-t">
                      <p className="text-sm font-medium">Add custom questions:</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        Enter one question per line, or type and press Enter to add individually
                      </p>
                      <div className="space-y-2">
                        <textarea
                          value={newQuestion}
                          onChange={(e) => setNewQuestion(e.target.value)}
                          placeholder="Enter questions, one per line:&#10;Did you take your medication?&#10;Did you exercise?&#10;Did you feel good today?"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault()
                              // If it's a single line, add it
                              if (newQuestion.trim().split('\n').length === 1) {
                                addQuestion()
                              } else {
                                // If multiple lines, add all of them
                                const questions = newQuestion
                                  .split('\n')
                                  .map(q => q.trim())
                                  .filter(q => q.length > 0 && !formData.checklistItems.includes(q))
                                
                                if (questions.length > 0) {
                                  setFormData(prev => ({
                                    ...prev,
                                    checklistItems: [...prev.checklistItems, ...questions],
                                  }))
                                  setNewQuestion("")
                                }
                              }
                            }
                          }}
                          className="w-full min-h-[100px] rounded-md border-2 border-input bg-transparent px-4 py-3 text-base shadow-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
                          rows={4}
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              // Add all lines as separate questions
                              const questions = newQuestion
                                .split('\n')
                                .map(q => q.trim())
                                .filter(q => q.length > 0 && !formData.checklistItems.includes(q))
                              
                              if (questions.length > 0) {
                                setFormData(prev => ({
                                  ...prev,
                                  checklistItems: [...prev.checklistItems, ...questions],
                                }))
                                setNewQuestion("")
                                toast.success(`Added ${questions.length} question${questions.length > 1 ? 's' : ''}`)
                              } else if (newQuestion.trim()) {
                                // Single question fallback
                                addQuestion()
                              }
                            }}
                            className="bg-blue-50 hover:bg-blue-100 border-blue-200 flex-1"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add All Questions
                          </Button>
                          {newQuestion.trim() && (
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => setNewQuestion("")}
                              className="h-10"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
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
                  <div className="space-y-3">
                    {/* Selection Summary */}
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <p className="text-sm font-medium text-blue-900">
                        Selected: <span className="font-semibold">{getDaySelectionLabel()}</span>
                      </p>
                    </div>
                    
                    {/* Day Buttons */}
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
                    
                    {/* Quick Selection Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, recurrenceDaysOfWeek: [0, 1, 2, 3, 4, 5, 6] }))}
                        className="h-9 text-xs"
                      >
                        Every Day
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, recurrenceDaysOfWeek: [1, 2, 3, 4, 5] }))}
                        className="h-9 text-xs"
                      >
                        Weekdays
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, recurrenceDaysOfWeek: [0, 6] }))}
                        className="h-9 text-xs"
                      >
                        Weekends
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, recurrenceDaysOfWeek: [] }))}
                        className="h-9 text-xs text-muted-foreground"
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>
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
                      Leave empty to run indefinitely (recommended)
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

          <div className="px-6 py-4 shrink-0 border-t flex items-center justify-between gap-2">
            <div>
              {routine && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="h-11 px-6"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-emerald-500 hover:bg-emerald-600 text-white h-11 px-6"
              >
                {loading ? "Saving..." : routine ? "Update" : "Create Routine"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}


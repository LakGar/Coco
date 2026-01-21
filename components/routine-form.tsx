"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Field, FieldContent, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Trash2 } from "lucide-react"

interface Routine {
  id?: string
  name: string
  description?: string | null
  patientName?: string | null
  assignedToId?: string | null
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  recurrenceType: "DAILY" | "WEEKLY" | "MONTHLY" | "CUSTOM_WEEKDAYS" | "SPECIFIC_DATES"
  recurrenceDaysOfWeek?: number[]
  recurrenceDayOfMonth?: number | null
  recurrenceSpecificDates?: string[]
  startDate: string
  endDate?: string | null
  timeOfDay?: string | null
  autoGenerateTasks?: boolean
  generateDaysAhead?: number
  hasJournalEntry?: boolean
  journalPrompts?: string[]
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
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
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
    patientName: patientName || "",
    assignedToId: "",
    priority: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
    recurrenceType: "DAILY" as "DAILY" | "WEEKLY" | "MONTHLY" | "CUSTOM_WEEKDAYS" | "SPECIFIC_DATES",
    recurrenceDaysOfWeek: [] as number[],
    recurrenceDayOfMonth: null as number | null,
    recurrenceSpecificDates: [] as string[],
    startDate: "",
    endDate: "",
    timeOfDay: "",
    autoGenerateTasks: true,
    generateDaysAhead: 7,
    hasJournalEntry: false,
    journalPrompts: [] as string[],
    isActive: true,
  })

  const [newPrompt, setNewPrompt] = React.useState("")

  // Reset form when routine changes or sheet opens/closes
  React.useEffect(() => {
    if (open) {
      if (routine) {
        // Edit mode
        setFormData({
          name: routine.name || "",
          description: routine.description || "",
          patientName: routine.patientName || patientName || "",
          assignedToId: routine.assignedToId || "",
          priority: routine.priority || "MEDIUM",
          recurrenceType: routine.recurrenceType || "DAILY",
          recurrenceDaysOfWeek: routine.recurrenceDaysOfWeek || [],
          recurrenceDayOfMonth: routine.recurrenceDayOfMonth || null,
          recurrenceSpecificDates: routine.recurrenceSpecificDates || [],
          startDate: routine.startDate ? new Date(routine.startDate).toISOString().split("T")[0] : "",
          endDate: routine.endDate ? new Date(routine.endDate).toISOString().split("T")[0] : "",
          timeOfDay: routine.timeOfDay || "",
          autoGenerateTasks: routine.autoGenerateTasks !== undefined ? routine.autoGenerateTasks : true,
          generateDaysAhead: routine.generateDaysAhead || 7,
          hasJournalEntry: routine.hasJournalEntry || false,
          journalPrompts: routine.journalPrompts || [],
          isActive: routine.isActive !== undefined ? routine.isActive : true,
        })
      } else {
        // Create mode
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        setFormData({
          name: "",
          description: "",
          patientName: patientName || "",
          assignedToId: "",
          priority: "MEDIUM",
          recurrenceType: "DAILY",
          recurrenceDaysOfWeek: [],
          recurrenceDayOfMonth: null,
          recurrenceSpecificDates: [],
          startDate: tomorrow.toISOString().split("T")[0],
          endDate: "",
          timeOfDay: "",
          autoGenerateTasks: true,
          generateDaysAhead: 7,
          hasJournalEntry: false,
          journalPrompts: [],
          isActive: true,
        })
      }
      setNewPrompt("")
    }
  }, [open, routine, patientName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        patientName: formData.patientName.trim() || null,
        assignedToId: formData.assignedToId || null,
        priority: formData.priority,
        recurrenceType: formData.recurrenceType,
        recurrenceDaysOfWeek: formData.recurrenceDaysOfWeek,
        recurrenceDayOfMonth: formData.recurrenceDayOfMonth,
        recurrenceSpecificDates: formData.recurrenceSpecificDates,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        timeOfDay: formData.timeOfDay || null,
        autoGenerateTasks: formData.autoGenerateTasks,
        generateDaysAhead: formData.generateDaysAhead,
        hasJournalEntry: formData.hasJournalEntry,
        journalPrompts: formData.journalPrompts,
        isActive: formData.isActive,
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
        : [...prev.recurrenceDaysOfWeek, day],
    }))
  }

  const addJournalPrompt = () => {
    if (newPrompt.trim()) {
      setFormData(prev => ({
        ...prev,
        journalPrompts: [...prev.journalPrompts, newPrompt.trim()],
      }))
      setNewPrompt("")
    }
  }

  const removeJournalPrompt = (index: number) => {
    setFormData(prev => ({
      ...prev,
      journalPrompts: prev.journalPrompts.filter((_, i) => i !== index),
    }))
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg flex flex-col h-full p-0">
        <SheetHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
          <SheetTitle>{routine ? "Edit Routine" : "Create New Routine"}</SheetTitle>
          <SheetDescription>
            {routine
              ? "Update the routine details below."
              : "Create a recurring routine with optional journal tracking."}
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
                  placeholder="Enter routine name"
                  required
                />
              </FieldContent>
            </Field>

            {/* <Field>
              <FieldLabel>Description</FieldLabel>
              <FieldContent>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enter routine description"
                  className="min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </FieldContent>
            </Field> */}

            <Field>
              <FieldLabel>Patient Name</FieldLabel>
              <FieldContent>
                <Input
                  value={formData.patientName}
                  onChange={(e) =>
                    setFormData({ ...formData, patientName: e.target.value })
                  }
                  placeholder="Patient name (optional)"
                />
              </FieldContent>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Priority</FieldLabel>
                <FieldContent>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: "LOW" | "MEDIUM" | "HIGH" | "URGENT") =>
                      setFormData({ ...formData, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Assign To (Optional)</FieldLabel>
                <FieldContent>
                  <Select
                    value={formData.assignedToId || "unassigned"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, assignedToId: value === "unassigned" ? "" : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
            </div>

            <Field>
              <FieldLabel>Recurrence Type <span className="text-destructive">*</span></FieldLabel>
              <FieldContent>
                <Select
                  value={formData.recurrenceType}
                  onValueChange={(value: "DAILY" | "WEEKLY" | "MONTHLY" | "CUSTOM_WEEKDAYS" | "SPECIFIC_DATES") =>
                    setFormData({ ...formData, recurrenceType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">Daily</SelectItem>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="CUSTOM_WEEKDAYS">Custom Weekdays</SelectItem>
                    <SelectItem value="SPECIFIC_DATES">Specific Dates</SelectItem>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>

            {(formData.recurrenceType === "WEEKLY" || formData.recurrenceType === "CUSTOM_WEEKDAYS") && (
              <Field>
                <FieldLabel>Days of Week <span className="text-destructive">*</span></FieldLabel>
                <FieldContent>
                  <div className="grid grid-cols-2 gap-2">
                    {WEEKDAYS.map((day) => (
                      <div key={day.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`day-${day.value}`}
                          checked={formData.recurrenceDaysOfWeek.includes(day.value)}
                          onCheckedChange={() => toggleWeekday(day.value)}
                        />
                        <Label
                          htmlFor={`day-${day.value}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {day.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </FieldContent>
              </Field>
            )}

            {formData.recurrenceType === "MONTHLY" && (
              <Field>
                <FieldLabel>Day of Month <span className="text-destructive">*</span></FieldLabel>
                <FieldContent>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.recurrenceDayOfMonth || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, recurrenceDayOfMonth: parseInt(e.target.value) || null })
                    }
                    placeholder="1-31"
                  />
                </FieldContent>
              </Field>
            )}

            {formData.recurrenceType === "SPECIFIC_DATES" && (
              <Field>
                <FieldLabel>Specific Dates <span className="text-destructive">*</span></FieldLabel>
                <FieldContent>
                  <div className="space-y-2">
                    {formData.recurrenceSpecificDates.map((date, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          type="date"
                          value={date.split("T")[0]}
                          onChange={(e) => {
                            const newDates = [...formData.recurrenceSpecificDates]
                            newDates[index] = new Date(e.target.value).toISOString()
                            setFormData({ ...formData, recurrenceSpecificDates: newDates })
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              recurrenceSpecificDates: formData.recurrenceSpecificDates.filter((_, i) => i !== index),
                            })
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          recurrenceSpecificDates: [...formData.recurrenceSpecificDates, new Date().toISOString()],
                        })
                      }}
                    >
                      Add Date
                    </Button>
                  </div>
                </FieldContent>
              </Field>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Start Date <span className="text-destructive">*</span></FieldLabel>
                <FieldContent>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    required
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>End Date (Optional)</FieldLabel>
                <FieldContent>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    min={formData.startDate}
                  />
                </FieldContent>
              </Field>
            </div>

            <Field>
              <FieldLabel>Time of Day (Optional)</FieldLabel>
              <FieldContent>
                <Input
                  type="time"
                  value={formData.timeOfDay}
                  onChange={(e) =>
                    setFormData({ ...formData, timeOfDay: e.target.value })
                  }
                />
              </FieldContent>
            </Field>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="autoGenerateTasks"
                checked={formData.autoGenerateTasks}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, autoGenerateTasks: checked as boolean })
                }
              />
              <Label htmlFor="autoGenerateTasks" className="text-sm font-normal cursor-pointer">
                Automatically generate tasks when routine occurs
              </Label>
            </div>

            {formData.autoGenerateTasks && (
              <Field>
                <FieldLabel>Generate Tasks Days Ahead</FieldLabel>
                <FieldContent>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.generateDaysAhead}
                    onChange={(e) =>
                      setFormData({ ...formData, generateDaysAhead: parseInt(e.target.value) || 7 })
                    }
                  />
                </FieldContent>
              </Field>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasJournalEntry"
                checked={formData.hasJournalEntry}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, hasJournalEntry: checked as boolean })
                }
              />
              <Label htmlFor="hasJournalEntry" className="text-sm font-normal cursor-pointer">
                Enable journal entry tracking
              </Label>
            </div>

            {formData.hasJournalEntry && (
              <Field>
                <FieldLabel>Journal Prompts (Optional)</FieldLabel>
                <FieldContent>
                  <div className="space-y-2">
                    {formData.journalPrompts.map((prompt, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={prompt}
                          onChange={(e) => {
                            const newPrompts = [...formData.journalPrompts]
                            newPrompts[index] = e.target.value
                            setFormData({ ...formData, journalPrompts: newPrompts })
                          }}
                          placeholder="Prompt question"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeJournalPrompt(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input
                        value={newPrompt}
                        onChange={(e) => setNewPrompt(e.target.value)}
                        placeholder="Add a journal prompt"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            addJournalPrompt()
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addJournalPrompt}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </FieldContent>
              </Field>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked as boolean })
                }
              />
              <Label htmlFor="isActive" className="text-sm font-normal cursor-pointer">
                Routine is active
              </Label>
            </div>
          </FieldGroup>
          </div>

          <SheetFooter className="px-6 py-4 border-t shrink-0 bg-background">
            {routine && onDelete ? (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : routine ? "Update Routine" : "Create Routine"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}


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
import { toast } from "sonner"
import { Trash2 } from "lucide-react"

interface Task {
  id?: string
  name: string
  description?: string | null
  patientName?: string | null
  assignedToId?: string | null
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  status: "TODO" | "DONE" | "CANCELLED" | "DUE"
  dueDate?: string | null
  createdBy?: {
    id: string
    name: string | null
  }
}

interface TaskFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task | null
  teamId: string
  patientName?: string | null
  teamMembers?: Array<{
    id: string
    name: string
    email: string
  }>
  onSuccess?: () => void
  onDelete?: (taskId: string) => void
}

export function TaskForm({
  open,
  onOpenChange,
  task,
  teamId,
  patientName,
  teamMembers = [],
  onSuccess,
  onDelete,
}: TaskFormProps) {
  const [loading, setLoading] = React.useState(false)
  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    patientName: patientName || "",
    assignedToId: "",
    priority: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
    status: "TODO" as "TODO" | "DONE" | "CANCELLED" | "DUE",
    dueDate: "",
    dueTime: "",
  })

  // Reset form when task changes or sheet opens/closes
  React.useEffect(() => {
    if (open) {
      if (task) {
        // Edit mode
        const dueDate = task.dueDate ? new Date(task.dueDate) : null
        setFormData({
          name: task.name || "",
          description: task.description || "",
          patientName: task.patientName || patientName || "",
          assignedToId: task.assignedToId || "",
          priority: task.priority || "MEDIUM",
          status: task.status || "TODO",
          dueDate: dueDate ? dueDate.toISOString().split("T")[0] : "",
          dueTime: dueDate ? dueDate.toTimeString().slice(0, 5) : "",
        })
      } else {
        // Create mode
        setFormData({
          name: "",
          description: "",
          patientName: patientName || "",
          assignedToId: "",
          priority: "MEDIUM",
          status: "TODO",
          dueDate: "",
          dueTime: "",
        })
      }
    }
  }, [open, task, patientName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Combine date and time if both are provided
      let dueDate: string | null = null
      if (formData.dueDate) {
        if (formData.dueTime) {
          dueDate = new Date(`${formData.dueDate}T${formData.dueTime}`).toISOString()
        } else {
          dueDate = new Date(`${formData.dueDate}T00:00:00`).toISOString()
        }
      }

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        patientName: formData.patientName.trim() || null,
        assignedToId: formData.assignedToId || null,
        priority: formData.priority,
        status: formData.status,
        dueDate: dueDate,
      }

      const url = task
        ? `/api/teams/${teamId}/tasks/${task.id}`
        : `/api/teams/${teamId}/tasks`

      const method = task ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save task")
      }

      toast.success(task ? "Task updated successfully" : "Task created successfully")
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Error saving task:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save task")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!task?.id || !onDelete) return

    if (!confirm(`Are you sure you want to delete "${task.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      onDelete(task.id)
      onOpenChange(false)
    } catch (error) {
      console.error("Error deleting task:", error)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg flex flex-col h-full p-0">
        <SheetHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
          <SheetTitle>{task ? "Edit Task" : "Create New Task"}</SheetTitle>
          <SheetDescription>
            {task
              ? "Update the task details below."
              : "Fill in the details to create a new task for your care team."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4">
          <FieldGroup>
            <Field>
              <FieldLabel>
                Task Name <span className="text-destructive">*</span>
              </FieldLabel>
              <FieldContent>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter task name"
                  required
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Description</FieldLabel>
              <FieldContent>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enter task description"
                  className="min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </FieldContent>
            </Field>

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
                <FieldLabel>Status</FieldLabel>
                <FieldContent>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "TODO" | "DONE" | "CANCELLED" | "DUE") =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODO">To Do</SelectItem>
                      <SelectItem value="DUE">Due</SelectItem>
                      <SelectItem value="DONE">Done</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
            </div>

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

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Due Date (Optional)</FieldLabel>
                <FieldContent>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>Due Time (Optional)</FieldLabel>
                <FieldContent>
                  <Input
                    type="time"
                    value={formData.dueTime}
                    onChange={(e) =>
                      setFormData({ ...formData, dueTime: e.target.value })
                    }
                    disabled={!formData.dueDate}
                  />
                </FieldContent>
              </Field>
            </div>
          </FieldGroup>
          </div>

          <SheetFooter className="px-6 py-4 border-t shrink-0 bg-background">
            {task && onDelete ? (
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
              {loading ? "Saving..." : task ? "Update Task" : "Create Task"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}


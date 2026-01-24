import { Pill, Calendar, Users, Heart } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type TaskType = "MEDICATION" | "APPOINTMENTS" | "SOCIAL" | "HEALTH_PERSONAL" | null

export interface TaskTypeOption {
  value: TaskType
  label: string
  icon: LucideIcon
  color: string
}

export const taskTypes: TaskTypeOption[] = [
  {
    value: "MEDICATION",
    label: "Medication",
    icon: Pill,
    color: "text-blue-500",
  },
  {
    value: "APPOINTMENTS",
    label: "Appointments",
    icon: Calendar,
    color: "text-purple-500",
  },
  {
    value: "SOCIAL",
    label: "Social",
    icon: Users,
    color: "text-green-500",
  },
  {
    value: "HEALTH_PERSONAL",
    label: "Health Personal",
    icon: Heart,
    color: "text-red-500",
  },
]

export function getTaskTypeOption(type: TaskType): TaskTypeOption | null {
  if (!type) return null
  return taskTypes.find((t) => t.value === type) || null
}

export function getTaskTypeIcon(type: TaskType): LucideIcon | null {
  const option = getTaskTypeOption(type)
  return option ? option.icon : null
}

export function getTaskTypeColor(type: TaskType): string {
  const option = getTaskTypeOption(type)
  return option ? option.color : "text-muted-foreground"
}

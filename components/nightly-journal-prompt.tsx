"use client"

import * as React from "react"
import { useTeamStore } from "@/store/use-team-store"
import { NightlyJournalModal } from "./nightly-journal-modal"
import { useUser } from "@clerk/nextjs"

interface Routine {
  id: string
  name: string
  checklistItems: string[]
  recurrenceDaysOfWeek: number[]
  startDate: string
  endDate: string | null
  isActive: boolean
}

interface RoutineInstance {
  id?: string
  routineId: string
  entryDate: string
  answers?: Record<string, boolean>
  notes?: string
}

export function NightlyJournalPrompt() {
  const { activeTeam } = useTeamStore()
  const { user } = useUser()
  const [showModal, setShowModal] = React.useState(false)
  const [routine, setRoutine] = React.useState<Routine | null>(null)
  const [lastEntry, setLastEntry] = React.useState<RoutineInstance | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [hasCheckedToday, setHasCheckedToday] = React.useState(false)

  // Check if it's after 6 PM and if we should show the modal
  React.useEffect(() => {
    if (!activeTeam || !user || hasCheckedToday) return

    const checkTimeAndRoutines = async () => {
      const now = new Date()
      const hour = now.getHours()

      // Only show after 6 PM (18:00)
      if (hour < 18) {
        setLoading(false)
        return
      }

      try {
        // Fetch active routines for this team
        const response = await fetch(`/api/teams/${activeTeam.id}/routines`)
        if (!response.ok) {
          setLoading(false)
          return
        }

        const data = await response.json()
        const allRoutines: Routine[] = data.routines || []

        // Filter routines that should be active today
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const dayOfWeek = today.getDay()

        const activeRoutines = allRoutines.filter((routine) => {
          if (!routine.isActive) return false

          // Check if routine is within date range
          const startDate = new Date(routine.startDate)
          startDate.setHours(0, 0, 0, 0)
          if (today < startDate) return false

          if (routine.endDate) {
            const endDate = new Date(routine.endDate)
            endDate.setHours(23, 59, 59, 999)
            if (today > endDate) return false
          }

          // Check if today is in the recurrence days
          return routine.recurrenceDaysOfWeek.includes(dayOfWeek)
        })

        // Check if entries already exist for today
        const todayStr = today.toISOString().split("T")[0]
        const routinesNeedingEntry: Routine[] = []

        for (const routine of activeRoutines) {
          const instancesResponse = await fetch(
            `/api/teams/${activeTeam.id}/routines/${routine.id}/instances?startDate=${todayStr}&endDate=${todayStr}`
          )
          if (instancesResponse.ok) {
            const instancesData = await instancesResponse.json()
            const hasEntry = instancesData.instances && instancesData.instances.length > 0
            if (!hasEntry) {
              routinesNeedingEntry.push(routine)
            }
          } else {
            // If we can't check, assume it needs an entry
            routinesNeedingEntry.push(routine)
          }
        }

        // Add a small delay to avoid race conditions
        await new Promise(resolve => setTimeout(resolve, 100))

        // Only show the first routine that needs an entry (one at a time)
        if (routinesNeedingEntry.length > 0) {
          const firstRoutine = routinesNeedingEntry[0]
          setRoutine(firstRoutine)
          
          // Try to fetch last entry for auto-fill
          try {
            const lastEntryResponse = await fetch(
              `/api/teams/${activeTeam.id}/routines/${firstRoutine.id}/instances?limit=1`
            )
            if (lastEntryResponse.ok) {
              const lastEntryData = await lastEntryResponse.json()
              if (lastEntryData.instances && lastEntryData.instances.length > 0) {
                setLastEntry(lastEntryData.instances[0])
              }
            }
          } catch (error) {
            console.error("Error fetching last entry:", error)
          }
          
          setShowModal(true)
        }
      } catch (error) {
        console.error("Error checking routines:", error)
      } finally {
        setLoading(false)
        setHasCheckedToday(true)
      }
    }

    // Small delay to ensure page is loaded
    const timer = setTimeout(checkTimeAndRoutines, 1000)
    return () => clearTimeout(timer)
  }, [activeTeam, user, hasCheckedToday])

  const handleSave = async (entry: RoutineInstance) => {
    if (!activeTeam) return

    try {
      const response = await fetch(
        `/api/teams/${activeTeam.id}/routines/${entry.routineId}/instances`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entryDate: entry.entryDate,
            answers: entry.answers,
            notes: entry.notes,
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to save entry for routine ${entry.routineId}`)
      }

      // Refresh state
      setShowModal(false)
      setHasCheckedToday(false) // Allow checking again if needed
    } catch (error) {
      console.error("Error saving journal entry:", error)
      throw error
    }
  }

  if (loading || !showModal || !routine) {
    return null
  }

  return (
    <NightlyJournalModal
      open={showModal}
      onOpenChange={setShowModal}
      routine={routine}
      lastEntry={lastEntry}
      onSave={handleSave}
    />
  )
}


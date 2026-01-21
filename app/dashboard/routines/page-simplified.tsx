"use client"

import * as React from "react"
import { motion, useReducedMotion } from "framer-motion"
import { useTeamStore } from "@/store/use-team-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { RoutineForm } from "@/components/routine-form"
import { NightlyJournalModal } from "@/components/nightly-journal-modal"
import { Plus, Search, Repeat, BookOpen, PenTool, Calendar } from "lucide-react"
import { toast } from "sonner"

interface Routine {
  id: string
  name: string
  description?: string | null
  checklistItems: string[]
  recurrenceDaysOfWeek: number[]
  startDate: string
  endDate?: string | null
  isActive: boolean
  createdAt: string
  instances?: Array<{
    id: string
    entryDate: string
    answers?: Record<string, boolean>
    notes?: string | null
    filledOutAt?: string
  }>
  _count?: {
    instances: number
  }
}

interface TeamData {
  team: {
    id: string
    name: string
  }
  members: Array<{
    id: string
    name: string
    email: string
  }>
  currentUser: {
    id: string
    isAdmin: boolean
    accessLevel: string
  }
}

export default function RoutinesPage() {
  const { activeTeam } = useTeamStore()
  const [routines, setRoutines] = React.useState<Routine[]>([])
  const [teamData, setTeamData] = React.useState<TeamData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [formOpen, setFormOpen] = React.useState(false)
  const [editingRoutine, setEditingRoutine] = React.useState<Routine | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [activeFilter, setActiveFilter] = React.useState<"all" | "active" | "inactive">("all")
  const [journalModalOpen, setJournalModalOpen] = React.useState(false)
  const [selectedRoutine, setSelectedRoutine] = React.useState<Routine | null>(null)
  const [lastEntry, setLastEntry] = React.useState<any>(null)

  const shouldReduceMotion = useReducedMotion()
  const shouldAnimate = !shouldReduceMotion

  // Fetch routines
  React.useEffect(() => {
    const fetchData = async () => {
      if (!activeTeam) {
        setError("No active team selected")
        setLoading(false)
        return
      }

      try {
        const teamResponse = await fetch(`/api/teams/${activeTeam.id}/members`)
        if (teamResponse.ok) {
          const teamData = await teamResponse.json()
          setTeamData(teamData)
        }

        const routinesResponse = await fetch(`/api/teams/${activeTeam.id}/routines`)
        if (!routinesResponse.ok) {
          throw new Error("Failed to load routines")
        }
        const data = await routinesResponse.json()
        setRoutines(data.routines || [])
      } catch (error) {
        console.error("Error fetching data:", error)
        setError("Failed to load routines")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [activeTeam])

  const handleFormSuccess = () => {
    if (!activeTeam) return
    fetch(`/api/teams/${activeTeam.id}/routines`)
      .then((res) => res.json())
      .then((data) => setRoutines(data.routines || []))
      .catch(console.error)
  }

  const handleCreateRoutine = () => {
    setEditingRoutine(null)
    setFormOpen(true)
  }

  const handleEditRoutine = (routine: Routine) => {
    setEditingRoutine(routine)
    setFormOpen(true)
  }

  const handleFillJournal = async (routine: Routine) => {
    if (!activeTeam) return

    try {
      const lastEntryResponse = await fetch(
        `/api/teams/${activeTeam.id}/routines/${routine.id}/instances?limit=1`
      )
      if (lastEntryResponse.ok) {
        const lastEntryData = await lastEntryResponse.json()
        setLastEntry(lastEntryData.instances?.[0] || null)
      }
    } catch (error) {
      console.error("Error fetching last entry:", error)
      setLastEntry(null)
    }

    setSelectedRoutine(routine)
    setJournalModalOpen(true)
  }

  const handleSaveJournal = async (entry: { routineId: string; entryDate: string; answers?: Record<string, boolean>; notes?: string }) => {
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
        throw new Error("Failed to save journal entry")
      }

      toast.success("Journal entry saved!")
      setJournalModalOpen(false)
      handleFormSuccess()
    } catch (error) {
      console.error("Error saving journal entry:", error)
      throw error
    }
  }

  const filteredRoutines = React.useMemo(() => {
    return routines.filter((routine) => {
      const matchesSearch =
        !searchQuery ||
        routine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        routine.description?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesActive =
        activeFilter === "all" ||
        (activeFilter === "active" && routine.isActive) ||
        (activeFilter === "inactive" && !routine.isActive)

      return matchesSearch && matchesActive
    })
  }, [routines, searchQuery, activeFilter])

  const canCreateRoutines = teamData?.currentUser.accessLevel === "FULL" || teamData?.currentUser.isAdmin

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Spinner className="mx-auto mb-4 text-primary" size="lg" />
          <p className="text-muted-foreground">Loading routines...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-8 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Error</h2>
          <p className="text-muted-foreground">{error}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden w-full">
      {/* Header */}
      <div className="shrink-0 border-b bg-background w-full overflow-hidden sticky top-0 z-50">
        <div className="px-4 py-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl md:text-3xl font-bold truncate">Daily Journal</h1>
              <p className="text-sm md:text-md text-muted-foreground truncate">
                {filteredRoutines.length} {filteredRoutines.length === 1 ? "routine" : "routines"}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {canCreateRoutines && (
                <Button 
                  onClick={handleCreateRoutine} 
                  size="default" 
                  className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="md:mr-2 h-4 w-4" />
                  <span className="hidden md:inline">Create Routine</span>
                </Button>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-3 w-full">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search routines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-12 h-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant={activeFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("all")}
                className="h-10"
              >
                All
              </Button>
              <Button
                variant={activeFilter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("active")}
                className="h-10"
              >
                Active
              </Button>
              <Button
                variant={activeFilter === "inactive" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("inactive")}
                className="h-10"
              >
                Inactive
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {filteredRoutines.length === 0 ? (
          <motion.div
            initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-center h-full p-4"
          >
            <Card className="p-12 text-center max-w-md">
              <motion.div
                initial={shouldAnimate ? { scale: 0.8 } : false}
                animate={shouldAnimate ? { scale: 1 } : {}}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              </motion.div>
              <h3 className="text-xl font-semibold mb-2">
                {routines.length === 0 ? "No routines yet" : "No routines found"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {routines.length === 0
                  ? "Create a daily journal routine to track daily activities and observations. Perfect for tracking meals, mood, activities, and more."
                  : "Try adjusting your search or filters to see more routines."}
              </p>
              {canCreateRoutines && (
                <Button 
                  onClick={handleCreateRoutine}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Create Your First Routine
                </Button>
              )}
            </Card>
          </motion.div>
        ) : (
          <div className="h-full overflow-auto w-full p-4">
            <div className="space-y-4 max-w-4xl mx-auto">
              {filteredRoutines.map((routine, index) => {
                const insights = routine._count || { instances: 0 }
                const lastEntry = routine.instances?.[0]
                
                return (
                  <motion.div
                    key={routine.id}
                    initial={shouldAnimate ? { opacity: 0, y: 10, scale: 0.98 } : false}
                    animate={shouldAnimate ? { opacity: 1, y: 0, scale: 1 } : {}}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.05,
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                    }}
                    whileHover={shouldAnimate ? { y: -2, scale: 1.01 } : {}}
                  >
                    <Card className="group hover:shadow-lg transition-all rounded-lg border-2">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0" onClick={() => handleEditRoutine(routine)}>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-xl font-semibold">{routine.name}</h3>
                              {!routine.isActive && (
                                <Badge variant="outline" className="text-xs">
                                  Inactive
                                </Badge>
                              )}
                            </div>
                            
                            {routine.description && (
                              <p className="text-sm text-muted-foreground mb-3">{routine.description}</p>
                            )}

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <Repeat className="h-4 w-4" />
                                <span>{routine.checklistItems.length} questions</span>
                              </div>
                              {insights.instances > 0 && (
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="h-4 w-4" />
                                  <span>{insights.instances} entries</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 shrink-0">
                            <Button
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditRoutine(routine)
                              }}
                              className="h-11 px-4"
                            >
                              Edit
                            </Button>
                            {routine.isActive && (
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleFillJournal(routine)
                                }}
                                className="h-11 px-6 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
                              >
                                <PenTool className="h-4 w-4 mr-2" />
                                Fill Journal
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Routine Form */}
      {activeTeam && (
        <RoutineForm
          open={formOpen}
          onOpenChange={setFormOpen}
          routine={editingRoutine}
          teamId={activeTeam.id}
          patientName={activeTeam.patientName || null}
          teamMembers={teamData?.members || []}
          onSuccess={handleFormSuccess}
          onDelete={() => {}}
        />
      )}

      {/* Journal Modal */}
      {selectedRoutine && (
        <NightlyJournalModal
          open={journalModalOpen}
          onOpenChange={setJournalModalOpen}
          routine={selectedRoutine}
          lastEntry={lastEntry}
          onSave={handleSaveJournal}
        />
      )}
    </div>
  )
}


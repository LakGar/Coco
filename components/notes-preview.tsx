"use client"

import * as React from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Plus, ArrowRight, Edit, Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTeamStore } from "@/store/use-team-store"
import { useDataStore } from "@/store/use-data-store"
import { format } from "date-fns"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Note {
  id: string
  title: string
  content: string
  updatedAt: string
  createdBy: {
    id: string
    name: string | null
    firstName: string | null
    lastName: string | null
  }
}

interface NotesPreviewProps {
  onAddNote?: () => void
}

export function NotesPreview({ onAddNote }: NotesPreviewProps) {
  const router = useRouter()
  const { activeTeam } = useTeamStore()
  const { notes: notesFromStore, fetchNotes, fetchTeamData } = useDataStore()
  const shouldReduceMotion = useReducedMotion()
  const shouldAnimate = !shouldReduceMotion
  
  // Get notes from store
  const allNotes = React.useMemo(() => {
    return activeTeam ? (notesFromStore[activeTeam.id] || []) : []
  }, [notesFromStore, activeTeam])
  
  const notes = React.useMemo(() => {
    return allNotes.slice(0, 3) // Show only 3 most recent
  }, [allNotes])
  
  const [loading, setLoading] = React.useState(true)
  const [formOpen, setFormOpen] = React.useState(false)
  const [teamData, setTeamData] = React.useState<any>(null)
  
  // Form state
  const [title, setTitle] = React.useState("")
  const [content, setContent] = React.useState("")
  const [selectedEditorIds, setSelectedEditorIds] = React.useState<string[]>([])
  const [selectedViewerIds, setSelectedViewerIds] = React.useState<string[]>([])

  // Fetch notes and team data
  React.useEffect(() => {
    const fetchData = async () => {
      if (!activeTeam) {
        setLoading(false)
        return
      }

      try {
        // Fetch team data for permissions
        const teamDataResult = await fetchTeamData(activeTeam.id)
        if (teamDataResult) {
          setTeamData(teamDataResult)
        }
        
        // Fetch notes
        await fetchNotes(activeTeam.id)
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Error fetching data:", error)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [activeTeam, fetchNotes, fetchTeamData])

  const handleAddNote = () => {
    if (onAddNote) {
      onAddNote()
      return
    }
    
    // Check permissions
    if (!teamData || teamData.currentUser.accessLevel !== "FULL") {
      toast.error("Full access required to create notes")
      router.push("/dashboard/notes")
      return
    }
    
    // Open modal
    setTitle("")
    setContent("")
    setSelectedEditorIds([])
    setSelectedViewerIds([])
    setFormOpen(true)
  }

  const handleSaveNote = async () => {
    if (!activeTeam || !title.trim() || !content.trim()) {
      toast.error("Title and content are required")
      return
    }

    try {
      const response = await fetch(`/api/teams/${activeTeam.id}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          editorIds: selectedEditorIds,
          viewerIds: selectedViewerIds,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create note")
      }

      await response.json() // Note created successfully
      
      toast.success("Note created successfully")
      setFormOpen(false)
      setTitle("")
      setContent("")
      setSelectedEditorIds([])
      setSelectedViewerIds([])

      // Refresh notes to get the full note with permissions
      if (activeTeam) {
        await fetchNotes(activeTeam.id, true) // Force refresh
      }
    } catch (error) {
      console.error("Error creating note:", error)
      toast.error("Failed to create note")
    }
  }

  const getAuthorName = (user: Note["createdBy"]) => {
    if (user.name) return user.name
    if (user.firstName || user.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim()
    }
    return "Unknown"
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
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Spinner className="h-5 w-5" />
              </div>
            ) : notes.length === 0 ? (
              <>
                <div className="text-sm text-muted-foreground text-center py-6">
                  No notes yet. Add your first note to track observations and important information.
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/dashboard/notes")}
                  className="w-full text-xs"
                >
                  View all notes
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  {notes.map((note) => (
                    <button
                      key={note.id}
                      onClick={() => router.push(`/dashboard/notes/${note.id}`)}
                      className="w-full text-left p-2.5 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium truncate mb-1">
                            {note.title}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {note.content}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {getAuthorName(note.createdBy)} • {format(new Date(note.updatedAt), "MMM d")}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/dashboard/notes")}
                  className="w-full text-xs mt-2"
                >
                  View all notes
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Note Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Create Note</DialogTitle>
            <DialogDescription>
              Create a new note and share it with team members
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="note-title">Title</Label>
              <Input
                id="note-title"
                placeholder="Note title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note-content">Content</Label>
              <Textarea
                id="note-content"
                placeholder="Write your note here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className="resize-none"
              />
            </div>
            {teamData && (
              <>
                <div className="space-y-2">
                  <Label>Editors (can edit this note)</Label>
                  {(() => {
                    const availableEditors = teamData.members.filter(
                      (m: any) =>
                        m.id !== teamData.currentUser.id &&
                        !selectedEditorIds.includes(m.id)
                    )
                    return (
                      <>
                        {availableEditors.length > 0 ? (
                          <Select
                            value=""
                            onValueChange={(value) => {
                              if (value && !selectedEditorIds.includes(value)) {
                                setSelectedEditorIds([...selectedEditorIds, value])
                                setSelectedViewerIds(
                                  selectedViewerIds.filter((id) => id !== value)
                                )
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Add editor..." />
                            </SelectTrigger>
                            <SelectContent>
                              {availableEditors.map((member: any) => (
                                <SelectItem key={member.id} value={member.id}>
                                  {member.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="px-3 py-2 text-sm text-muted-foreground bg-muted/30 rounded-md border border-dashed border-border/50">
                            {teamData.members.length === 1
                              ? "You're the only team member"
                              : "All team members are already editors"}
                          </div>
                        )}
                        {selectedEditorIds.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {selectedEditorIds.map((id) => {
                              const member = teamData.members.find((m: any) => m.id === id)
                              if (!member) return null
                              return (
                                <div
                                  key={id}
                                  className="flex items-center gap-2 px-2 py-1 bg-muted rounded text-sm"
                                >
                                  <Edit className="h-3 w-3" />
                                  <span>{member.name}</span>
                                  <button
                                    onClick={() =>
                                      setSelectedEditorIds(
                                        selectedEditorIds.filter((eid) => eid !== id)
                                      )
                                    }
                                    className="ml-1 hover:text-destructive"
                                  >
                                    ×
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        )}
                        {selectedEditorIds.length === 0 && availableEditors.length === 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            You are the creator and will have editor access by default.
                          </p>
                        )}
                      </>
                    )
                  })()}
                </div>
                <div className="space-y-2">
                  <Label>Viewers (can only view this note)</Label>
                  {(() => {
                    const availableViewers = teamData.members.filter(
                      (m: any) =>
                        m.id !== teamData.currentUser.id &&
                        !selectedViewerIds.includes(m.id) &&
                        !selectedEditorIds.includes(m.id)
                    )
                    return (
                      <>
                        {availableViewers.length > 0 ? (
                          <Select
                            value=""
                            onValueChange={(value) => {
                              if (value && !selectedViewerIds.includes(value)) {
                                setSelectedViewerIds([...selectedViewerIds, value])
                                setSelectedEditorIds(
                                  selectedEditorIds.filter((id) => id !== value)
                                )
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Add viewer..." />
                            </SelectTrigger>
                            <SelectContent>
                              {availableViewers.map((member: any) => (
                                <SelectItem key={member.id} value={member.id}>
                                  {member.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="px-3 py-2 text-sm text-muted-foreground bg-muted/30 rounded-md border border-dashed border-border/50">
                            {teamData.members.length === 1
                              ? "You're the only team member"
                              : selectedEditorIds.length > 0
                              ? "All remaining team members are already editors or viewers"
                              : "No team members available to add as viewers"}
                          </div>
                        )}
                        {selectedViewerIds.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {selectedViewerIds.map((id) => {
                              const member = teamData.members.find((m: any) => m.id === id)
                              if (!member) return null
                              return (
                                <div
                                  key={id}
                                  className="flex items-center gap-2 px-2 py-1 bg-muted rounded text-sm"
                                >
                                  <Eye className="h-3 w-3" />
                                  <span>{member.name}</span>
                                  <button
                                    onClick={() =>
                                      setSelectedViewerIds(
                                        selectedViewerIds.filter((vid) => vid !== id)
                                      )
                                    }
                                    className="ml-1 hover:text-destructive"
                                  >
                                    ×
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        )}
                        {selectedViewerIds.length === 0 && availableViewers.length === 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Optional: Add team members as viewers to give them read-only access.
                          </p>
                        )}
                      </>
                    )
                  })()}
                </div>
              </>
            )}
          </div>
          <DialogFooter className="shrink-0">
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNote} disabled={!title.trim() || !content.trim()}>
              Create Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}


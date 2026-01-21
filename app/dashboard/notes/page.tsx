"use client"

import * as React from "react"
import { motion, useReducedMotion } from "framer-motion"
import { useTeamStore } from "@/store/use-team-store"
import { useDataStore, type Note, type TeamData } from "@/store/use-data-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Plus, Search, FileText, Edit, Eye, Trash2, User, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function NotesPage() {
  const { activeTeam } = useTeamStore()
  const { 
    notes: notesFromStore, 
    teamData: teamDataFromStore,
    fetchNotes, 
    fetchTeamData,
    addNote,
    removeNote,
    loading,
    errors
  } = useDataStore()
  const router = useRouter()
  
  // UI state (component-specific)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [formOpen, setFormOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [noteToDelete, setNoteToDelete] = React.useState<Note | null>(null)

  // Form state
  const [title, setTitle] = React.useState("")
  const [content, setContent] = React.useState("")
  const [selectedEditorIds, setSelectedEditorIds] = React.useState<string[]>([])
  const [selectedViewerIds, setSelectedViewerIds] = React.useState<string[]>([])

  const shouldReduceMotion = useReducedMotion()
  const shouldAnimate = !shouldReduceMotion

  // Fetch notes and team data on mount and when team changes
  React.useEffect(() => {
    if (!activeTeam) return

    const loadData = async () => {
      try {
        await Promise.all([
          fetchNotes(activeTeam.id),
          fetchTeamData(activeTeam.id),
        ])
      } catch (error) {
        console.error("Error loading notes/team data:", error)
      }
    }

    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTeam?.id]) // Only depend on team ID, not the functions

  // Get notes and team data from store
  const notes = React.useMemo(() => {
    if (!activeTeam) return []
    const storedNotes = notesFromStore[activeTeam.id]
    return Array.isArray(storedNotes) ? storedNotes : []
  }, [notesFromStore, activeTeam])
  
  const teamData = React.useMemo(() => {
    if (!activeTeam) return null
    return teamDataFromStore[activeTeam.id] || null
  }, [teamDataFromStore, activeTeam])

  // Get loading/error states - only show loading if actively fetching AND no data
  const isLoading = React.useMemo(() => {
    if (!activeTeam) return false
    
    const notesKey = `notes-${activeTeam.id}`
    const teamDataKey = `teamData-${activeTeam.id}`
    
    // Check if data exists (even empty arrays count as data)
    const hasNotes = notesFromStore[activeTeam.id] !== undefined
    const hasTeamData = teamDataFromStore[activeTeam.id] !== undefined
    
    // If we have any data, don't show loading
    if (hasNotes || hasTeamData) {
      return false
    }
    
    // Only show loading if we're actively fetching and have no data
    const isNotesLoading = loading[notesKey] === true
    const isTeamDataLoading = loading[teamDataKey] === true
    
    return isNotesLoading || isTeamDataLoading
  }, [loading, activeTeam, notesFromStore, teamDataFromStore])
  
  // Add a timeout to prevent infinite loading
  React.useEffect(() => {
    if (!isLoading || !activeTeam) return
    
    const timeout = setTimeout(() => {
      console.error("Notes page loading timeout - forcing refresh")
      // Force refresh after 10 seconds
      fetchNotes(activeTeam.id, true)
      fetchTeamData(activeTeam.id, true)
    }, 10000) // 10 second timeout
    
    return () => clearTimeout(timeout)
  }, [isLoading, activeTeam, fetchNotes, fetchTeamData])

  const error = React.useMemo(() => {
    if (!activeTeam) return "No active team selected"
    return errors[`notes-${activeTeam.id}`] || errors[`teamData-${activeTeam.id}`] || null
  }, [errors, activeTeam])

  const handleCreateNote = () => {
    if (!teamData || teamData.currentUser.accessLevel !== "FULL") {
      toast.error("Full access required to create notes")
      return
    }
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

      const newNote = await response.json()
      
      // Add to store optimistically
      addNote(activeTeam.id, newNote)

      toast.success("Note created successfully")
      setFormOpen(false)
      setTitle("")
      setContent("")
      setSelectedEditorIds([])
      setSelectedViewerIds([])

      // Refresh notes to get full data with permissions
      await fetchNotes(activeTeam.id, true) // Force refresh
    } catch (error) {
      console.error("Error creating note:", error)
      toast.error("Failed to create note")
      // Remove optimistic update on error
      if (activeTeam) {
        await fetchNotes(activeTeam.id, true)
      }
    }
  }

  const handleDeleteNote = async () => {
    if (!activeTeam || !noteToDelete) return

    // Optimistic update
    const noteId = noteToDelete.id
    removeNote(activeTeam.id, noteId)

    try {
      const response = await fetch(
        `/api/teams/${activeTeam.id}/notes/${noteId}`,
        {
          method: "DELETE",
        }
      )

      if (!response.ok) {
        throw new Error("Failed to delete note")
      }

      toast.success("Note deleted successfully")
      setDeleteDialogOpen(false)
      setNoteToDelete(null)

      // Refresh notes to ensure consistency
      await fetchNotes(activeTeam.id, true) // Force refresh
    } catch (error) {
      console.error("Error deleting note:", error)
      toast.error("Failed to delete note")
      // Revert optimistic update on error
      await fetchNotes(activeTeam.id, true)
    }
  }

  const getAuthorName = (user: Note["createdBy"]) => {
    if (user.name) return user.name
    if (user.firstName || user.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim()
    }
    return user.email
  }

  const filteredNotes = React.useMemo(() => {
    if (!searchQuery) return notes
    const query = searchQuery.toLowerCase()
    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        getAuthorName(note.createdBy).toLowerCase().includes(query)
    )
  }, [notes, searchQuery])

  const canCreateNotes =
    teamData && teamData.currentUser.accessLevel === "FULL"

  if (!activeTeam) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Please select a team to view notes</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Spinner className="h-8 w-8 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading notes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
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
              <h1 className="text-2xl md:text-3xl font-bold truncate">Notes</h1>
              <p className="text-sm md:text-md text-muted-foreground truncate">
                {filteredNotes.length} {filteredNotes.length === 1 ? "note" : "notes"}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {canCreateNotes && (
                <Button
                  onClick={handleCreateNote}
                  size="default"
                  className="h-10 px-4"
                >
                  <Plus className="md:mr-2 h-4 w-4" />
                  <span className="hidden md:inline">Create Note</span>
                </Button>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center gap-3 w-full">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
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
                  <span className="sr-only">Clear search</span>
                  ×
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-auto w-full p-4 md:p-6">
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">
              {searchQuery ? "No notes found" : "No notes yet"}
            </h2>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "Try a different search term"
                : canCreateNotes
                ? "Create your first note to get started"
                : "You don't have any notes yet"}
            </p>
            {canCreateNotes && !searchQuery && (
              <Button onClick={handleCreateNote} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create Note
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
            {filteredNotes.map((note, index) => (
              <motion.div
                key={note.id}
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
                <Card
                  className="group hover:shadow-lg transition-all rounded-lg border border-border/50 bg-card/50 cursor-pointer h-full flex flex-col"
                  onClick={() => router.push(`/dashboard/notes/${note.id}`)}
                >
                  <CardContent className="p-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="text-lg font-semibold line-clamp-2 flex-1">
                        {note.title}
                      </h3>
                      {note.canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation()
                            setNoteToDelete(note)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                      {note.content}
                    </p>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={note.createdBy.imageUrl || undefined} />
                          <AvatarFallback>
                            {getAuthorName(note.createdBy)
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">{getAuthorName(note.createdBy)}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {note.editors.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Edit className="h-3 w-3" />
                            <span>{note.editors.length}</span>
                          </div>
                        )}
                        {note.viewers.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span>{note.viewers.length}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground mt-2">
                      {note.updatedAt !== note.createdAt
                        ? `Updated ${format(new Date(note.updatedAt), "MMM d, yyyy")}`
                        : `Created ${format(new Date(note.createdAt), "MMM d, yyyy")}`}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

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
                      (m) =>
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
                                // Remove from viewers if they're there
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
                              {availableEditors.map((member) => (
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
                              const member = teamData.members.find((m) => m.id === id)
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
                      (m) =>
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
                                // Remove from editors if they're there
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
                              {availableViewers.map((member) => (
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
                              const member = teamData.members.find((m) => m.id === id)
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Note</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{noteToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteNote}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


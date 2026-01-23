"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useTeamStore } from "@/store/use-team-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { ArrowLeft, Edit, Save, X, Trash2, UserPlus, Eye, Edit as EditIcon, Users, User } from "lucide-react"
import { format } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Note {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  createdBy: {
    id: string
    name: string | null
    firstName: string | null
    lastName: string | null
    email: string
    imageUrl: string | null
  }
  lastEditedBy?: {
    id: string
    name: string | null
    firstName: string | null
    lastName: string | null
    email: string
    imageUrl: string | null
  } | null
  editors: Array<{
    id: string
    user: {
      id: string
      name: string | null
      firstName: string | null
      lastName: string | null
      email: string
      imageUrl: string | null
    }
  }>
  viewers: Array<{
    id: string
    user: {
      id: string
      name: string | null
      firstName: string | null
      lastName: string | null
      email: string
      imageUrl: string | null
    }
  }>
  canEdit: boolean
  canDelete: boolean
  userRole: "creator" | "editor" | "viewer"
}

interface TeamMember {
  id: string
  name: string
  email: string
  imageUrl?: string | null
}

interface TeamData {
  team: {
    id: string
    name: string
  }
  members: TeamMember[]
  currentUser: {
    id: string
    isAdmin: boolean
    accessLevel: string
  }
}

export default function NoteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { activeTeam } = useTeamStore()
  const noteId = params.id as string

  const [note, setNote] = React.useState<Note | null>(null)
  const [teamData, setTeamData] = React.useState<TeamData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Edit state
  const [isEditing, setIsEditing] = React.useState(false)
  const [editTitle, setEditTitle] = React.useState("")
  const [editContent, setEditContent] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  // Permissions state
  const [permissionsDialogOpen, setPermissionsDialogOpen] = React.useState(false)
  const [selectedEditorIds, setSelectedEditorIds] = React.useState<string[]>([])
  const [selectedViewerIds, setSelectedViewerIds] = React.useState<string[]>([])
  const [savingPermissions, setSavingPermissions] = React.useState(false)

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

  // Fetch note and team data
  React.useEffect(() => {
    const fetchData = async () => {
      if (!activeTeam || !noteId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const teamResponse = await fetch(`/api/teams/${activeTeam.id}/members`)
        if (teamResponse.ok) {
          const teamData = await teamResponse.json()
          setTeamData(teamData)
        }

        const noteResponse = await fetch(
          `/api/teams/${activeTeam.id}/notes/${noteId}`
        )
        if (!noteResponse.ok) {
          if (noteResponse.status === 404) {
            setError("Note not found")
          } else {
            throw new Error("Failed to load note")
          }
          return
        }
        const noteData = await noteResponse.json()
        setNote(noteData)
        setEditTitle(noteData.title)
        setEditContent(noteData.content)
        setSelectedEditorIds(noteData.editors.map((e: any) => e.user.id))
        setSelectedViewerIds(noteData.viewers.map((v: any) => v.user.id))
      } catch (error) {
        console.error("Error fetching data:", error)
        setError("Failed to load note")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [activeTeam, noteId])

  const handleEdit = () => {
    if (!note) return
    setIsEditing(true)
    setEditTitle(note.title)
    setEditContent(note.content)
  }

  const handleCancelEdit = () => {
    if (!note) return
    setIsEditing(false)
    setEditTitle(note.title)
    setEditContent(note.content)
  }

  const handleSave = async () => {
    if (!activeTeam || !note || !editTitle.trim() || !editContent.trim()) {
      toast.error("Title and content are required")
      return
    }

    setSaving(true)
    try {
      const response = await fetch(
        `/api/teams/${activeTeam.id}/notes/${note.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: editTitle.trim(),
            content: editContent.trim(),
          }),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to update note")
      }

      const updatedNote = await response.json()
      setNote(updatedNote)
      setIsEditing(false)
      toast.success("Note updated successfully")
    } catch (error) {
      console.error("Error updating note:", error)
      toast.error("Failed to update note")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!activeTeam || !note) return

    try {
      const response = await fetch(
        `/api/teams/${activeTeam.id}/notes/${note.id}`,
        {
          method: "DELETE",
        }
      )

      if (!response.ok) {
        throw new Error("Failed to delete note")
      }

      toast.success("Note deleted successfully")
      router.push("/dashboard/notes")
    } catch (error) {
      console.error("Error deleting note:", error)
      toast.error("Failed to delete note")
    }
  }

  const handleSavePermissions = async () => {
    if (!activeTeam || !note) return

    setSavingPermissions(true)
    try {
      const response = await fetch(
        `/api/teams/${activeTeam.id}/notes/${note.id}/permissions`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            editorIds: selectedEditorIds,
            viewerIds: selectedViewerIds,
          }),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to update permissions")
      }

      const updatedNote = await response.json()
      setNote(updatedNote)
      setPermissionsDialogOpen(false)
      toast.success("Permissions updated successfully")
    } catch (error) {
      console.error("Error updating permissions:", error)
      toast.error("Failed to update permissions")
    } finally {
      setSavingPermissions(false)
    }
  }

  const getAuthorName = (user: Note["createdBy"]) => {
    if (user.name) return user.name
    if (user.firstName || user.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim()
    }
    return user.email
  }

  if (!activeTeam) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Please select a team</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (error || !note) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card>
          <CardContent className="p-6">
            <p className="text-destructive">{error || "Note not found"}</p>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/notes")}
              className="mt-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Notes
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden w-full">
      {/* Header */}
      <div className="shrink-0 border-b bg-background w-full overflow-hidden sticky top-0 z-50">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/dashboard/notes")}
                className="shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0 flex-1">
                {isEditing ? (
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="text-xl font-semibold h-auto py-1 px-0 border-0 focus-visible:ring-0"
                    placeholder="Note title..."
                  />
                ) : (
                  <h1 className="text-xl md:text-2xl font-semibold truncate">
                    {note.title}
                  </h1>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <span>
                    Created by {getAuthorName(note.createdBy)} •{" "}
                    {format(new Date(note.createdAt), "MMM d, yyyy")}
                  </span>
                  {note.lastEditedBy && note.updatedAt !== note.createdAt && (
                    <>
                      <span>•</span>
                      <span>
                        Edited by {getAuthorName(note.lastEditedBy)} •{" "}
                        {format(new Date(note.updatedAt), "MMM d, yyyy")}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving || !editTitle.trim() || !editContent.trim()}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </>
              ) : (
                <>
                  {note.canEdit && (
                    <Button variant="outline" onClick={handleEdit}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  )}
                  {note.userRole === "creator" && (
                    <Button
                      variant="outline"
                      onClick={() => setPermissionsDialogOpen(true)}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Permissions
                    </Button>
                  )}
                  {note.canDelete && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setDeleteDialogOpen(true)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Note
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto w-full p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="border border-border/50 bg-card/50">
            <CardContent className="p-6">
              {isEditing ? (
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[400px] resize-none border-0 focus-visible:ring-0 text-base leading-relaxed"
                  placeholder="Write your note here..."
                />
              ) : (
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-base leading-relaxed">
                    {note.content}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Permissions Info */}
          <Card className="mt-4 border border-border/50 bg-card/50">
            <CardContent className="p-5">
              <h3 className="text-base font-medium mb-4">Permissions</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <EditIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Editors ({note.editors.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {note.editors.map((editor) => (
                      <div
                        key={editor.id}
                        className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={editor.user.imageUrl || undefined} />
                          <AvatarFallback className="text-xs">
                            {getAuthorName(editor.user)
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{getAuthorName(editor.user)}</span>
                        {editor.user.id === note.createdBy.id && (
                          <span className="text-xs text-muted-foreground">(Creator)</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                {note.viewers.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Viewers ({note.viewers.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {note.viewers.map((viewer) => (
                        <div
                          key={viewer.id}
                          className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg"
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={viewer.user.imageUrl || undefined} />
                            <AvatarFallback className="text-xs">
                              {getAuthorName(viewer.user)
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{getAuthorName(viewer.user)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Permissions Dialog */}
      <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Manage Permissions</DialogTitle>
            <DialogDescription>
              Add or remove editors and viewers for this note
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 py-4">
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
                              const isCreator = id === note.createdBy.id
                              return (
                                <div
                                  key={id}
                                  className="flex items-center gap-2 px-2 py-1 bg-muted rounded text-sm"
                                >
                                  <EditIcon className="h-3 w-3" />
                                  <span>{member.name}</span>
                                  {isCreator && (
                                    <span className="text-xs text-muted-foreground">(Creator)</span>
                                  )}
                                  {!isCreator && (
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
                                  )}
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
            <Button
              variant="outline"
              onClick={() => setPermissionsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePermissions}
              disabled={savingPermissions}
            >
              {savingPermissions ? "Saving..." : "Save Permissions"}
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
              Are you sure you want to delete "{note.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


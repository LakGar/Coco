"use client"

import * as React from "react"
import { useTeamStore } from "@/store/use-team-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { toast } from "sonner"
import { Users, Mail, UserPlus } from "lucide-react"
import { TeamMemberCard } from "@/components/ui/team-member-card"

interface TeamMember {
  id: string
  name: string
  email: string
  image?: string
  role: string
  isAdmin: boolean
  accessLevel: string
  joinedAt: string
  isTeamCreator?: boolean
}

interface TeamData {
  team: {
    id: string
    name: string
    patientId?: string | null
  }
  members: TeamMember[]
  patient: TeamMember | null
  currentUser: {
    id: string
    isAdmin: boolean
    accessLevel: string
  }
}

export default function TeamMembersPage() {
  const { activeTeam } = useTeamStore()
  const [teamData, setTeamData] = React.useState<TeamData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [inviteDialogOpen, setInviteDialogOpen] = React.useState(false)
  const [inviteFormData, setInviteFormData] = React.useState({
    email: "",
    name: "",
    role: "CAREGIVER" as "CAREGIVER" | "FAMILY" | "PHYSICIAN",
    accessLevel: "FULL" as "FULL" | "READ_ONLY",
  })
  const [inviting, setInviting] = React.useState(false)

  React.useEffect(() => {
    if (activeTeam) {
      fetchTeamMembers()
    }
  }, [activeTeam])

  const fetchTeamMembers = async () => {
    if (!activeTeam) return
    setLoading(true)
    try {
      const response = await fetch(`/api/teams/${activeTeam.id}/members`)
      if (!response.ok) {
        throw new Error("Failed to load team members")
      }
      const data = await response.json()
      setTeamData(data)
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching team members:", error)
      }
      toast.error("Failed to load team members")
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async () => {
    if (!activeTeam || !inviteFormData.email) {
      toast.error("Please enter an email address")
      return
    }

    setInviting(true)
    try {
      const response = await fetch(`/api/teams/${activeTeam.id}/invites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: inviteFormData.email.trim(),
          name: inviteFormData.name.trim() || null,
          role: inviteFormData.role,
          accessLevel: inviteFormData.accessLevel,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to send invite")
      }

      toast.success(`Invitation sent to ${inviteFormData.email}`)
      setInviteDialogOpen(false)
      setInviteFormData({
        email: "",
        name: "",
        role: "CAREGIVER",
        accessLevel: "FULL",
      })
      fetchTeamMembers()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send invite")
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!activeTeam) return
    if (!confirm(`Are you sure you want to remove ${memberName} from the team?`)) {
      return
    }

    try {
      const response = await fetch(`/api/teams/${activeTeam.id}/members/${memberId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to remove member")
      }

      toast.success(`${memberName} has been removed from the team`)
      fetchTeamMembers()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove member")
    }
  }

  const handlePermissions = async ({ member, action }: { member: TeamMember; action: string }) => {
    if (!activeTeam) {
      toast.error("No active team selected")
      return
    }

    let accessLevel: "FULL" | "READ_ONLY" | undefined
    let isAdmin: boolean | undefined

    if (action.includes("Full Access")) {
      accessLevel = "FULL"
    } else if (action.includes("Read Only")) {
      accessLevel = "READ_ONLY"
    } else if (action.includes("Remove Admin") || action.includes("Removing")) {
      isAdmin = false
    } else if (action.includes("Admin") || action.includes("Making")) {
      isAdmin = true
    }

    try {
      const requestBody: { accessLevel?: "FULL" | "READ_ONLY"; isAdmin?: boolean } = {}

      if (accessLevel) {
        requestBody.accessLevel = accessLevel
      }

      if (typeof isAdmin === "boolean") {
        requestBody.isAdmin = isAdmin
      }

      const response = await fetch(`/api/teams/${activeTeam.id}/members/${member.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update permissions")
      }

      toast.success(`Permissions updated for ${member.name}`)
      fetchTeamMembers()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update permissions")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Spinner className="mx-auto mb-4 text-primary" size="lg" />
          <p className="text-muted-foreground">Loading team members...</p>
        </div>
      </div>
    )
  }

  if (!teamData) {
    return null
  }

  const canAddMembers = teamData.currentUser.isAdmin || teamData.currentUser.accessLevel === "FULL"
  const canManagePermissions = teamData.currentUser.isAdmin
  const teamMembers = teamData.members

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex h-14 items-center justify-between px-6">
          <div>
            <h1 className="text-lg font-semibold">Team Members</h1>
            <p className="text-sm text-muted-foreground">
              Manage team members and invitations
            </p>
          </div>
          {canAddMembers && (
            <Button onClick={() => setInviteDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Team Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>{teamData.team.name}</CardTitle>
              <CardDescription>
                {teamMembers.length} {teamMembers.length === 1 ? "member" : "members"} in this care team
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Team Members Grid */}
          {teamMembers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teamMembers.map((member) => (
                <TeamMemberCard
                  key={member.id}
                  member={member}
                  enableAnimations={true}
                  onMessage={() => {
                    // TODO: Implement messaging
                    toast.info("Messaging feature coming soon")
                  }}
                  onPermissions={handlePermissions}
                  canManagePermissions={canManagePermissions}
                  currentUserId={teamData.currentUser.id}
                />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No team members yet</h3>
              <p className="text-muted-foreground mb-4">
                Team members will appear here once they accept their invitations.
              </p>
              {canAddMembers && (
                <Button onClick={() => setInviteDialogOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Team Member
                </Button>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join this care team. They will receive an email with instructions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="member@example.com"
                value={inviteFormData.email}
                onChange={(e) =>
                  setInviteFormData({ ...inviteFormData, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name (Optional)</Label>
              <Input
                id="name"
                placeholder="Member's name"
                value={inviteFormData.name}
                onChange={(e) =>
                  setInviteFormData({ ...inviteFormData, name: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={inviteFormData.role}
                  onValueChange={(value: "CAREGIVER" | "FAMILY" | "PHYSICIAN") =>
                    setInviteFormData({ ...inviteFormData, role: value })
                  }
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CAREGIVER">Caregiver</SelectItem>
                    <SelectItem value="FAMILY">Family</SelectItem>
                    <SelectItem value="PHYSICIAN">Physician</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accessLevel">Access Level</Label>
                <Select
                  value={inviteFormData.accessLevel}
                  onValueChange={(value: "FULL" | "READ_ONLY") =>
                    setInviteFormData({ ...inviteFormData, accessLevel: value })
                  }
                >
                  <SelectTrigger id="accessLevel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FULL">Full Access</SelectItem>
                    <SelectItem value="READ_ONLY">Read Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInviteDialogOpen(false)}
              disabled={inviting}
            >
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={inviting || !inviteFormData.email}>
              {inviting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

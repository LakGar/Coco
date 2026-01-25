"use client";

import { useEffect, useState } from "react";
import { useTeamStore } from "@/store/use-team-store";
import { Spinner } from "@/components/ui/spinner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TeamMemberCard } from "@/components/ui/team-member-card";
import { AddTeamMemberModal } from "@/components/add-team-member-modal";
import { Users } from "lucide-react";
import { toast } from "sonner";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: string;
  isAdmin: boolean;
  accessLevel: string;
  joinedAt: string;
  isTeamCreator?: boolean;
}

interface TeamData {
  team: {
    id: string;
    name: string;
    patientId?: string | null;
  };
  members: TeamMember[];
  patient: TeamMember | null;
  currentUser: {
    id: string;
    isAdmin: boolean;
    accessLevel: string;
  };
}

export default function TeamPage() {
  const { activeTeam } = useTeamStore();
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!activeTeam) {
        setError("No active team selected");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/teams/${activeTeam.id}/members`);
        if (!response.ok) {
          throw new Error("Failed to load team members");
        }
        const data = await response.json();
        setTeamData(data);
      } catch (error) {
        console.error("Error fetching team members:", error);
        setError("Failed to load team members");
      } finally {
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, [activeTeam]);

  const handleMessage = (member: TeamMember) => {
    // TODO: Implement messaging functionality
    console.log("Message:", member);
  };

  const handlePermissions = async ({
    member,
    action,
  }: {
    member: TeamMember;
    action: string;
  }) => {
    if (!activeTeam) {
      toast.error("No active team selected");
      return;
    }

    // Determine what to update based on action
    let accessLevel: "FULL" | "READ_ONLY" | undefined;
    let isAdmin: boolean | undefined;

    if (action.includes("Full Access")) {
      accessLevel = "FULL";
    } else if (action.includes("Read Only")) {
      accessLevel = "READ_ONLY";
    } else if (action.includes("Remove Admin") || action.includes("Removing")) {
      isAdmin = false;
    } else if (action.includes("Admin") || action.includes("Making")) {
      isAdmin = true;
    }

    try {
      const requestBody: {
        accessLevel?: "FULL" | "READ_ONLY";
        isAdmin?: boolean;
      } = {};

      if (accessLevel) {
        requestBody.accessLevel = accessLevel;
      }

      if (typeof isAdmin === "boolean") {
        requestBody.isAdmin = isAdmin;
      }

      const response = await fetch(
        `/api/teams/${activeTeam.id}/members/${member.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update permissions");
      }

      const data = await response.json();

      // Refresh team data
      const teamResponse = await fetch(`/api/teams/${activeTeam.id}/members`);
      if (teamResponse.ok) {
        const teamData = await teamResponse.json();
        setTeamData(teamData);
      }

      toast.success(`Permissions updated for ${member.name}`);
    } catch (error) {
      console.error("Error updating permissions:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update permissions",
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Spinner className="mx-auto mb-4 text-primary" size="lg" />
          <p className="text-muted-foreground">Loading team members...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-8 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Error</h2>
          <p className="text-muted-foreground">{error}</p>
        </Card>
      </div>
    );
  }

  if (!teamData) {
    return null;
  }

  // Only show team members (not patient)
  const teamMembers = teamData.members;
  const canAddMembers =
    teamData.currentUser.isAdmin || teamData.currentUser.accessLevel === "FULL";
  const canManagePermissions = teamData.currentUser.isAdmin;

  const handleMemberAdded = () => {
    // Refresh team data
    if (activeTeam) {
      fetch(`/api/teams/${activeTeam.id}/members`)
        .then((res) => res.json())
        .then((data) => setTeamData(data))
        .catch((err) => {
          console.error("Error refreshing team data:", err);
        });
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{teamData.team.name}</h1>
            <p className="text-muted-foreground">
              {teamMembers.length}{" "}
              {teamMembers.length === 1 ? "member" : "members"} in this care
              team
            </p>
          </div>
          {canAddMembers && (
            <Button onClick={() => setAddMemberModalOpen(true)}>
              <Users className="mr-2 h-4 w-4" />
              Add Team Member
            </Button>
          )}
        </div>
      </div>

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamMembers.map((member) => (
          <TeamMemberCard
            key={member.id}
            member={member}
            enableAnimations={true}
            onMessage={handleMessage}
            onPermissions={handlePermissions}
            canManagePermissions={canManagePermissions}
            currentUserId={teamData.currentUser.id}
          />
        ))}
      </div>

      {/* Empty State */}
      {teamMembers.length === 0 && (
        <Card className="p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No team members yet</h3>
          <p className="text-muted-foreground mb-4">
            Team members will appear here once they accept their invitations.
          </p>
          {canAddMembers && (
            <Button onClick={() => setAddMemberModalOpen(true)}>
              <Users className="mr-2 h-4 w-4" />
              Invite Team Member
            </Button>
          )}
        </Card>
      )}

      {/* Add Member Modal */}
      {activeTeam && (
        <AddTeamMemberModal
          open={addMemberModalOpen}
          onOpenChange={setAddMemberModalOpen}
          teamId={activeTeam.id}
          onSuccess={handleMemberAdded}
        />
      )}
    </div>
  );
}

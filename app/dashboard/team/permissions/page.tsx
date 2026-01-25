"use client";

import * as React from "react";
import { useTeamStore } from "@/store/use-team-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Shield,
  Save,
  Users,
  List,
  FileText,
  Repeat,
  Phone,
  Heart,
  TrendingUp,
} from "lucide-react";
import { getDefaultPermissionsForAccessLevel } from "@/lib/permission-helpers";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: string;
  isAdmin: boolean;
  accessLevel: string;
  // Granular permissions
  canViewTasks?: boolean;
  canCreateTasks?: boolean;
  canEditTasks?: boolean;
  canDeleteTasks?: boolean;
  canViewNotes?: boolean;
  canCreateNotes?: boolean;
  canEditNotes?: boolean;
  canDeleteNotes?: boolean;
  canViewRoutines?: boolean;
  canCreateRoutines?: boolean;
  canEditRoutines?: boolean;
  canDeleteRoutines?: boolean;
  canViewContacts?: boolean;
  canCreateContacts?: boolean;
  canEditContacts?: boolean;
  canDeleteContacts?: boolean;
  canViewMoods?: boolean;
  canCreateMoods?: boolean;
  canViewBurdenScales?: boolean;
  canCreateBurdenScales?: boolean;
  canViewMembers?: boolean;
  canInviteMembers?: boolean;
  canRemoveMembers?: boolean;
  canManagePermissions?: boolean;
}

interface TeamData {
  team: {
    id: string;
    name: string;
  };
  members: TeamMember[];
  currentUser: {
    id: string;
    isAdmin: boolean;
    accessLevel: string;
  };
}

interface PermissionGroup {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  permissions: {
    key: keyof TeamMember;
    label: string;
    description: string;
  }[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    title: "Tasks",
    icon: List,
    permissions: [
      {
        key: "canViewTasks",
        label: "View Tasks",
        description: "Can see tasks in the team",
      },
      {
        key: "canCreateTasks",
        label: "Create Tasks",
        description: "Can create new tasks",
      },
      {
        key: "canEditTasks",
        label: "Edit Tasks",
        description: "Can modify existing tasks",
      },
      {
        key: "canDeleteTasks",
        label: "Delete Tasks",
        description: "Can remove tasks",
      },
    ],
  },
  {
    title: "Notes",
    icon: FileText,
    permissions: [
      {
        key: "canViewNotes",
        label: "View Notes",
        description: "Can see notes in the team",
      },
      {
        key: "canCreateNotes",
        label: "Create Notes",
        description: "Can create new notes",
      },
      {
        key: "canEditNotes",
        label: "Edit Notes",
        description: "Can modify existing notes",
      },
      {
        key: "canDeleteNotes",
        label: "Delete Notes",
        description: "Can remove notes",
      },
    ],
  },
  {
    title: "Routines",
    icon: Repeat,
    permissions: [
      {
        key: "canViewRoutines",
        label: "View Routines",
        description: "Can see routines in the team",
      },
      {
        key: "canCreateRoutines",
        label: "Create Routines",
        description: "Can create new routines",
      },
      {
        key: "canEditRoutines",
        label: "Edit Routines",
        description: "Can modify existing routines",
      },
      {
        key: "canDeleteRoutines",
        label: "Delete Routines",
        description: "Can remove routines",
      },
    ],
  },
  {
    title: "Contacts",
    icon: Phone,
    permissions: [
      {
        key: "canViewContacts",
        label: "View Contacts",
        description: "Can see contacts in the team",
      },
      {
        key: "canCreateContacts",
        label: "Create Contacts",
        description: "Can create new contacts",
      },
      {
        key: "canEditContacts",
        label: "Edit Contacts",
        description: "Can modify existing contacts",
      },
      {
        key: "canDeleteContacts",
        label: "Delete Contacts",
        description: "Can remove contacts",
      },
    ],
  },
  {
    title: "Moods",
    icon: TrendingUp,
    permissions: [
      {
        key: "canViewMoods",
        label: "View Moods",
        description: "Can see mood entries",
      },
      {
        key: "canCreateMoods",
        label: "Create Moods",
        description: "Can log mood entries",
      },
    ],
  },
  {
    title: "Caregiver Burden",
    icon: Heart,
    permissions: [
      {
        key: "canViewBurdenScales",
        label: "View Assessments",
        description: "Can see caregiver burden assessments",
      },
      {
        key: "canCreateBurdenScales",
        label: "Create Assessments",
        description: "Can complete caregiver burden assessments",
      },
    ],
  },
  {
    title: "Team Management",
    icon: Users,
    permissions: [
      {
        key: "canViewMembers",
        label: "View Members",
        description: "Can see team members list",
      },
      {
        key: "canInviteMembers",
        label: "Invite Members",
        description: "Can send invitations to new members",
      },
      {
        key: "canRemoveMembers",
        label: "Remove Members",
        description: "Can remove members from the team",
      },
      {
        key: "canManagePermissions",
        label: "Manage Permissions",
        description: "Can change member permissions",
      },
    ],
  },
];

export default function PermissionsPage() {
  const { activeTeam } = useTeamStore();
  const [teamData, setTeamData] = React.useState<TeamData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [selectedMember, setSelectedMember] = React.useState<TeamMember | null>(
    null,
  );
  const [permissions, setPermissions] = React.useState<Partial<TeamMember>>({});
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (activeTeam) {
      fetchTeamData();
    }
  }, [activeTeam]);

  const fetchTeamData = async () => {
    if (!activeTeam) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/teams/${activeTeam.id}/members`);
      if (!response.ok) {
        throw new Error("Failed to load team data");
      }
      const data = await response.json();
      setTeamData(data);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching team data:", error);
      }
      toast.error("Failed to load team data");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (selectedMember) {
      // Get default permissions based on access level
      const defaultPermissions = getDefaultPermissionsForAccessLevel(
        selectedMember.accessLevel as "FULL" | "READ_ONLY",
        selectedMember.isAdmin,
      );

      // Initialize permissions from selected member, falling back to defaults
      setPermissions({
        canViewTasks:
          selectedMember.canViewTasks ?? defaultPermissions.canViewTasks,
        canCreateTasks:
          selectedMember.canCreateTasks ?? defaultPermissions.canCreateTasks,
        canEditTasks:
          selectedMember.canEditTasks ?? defaultPermissions.canEditTasks,
        canDeleteTasks:
          selectedMember.canDeleteTasks ?? defaultPermissions.canDeleteTasks,
        canViewNotes:
          selectedMember.canViewNotes ?? defaultPermissions.canViewNotes,
        canCreateNotes:
          selectedMember.canCreateNotes ?? defaultPermissions.canCreateNotes,
        canEditNotes:
          selectedMember.canEditNotes ?? defaultPermissions.canEditNotes,
        canDeleteNotes:
          selectedMember.canDeleteNotes ?? defaultPermissions.canDeleteNotes,
        canViewRoutines:
          selectedMember.canViewRoutines ?? defaultPermissions.canViewRoutines,
        canCreateRoutines:
          selectedMember.canCreateRoutines ??
          defaultPermissions.canCreateRoutines,
        canEditRoutines:
          selectedMember.canEditRoutines ?? defaultPermissions.canEditRoutines,
        canDeleteRoutines:
          selectedMember.canDeleteRoutines ??
          defaultPermissions.canDeleteRoutines,
        canViewContacts:
          selectedMember.canViewContacts ?? defaultPermissions.canViewContacts,
        canCreateContacts:
          selectedMember.canCreateContacts ??
          defaultPermissions.canCreateContacts,
        canEditContacts:
          selectedMember.canEditContacts ?? defaultPermissions.canEditContacts,
        canDeleteContacts:
          selectedMember.canDeleteContacts ??
          defaultPermissions.canDeleteContacts,
        canViewMoods:
          selectedMember.canViewMoods ?? defaultPermissions.canViewMoods,
        canCreateMoods:
          selectedMember.canCreateMoods ?? defaultPermissions.canCreateMoods,
        canViewBurdenScales:
          selectedMember.canViewBurdenScales ??
          defaultPermissions.canViewBurdenScales,
        canCreateBurdenScales:
          selectedMember.canCreateBurdenScales ??
          defaultPermissions.canCreateBurdenScales,
        canViewMembers:
          selectedMember.canViewMembers ?? defaultPermissions.canViewMembers,
        canInviteMembers:
          selectedMember.canInviteMembers ??
          defaultPermissions.canInviteMembers,
        canRemoveMembers:
          selectedMember.canRemoveMembers ??
          defaultPermissions.canRemoveMembers,
        canManagePermissions:
          selectedMember.canManagePermissions ??
          defaultPermissions.canManagePermissions,
      });
    }
  }, [selectedMember]);

  const handlePermissionChange = (key: keyof TeamMember, value: boolean) => {
    if (!selectedMember) return;

    // Enforce READ_ONLY restrictions
    const isReadOnly = selectedMember.accessLevel === "READ_ONLY";
    const isModifyPermission =
      key.includes("Create") ||
      key.includes("Edit") ||
      key.includes("Delete") ||
      key.includes("Invite") ||
      key.includes("Remove") ||
      key.includes("Manage");

    // If READ_ONLY and trying to enable a modify permission, don't allow it
    if (isReadOnly && isModifyPermission && value === true) {
      toast.error(
        "Read-only users cannot have create, edit, or delete permissions",
      );
      return;
    }

    setPermissions((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    if (!activeTeam || !selectedMember) return;

    setSaving(true);
    try {
      const response = await fetch(
        `/api/teams/${activeTeam.id}/members/${selectedMember.id}/permissions`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(permissions),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update permissions");
      }

      toast.success(`Permissions updated for ${selectedMember.name}`);
      fetchTeamData();
      setSelectedMember(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update permissions",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Spinner className="mx-auto mb-4 text-primary" size="lg" />
          <p className="text-muted-foreground">Loading permissions...</p>
        </div>
      </div>
    );
  }

  if (!teamData) {
    return null;
  }

  const canManagePermissions = teamData.currentUser.isAdmin;
  const teamMembers = teamData.members.filter(
    (m) => m.id !== teamData.currentUser.id,
  );

  if (!canManagePermissions) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-8 text-center max-w-md">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            Only team admins can manage permissions.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4 md:px-6">
          <div>
            <h1 className="text-base md:text-lg font-semibold">
              Permissions Management
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              Control what each team member can see and do
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Member List Sidebar */}
        <div className="w-full md:w-80 border-b md:border-r border-r-0 bg-muted/30 shrink-0 overflow-y-auto max-h-[200px] md:max-h-none">
          <div className="p-3 md:p-4 space-y-2">
            <h2 className="text-sm font-semibold mb-3">Team Members</h2>
            <div className="flex gap-2 overflow-x-auto pb-2 md:flex-col md:overflow-x-visible md:pb-0">
              {teamMembers.map((member) => {
                const Icon = member.isAdmin ? Shield : Users;
                return (
                  <button
                    key={member.id}
                    onClick={() => setSelectedMember(member)}
                    className={`min-w-[200px] md:w-full p-3 rounded-lg border text-left transition-all ${
                      selectedMember?.id === member.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 md:h-10 md:w-10 shrink-0">
                        <AvatarImage src={member.image} />
                        <AvatarFallback>
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">
                            {member.name}
                          </p>
                          {member.isAdmin && (
                            <Badge
                              variant="outline"
                              className="text-xs shrink-0"
                            >
                              Admin
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.email}
                        </p>
                      </div>
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Permissions Editor */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {selectedMember ? (
            <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className="text-xl md:text-2xl font-semibold">
                    {selectedMember.name}
                  </h2>
                  <p className="text-sm md:text-base text-muted-foreground">
                    {selectedMember.email}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={selectedMember.isAdmin ? "default" : "outline"}
                  >
                    {selectedMember.isAdmin ? "Admin" : "Member"}
                  </Badge>
                  <Badge variant="outline">{selectedMember.accessLevel}</Badge>
                </div>
              </div>

              {selectedMember.isAdmin && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">
                      Admins have full access to all features. Permissions
                      cannot be restricted for admins.
                    </p>
                  </CardContent>
                </Card>
              )}

              {!selectedMember.isAdmin &&
                selectedMember.accessLevel === "READ_ONLY" && (
                  <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">
                        This member has <strong>Read Only</strong> access.
                        Create, Edit, and Delete permissions are automatically
                        disabled and cannot be enabled.
                      </p>
                    </CardContent>
                  </Card>
                )}

              {!selectedMember.isAdmin && (
                <>
                  {PERMISSION_GROUPS.map((group) => {
                    const GroupIcon = group.icon;
                    return (
                      <Card key={group.title}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <GroupIcon className="h-5 w-5" />
                            {group.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 md:space-y-4">
                          {group.permissions.map((permission) => {
                            const value = permissions[permission.key] as
                              | boolean
                              | undefined;

                            // Check if this is a create/edit/delete permission
                            const isModifyPermission =
                              permission.key.includes("Create") ||
                              permission.key.includes("Edit") ||
                              permission.key.includes("Delete") ||
                              permission.key.includes("Invite") ||
                              permission.key.includes("Remove") ||
                              permission.key.includes("Manage");

                            // Disable if admin or if READ_ONLY and it's a modify permission
                            const isReadOnly =
                              selectedMember.accessLevel === "READ_ONLY";
                            const isDisabled =
                              selectedMember.isAdmin ||
                              (isReadOnly && isModifyPermission);

                            return (
                              <div
                                key={permission.key}
                                className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 p-3 rounded-lg border transition-colors ${
                                  isDisabled && !selectedMember.isAdmin
                                    ? "opacity-60 bg-muted/30"
                                    : "hover:bg-muted/50"
                                }`}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <Label
                                      htmlFor={permission.key}
                                      className={`font-medium text-sm md:text-base ${
                                        isDisabled
                                          ? "cursor-not-allowed"
                                          : "cursor-pointer"
                                      }`}
                                    >
                                      {permission.label}
                                    </Label>
                                    {isReadOnly && isModifyPermission && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        Read Only
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {permission.description}
                                  </p>
                                </div>
                                <div className="shrink-0">
                                  <Checkbox
                                    id={permission.key}
                                    checked={value ?? false}
                                    onCheckedChange={(checked) =>
                                      handlePermissionChange(
                                        permission.key,
                                        checked === true,
                                      )
                                    }
                                    disabled={isDisabled}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </CardContent>
                      </Card>
                    );
                  })}

                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedMember(null)}
                      disabled={saving}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="w-full sm:w-auto"
                    >
                      {saving ? (
                        <>
                          <Spinner className="mr-2 h-4 w-4" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Permissions
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <Card className="p-12 text-center max-w-md">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Select a Team Member
                </h3>
                <p className="text-muted-foreground">
                  Choose a team member from the list to manage their
                  permissions.
                </p>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Settings,
  Bell,
  Mail,
  Smartphone,
  Save,
  Clock,
  Trash2,
  LogOut,
  AlertTriangle,
} from "lucide-react";
import { useTeamStore } from "@/store/use-team-store";
import { useDataStore } from "@/store/use-data-store";

type NotificationFrequency = "EVERY_EVENT" | "DAILY" | "WEEKLY" | "DISABLED";

interface NotificationSettings {
  contactSetupReminderFrequency: NotificationFrequency;
  taskDueFrequency: NotificationFrequency;
  routineMissedFrequency: NotificationFrequency;
  teamInviteFrequency: NotificationFrequency;
  permissionChangeFrequency: NotificationFrequency;
  systemAlertFrequency: NotificationFrequency;
  emailNotificationsEnabled: boolean;
  pushNotificationsEnabled: boolean;
  dailyDigestTime: string | null;
  weeklyDigestDay: number | null;
  weeklyDigestTime: string | null;
}

interface NotificationTypeConfig {
  key: keyof NotificationSettings;
  label: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
}

const NOTIFICATION_TYPES: NotificationTypeConfig[] = [
  {
    key: "contactSetupReminderFrequency",
    label: "Contact Setup Reminders",
    description: "Get notified when contact information needs to be set up",
  },
  {
    key: "taskDueFrequency",
    label: "Task Due Notifications",
    description: "Get notified about upcoming or overdue tasks",
  },
  {
    key: "routineMissedFrequency",
    label: "Routine Missed Alerts",
    description: "Get notified when routines are missed or incomplete",
  },
  {
    key: "teamInviteFrequency",
    label: "Team Invitations",
    description: "Get notified when you receive team invitations",
  },
  {
    key: "permissionChangeFrequency",
    label: "Permission Changes",
    description: "Get notified when your permissions are changed",
  },
  {
    key: "systemAlertFrequency",
    label: "System Alerts",
    description: "Get notified about important system updates and alerts",
  },
];

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { activeTeam, loadTeams } = useTeamStore();
  const { teamData: teamDataFromStore, fetchTeamData } = useDataStore();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [settings, setSettings] = React.useState<NotificationSettings | null>(
    null,
  );
  const [leaveDialogOpen, setLeaveDialogOpen] = React.useState(false);
  const [deleteTeamDialogOpen, setDeleteTeamDialogOpen] = React.useState(false);
  const [assignAdminUserId, setAssignAdminUserId] = React.useState<string>("");
  const [leaving, setLeaving] = React.useState(false);
  const [deletingTeam, setDeletingTeam] = React.useState(false);
  const [makingAdmin, setMakingAdmin] = React.useState(false);
  const [leaveErrorCode, setLeaveErrorCode] = React.useState<string | null>(
    null,
  );

  const teamData = activeTeam
    ? (teamDataFromStore[activeTeam.id] ?? null)
    : null;
  const isOnlyAdmin =
    teamData?.currentUser.isAdmin &&
    teamData?.members.filter((m) => m.isAdmin).length <= 1;
  const otherNonAdminMembers = (teamData?.members ?? []).filter(
    (m) => m.id !== teamData?.currentUser.id && !m.isAdmin,
  );

  React.useEffect(() => {
    fetchSettings();
  }, []);

  React.useEffect(() => {
    if (activeTeam?.id) {
      fetchTeamData(activeTeam.id);
    }
  }, [activeTeam?.id, fetchTeamData]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/user/notification-settings");
      if (!response.ok) {
        throw new Error("Failed to load settings");
      }
      const data = await response.json();
      setSettings(data.settings);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching settings:", error);
      }
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleFrequencyChange = (
    key: keyof NotificationSettings,
    value: NotificationFrequency,
  ) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [key]: value,
    });
  };

  const handleToggleChange = (
    key: "emailNotificationsEnabled" | "pushNotificationsEnabled",
    value: boolean,
  ) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [key]: value,
    });
  };

  const handleTimeChange = (
    key: "dailyDigestTime" | "weeklyDigestTime",
    value: string,
  ) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [key]: value || null,
    });
  };

  const handleWeeklyDayChange = (value: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      weeklyDigestDay: value ? parseInt(value, 10) : null,
    });
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const response = await fetch("/api/user/notification-settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save settings");
      }

      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save settings",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLeaveTeam = async () => {
    if (!activeTeam) return;
    setLeaving(true);
    setLeaveErrorCode(null);
    try {
      const response = await fetch(`/api/teams/${activeTeam.id}/leave`, {
        method: "POST",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (data.code === "ONLY_ADMIN_CANNOT_LEAVE") {
          setLeaveErrorCode("ONLY_ADMIN_CANNOT_LEAVE");
          setLeaveDialogOpen(false);
          toast.error("Assign another admin before you can leave the team.");
          return;
        }
        throw new Error(data.error || "Failed to leave team");
      }
      toast.success("You have left the team.");
      setLeaveDialogOpen(false);
      await loadTeams();
      router.push("/dashboard");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to leave team",
      );
    } finally {
      setLeaving(false);
    }
  };

  const handleMakeAdmin = async () => {
    if (!activeTeam || !assignAdminUserId) return;
    setMakingAdmin(true);
    try {
      const response = await fetch(
        `/api/teams/${activeTeam.id}/members/${assignAdminUserId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isAdmin: true }),
        },
      );
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to update member");
      }
      toast.success("Admin assigned. You can now leave the team if you want.");
      setAssignAdminUserId("");
      setLeaveErrorCode(null);
      await fetchTeamData(activeTeam.id, true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to assign admin",
      );
    } finally {
      setMakingAdmin(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!activeTeam) return;
    setDeletingTeam(true);
    try {
      const response = await fetch(`/api/teams/${activeTeam.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to delete team");
      }
      toast.success("Team and all its data have been deleted.");
      setDeleteTeamDialogOpen(false);
      await loadTeams();
      router.push("/dashboard");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete team",
      );
    } finally {
      setDeletingTeam(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Spinner className="mx-auto mb-4 text-primary" size="lg" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-8 text-center max-w-md">
          <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Settings Not Found</h2>
          <p className="text-muted-foreground">
            Unable to load your settings. Please try refreshing the page.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex h-14 items-center justify-between px-6">
          <div>
            <h1 className="text-lg font-semibold">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your notification preferences and account settings
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <CardTitle>Notification Preferences</CardTitle>
              </div>
              <CardDescription>
                Control how and when you receive notifications for different
                events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {NOTIFICATION_TYPES.map((type) => {
                const value = settings[type.key] as NotificationFrequency;
                return (
                  <div key={type.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium">
                          {type.label}
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {type.description}
                        </p>
                      </div>
                      <Select
                        value={value}
                        onValueChange={(val) =>
                          handleFrequencyChange(
                            type.key,
                            val as NotificationFrequency,
                          )
                        }
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EVERY_EVENT">
                            Every Event
                          </SelectItem>
                          <SelectItem value="DAILY">Daily Digest</SelectItem>
                          <SelectItem value="WEEKLY">Weekly Digest</SelectItem>
                          <SelectItem value="DISABLED">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {value === "DAILY" && type.key === "taskDueFrequency" && (
                      <div className="ml-4 pl-4 border-l-2 space-y-2">
                        <Label
                          htmlFor="dailyDigestTime"
                          className="text-sm flex items-center gap-2"
                        >
                          <Clock className="h-4 w-4" />
                          Daily Digest Time (UTC)
                        </Label>
                        <Input
                          id="dailyDigestTime"
                          type="time"
                          value={settings.dailyDigestTime || "09:00"}
                          onChange={(e) =>
                            handleTimeChange("dailyDigestTime", e.target.value)
                          }
                          className="w-[180px]"
                        />
                        <p className="text-xs text-muted-foreground">
                          You'll receive a daily summary at this time
                        </p>
                      </div>
                    )}
                    {value === "WEEKLY" && type.key === "taskDueFrequency" && (
                      <div className="ml-4 pl-4 border-l-2 space-y-2">
                        <div className="flex gap-4">
                          <div className="space-y-2">
                            <Label
                              htmlFor="weeklyDigestDay"
                              className="text-sm flex items-center gap-2"
                            >
                              <Clock className="h-4 w-4" />
                              Day of Week
                            </Label>
                            <Select
                              value={
                                settings.weeklyDigestDay?.toString() || "1"
                              }
                              onValueChange={handleWeeklyDayChange}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {DAYS_OF_WEEK.map((day) => (
                                  <SelectItem
                                    key={day.value}
                                    value={day.value.toString()}
                                  >
                                    {day.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor="weeklyDigestTime"
                              className="text-sm flex items-center gap-2"
                            >
                              <Clock className="h-4 w-4" />
                              Time (UTC)
                            </Label>
                            <Input
                              id="weeklyDigestTime"
                              type="time"
                              value={settings.weeklyDigestTime || "09:00"}
                              onChange={(e) =>
                                handleTimeChange(
                                  "weeklyDigestTime",
                                  e.target.value,
                                )
                              }
                              className="w-[180px]"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          You'll receive a weekly summary on this day and time
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Separator />

          {/* Notification Channels */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                <CardTitle>Notification Channels</CardTitle>
              </div>
              <CardDescription>
                Choose how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="emailNotifications"
                    className="text-base font-medium flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={settings.emailNotificationsEnabled}
                  onCheckedChange={(checked) =>
                    handleToggleChange("emailNotificationsEnabled", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-0.5">
                  <Label
                    htmlFor="pushNotifications"
                    className="text-base font-medium flex items-center gap-2"
                  >
                    <Smartphone className="h-4 w-4" />
                    Push Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications on your device (coming soon)
                  </p>
                </div>
                <Switch
                  id="pushNotifications"
                  checked={settings.pushNotificationsEnabled}
                  onCheckedChange={(checked) =>
                    handleToggleChange("pushNotificationsEnabled", checked)
                  }
                  disabled
                />
              </div>
            </CardContent>
          </Card>

          {activeTeam && (
            <>
              <Separator />
              <Card className="border-destructive/30">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <CardTitle>Data & account</CardTitle>
                  </div>
                  <CardDescription>
                    Leave the current team or delete the entire team and all its
                    data. These actions cannot be undone.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {leaveErrorCode === "ONLY_ADMIN_CANNOT_LEAVE" && (
                    <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 space-y-3">
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        You are the only admin. Assign another admin before you
                        can leave the team.
                      </p>
                      <div className="flex flex-wrap items-end gap-3">
                        <div className="space-y-2 min-w-[200px]">
                          <Label>Assign admin to</Label>
                          <Select
                            value={assignAdminUserId}
                            onValueChange={setAssignAdminUserId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a member" />
                            </SelectTrigger>
                            <SelectContent>
                              {otherNonAdminMembers.map((m) => (
                                <SelectItem key={m.id} value={m.id}>
                                  {m.name || m.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          variant="default"
                          onClick={handleMakeAdmin}
                          disabled={!assignAdminUserId || makingAdmin}
                        >
                          {makingAdmin ? (
                            <>
                              <Spinner className="mr-2 h-4 w-4" />
                              Assigning...
                            </>
                          ) : (
                            "Make admin"
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setLeaveDialogOpen(true)}
                      disabled={
                        isOnlyAdmin && otherNonAdminMembers.length === 0
                      }
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Leave team
                    </Button>
                    {teamData?.currentUser.isAdmin && (
                      <Button
                        variant="destructive"
                        onClick={() => setDeleteTeamDialogOpen(true)}
                        disabled={deletingTeam}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete entire team
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Current team:{" "}
                    <span className="font-medium">{activeTeam.name}</span>
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {/* Leave team confirmation */}
          <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Leave team?</DialogTitle>
                <DialogDescription>
                  You will lose access to this team and its data. You can be
                  re-invited later. This cannot be undone for your membership.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setLeaveDialogOpen(false)}
                  disabled={leaving}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleLeaveTeam}
                  disabled={leaving}
                >
                  {leaving ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Leaving...
                    </>
                  ) : (
                    "Leave team"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete team confirmation */}
          <Dialog
            open={deleteTeamDialogOpen}
            onOpenChange={setDeleteTeamDialogOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete entire team?</DialogTitle>
                <DialogDescription>
                  This will permanently delete the team &quot;{activeTeam?.name}
                  &quot; and all its data: tasks, routines, notes, contacts,
                  moods, and members. This cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteTeamDialogOpen(false)}
                  disabled={deletingTeam}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteTeam}
                  disabled={deletingTeam}
                >
                  {deletingTeam ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Deleting...
                    </>
                  ) : (
                    "Delete team"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

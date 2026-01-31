"use client";

import * as React from "react";
import { useTeamStore } from "@/store/use-team-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Bell,
  CheckCircle2,
  Circle,
  AlertCircle,
  Phone,
  Calendar,
  Users,
  FileText,
  Settings,
  CheckCheck,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string | null;
  linkUrl?: string | null;
  linkLabel?: string | null;
  createdAt: string;
}

const notificationIcons: Record<string, any> = {
  CONTACT_SETUP_REMINDER: Phone,
  TASK_DUE: Calendar,
  ROUTINE_MISSED: Calendar,
  TEAM_INVITE: Users,
  PERMISSION_CHANGE: Settings,
  SYSTEM_ALERT: AlertCircle,
};

const notificationColors: Record<string, string> = {
  CONTACT_SETUP_REMINDER: "text-amber-500",
  TASK_DUE: "text-red-500",
  ROUTINE_MISSED: "text-orange-500",
  TEAM_INVITE: "text-blue-500",
  PERMISSION_CHANGE: "text-purple-500",
  SYSTEM_ALERT: "text-red-600",
};

export default function NotificationsPage() {
  const { activeTeam } = useTeamStore();
  const router = useRouter();
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  const fetchNotifications = React.useCallback(async () => {
    if (!activeTeam) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/teams/${activeTeam.id}/notifications`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } else {
        throw new Error("Failed to fetch notifications");
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching notifications:", error);
      }
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [activeTeam]);

  React.useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    if (!activeTeam) return;

    try {
      const response = await fetch(
        `/api/teams/${activeTeam.id}/notifications`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "markRead",
            notificationIds: [notificationId],
          }),
        },
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId
              ? { ...n, isRead: true, readAt: new Date().toISOString() }
              : n,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error marking notification as read:", error);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!activeTeam) return;

    try {
      const response = await fetch(
        `/api/teams/${activeTeam.id}/notifications`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "markAllRead",
          }),
        },
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({
            ...n,
            isRead: true,
            readAt: n.readAt || new Date().toISOString(),
          })),
        );
        setUnreadCount(0);
        toast.success("All notifications marked as read");
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error marking all as read:", error);
      }
      toast.error("Failed to mark all as read");
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }

    if (notification.linkUrl) {
      router.push(notification.linkUrl);
    }
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    if (!activeTeam) return;
    try {
      const res = await fetch(
        `/api/teams/${activeTeam.id}/notifications?id=${encodeURIComponent(notificationId)}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        setUnreadCount((c) => {
          const n = notifications.find((x) => x.id === notificationId);
          return n && !n.isRead ? Math.max(0, c - 1) : c;
        });
        toast.success("Notification removed");
      }
    } catch {
      toast.error("Failed to remove notification");
    }
  };

  const getNotificationIcon = (type: string) => {
    const Icon = notificationIcons[type] || Bell;
    const color = notificationColors[type] || "text-muted-foreground";
    return <Icon className={`h-5 w-5 ${color}`} />;
  };

  if (!activeTeam) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-8">
          <p className="text-muted-foreground">No team selected</p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner />
      </div>
    );
  }

  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const readNotifications = notifications.filter((n) => n.isRead);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
              : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark All as Read
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {unreadNotifications.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Unread
              </h2>
              {unreadNotifications.map((notification) => (
                <Card
                  key={notification.id}
                  className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-primary"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-sm">
                            {notification.title}
                          </h3>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id);
                              }}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={(e) => handleDelete(e, notification.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {format(
                              new Date(notification.createdAt),
                              "MMM d, h:mm a",
                            )}
                          </span>
                          {notification.linkUrl && (
                            <Badge variant="outline" className="text-xs">
                              {notification.linkLabel || "View"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {readNotifications.length > 0 && (
            <div className="space-y-2 mt-6">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Read
              </h2>
              {readNotifications.map((notification) => (
                <Card
                  key={notification.id}
                  className="cursor-pointer hover:shadow-md transition-all opacity-75"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-sm">
                            {notification.title}
                          </h3>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <Circle className="h-4 w-4 text-muted-foreground" />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={(e) => handleDelete(e, notification.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {format(
                              new Date(notification.createdAt),
                              "MMM d, h:mm a",
                            )}
                          </span>
                          {notification.linkUrl && (
                            <Badge variant="outline" className="text-xs">
                              {notification.linkLabel || "View"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {notifications.length === 0 && (
            <Card className="p-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No notifications</h3>
              <p className="text-muted-foreground">
                You're all caught up! New notifications will appear here.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

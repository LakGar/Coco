"use client";

import * as React from "react";
import {
  Bell,
  Calendar,
  Users,
  Settings,
  Phone,
  AlertCircle,
  CheckCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTeamStore } from "@/store/use-team-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface NotificationItem {
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

const NOTIFICATION_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  CONTACT_SETUP_REMINDER: Phone,
  TASK_DUE: Calendar,
  ROUTINE_MISSED: Calendar,
  TEAM_INVITE: Users,
  PERMISSION_CHANGE: Settings,
  SYSTEM_ALERT: AlertCircle,
};

export function NotificationDropdown({
  variant = "header",
  className,
}: {
  variant?: "header" | "sidebar";
  className?: string;
}) {
  const router = useRouter();
  const { activeTeam } = useTeamStore();
  const [notifications, setNotifications] = React.useState<NotificationItem[]>(
    [],
  );
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const fetchNotifications = React.useCallback(async () => {
    if (!activeTeam) return;
    try {
      const res = await fetch(`/api/teams/${activeTeam.id}/notifications`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch {
      // ignore
    }
  }, [activeTeam]);

  React.useEffect(() => {
    if (!activeTeam) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [activeTeam, fetchNotifications]);

  React.useEffect(() => {
    if (open && activeTeam) {
      setLoading(true);
      fetchNotifications().finally(() => setLoading(false));
    }
  }, [open, activeTeam, fetchNotifications]);

  const handleMarkRead = async (id: string) => {
    if (!activeTeam) return;
    try {
      await fetch(`/api/teams/${activeTeam.id}/notifications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markRead", notificationIds: [id] }),
      });
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id
            ? { ...n, isRead: true, readAt: new Date().toISOString() }
            : n,
        ),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  };

  const handleItemClick = (n: NotificationItem) => {
    if (!n.isRead) handleMarkRead(n.id);
    setOpen(false);
    if (n.linkUrl) router.push(n.linkUrl);
  };

  const handleViewAll = () => {
    setOpen(false);
    router.push("/dashboard/notifications");
  };

  const recent = notifications.slice(0, 8);
  const isIcon = variant === "header";

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={isIcon ? "icon" : "sm"}
          className={cn(
            "relative",
            isIcon ? "h-8 w-8" : "w-full justify-start gap-2",
            className,
          )}
        >
          <Bell className={isIcon ? "h-5 w-5" : "h-4 w-4 shrink-0"} />
          {!isIcon && <span className="truncate">Notifications</span>}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className={cn(
                "flex items-center justify-center p-0 text-white text-xs",
                isIcon
                  ? "absolute -top-1 -right-1 h-5 w-5"
                  : "ml-auto h-5 min-w-5 px-1",
              )}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={isIcon ? "end" : "start"}
        side={isIcon ? "bottom" : "right"}
        sideOffset={4}
        className="w-80 max-h-[min(400px,80vh)] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between px-2 py-2 border-b">
          <span className="font-semibold text-sm">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={async () => {
                if (!activeTeam) return;
                try {
                  await fetch(`/api/teams/${activeTeam.id}/notifications`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "markAllRead" }),
                  });
                  setNotifications((prev) =>
                    prev.map((n) => ({
                      ...n,
                      isRead: true,
                      readAt: n.readAt || new Date().toISOString(),
                    })),
                  );
                  setUnreadCount(0);
                } catch {
                  // ignore
                }
              }}
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <div className="overflow-y-auto flex-1 min-h-0">
          {loading && recent.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading…
            </div>
          ) : recent.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications. You're all caught up.
            </div>
          ) : (
            recent.map((n) => {
              const Icon = NOTIFICATION_ICONS[n.type] || Bell;
              return (
                <DropdownMenuItem
                  key={n.id}
                  className="flex flex-col items-stretch gap-0.5 py-3 cursor-pointer"
                  onSelect={(e) => {
                    e.preventDefault();
                    handleItemClick(n);
                  }}
                >
                  <div className="flex items-start gap-2">
                    <Icon className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          !n.isRead && "text-foreground",
                        )}
                      >
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(n.createdAt), "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })
          )}
        </div>
        <div className="border-t p-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={handleViewAll}
          >
            View all notifications
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

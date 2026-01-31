"use client";

import * as React from "react";
import { useTeamStore } from "@/store/use-team-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { format } from "date-fns";
import { History, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/user-avatar";
import type { PrismaUserProfile } from "@/lib/user-types";

const ACTION_LABELS: Record<string, string> = {
  TASK_CREATED: "Created task",
  TASK_UPDATED: "Updated task",
  TASK_COMPLETED: "Completed task",
  TASK_DELETED: "Deleted task",
  MEMBER_ADDED: "Added member",
  MEMBER_REMOVED: "Removed member",
  MEMBER_LEFT: "Left team",
  PERMISSION_CHANGED: "Changed permissions",
  INVITE_SENT: "Sent invite",
  INVITE_ACCEPTED: "Accepted invite",
  TEAM_DELETED: "Deleted team",
  ROUTINE_CREATED: "Created routine",
  ROUTINE_UPDATED: "Updated routine",
  ROUTINE_DELETED: "Deleted routine",
  NOTE_CREATED: "Created note",
  NOTE_UPDATED: "Updated note",
  NOTE_DELETED: "Deleted note",
  CONTACT_CREATED: "Created contact",
  CONTACT_UPDATED: "Updated contact",
  CONTACT_DELETED: "Deleted contact",
  JOURNEY_SECTION_UPDATED: "Updated care plan section",
  JOURNEY_ENTRY_CREATED: "Added journey entry",
  JOURNEY_SNAPSHOT_COMPUTED: "Computed journey snapshot",
  MOOD_LOGGED: "Logged mood",
  ROUTINE_INSTANCE_CREATED: "Journal entry",
  ROUTINE_INSTANCE_UPDATED: "Updated journal entry",
};

interface AuditItem {
  id: string;
  teamId: string;
  actorId: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: PrismaUserProfile;
}

export default function AuditPage() {
  const { activeTeam } = useTeamStore();
  const [items, setItems] = React.useState<AuditItem[]>([]);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);

  const fetchAudit = React.useCallback(
    async (cursor?: string) => {
      if (!activeTeam) return;
      try {
        if (!cursor) setLoading(true);
        else setLoadingMore(true);
        const url = cursor
          ? `/api/teams/${activeTeam.id}/audit?cursor=${encodeURIComponent(cursor)}`
          : `/api/teams/${activeTeam.id}/audit`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to load audit log");
        const data = await res.json();
        if (cursor) {
          setItems((prev) => [...prev, ...(data.items || [])]);
        } else {
          setItems(data.items || []);
        }
        setNextCursor(data.nextCursor ?? null);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load audit trail");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeTeam],
  );

  React.useEffect(() => {
    fetchAudit();
  }, [fetchAudit]);

  const actorName = (actor: AuditItem["actor"]) =>
    actor.name ||
    [actor.firstName, actor.lastName].filter(Boolean).join(" ") ||
    actor.email;

  const actorInitials = (actor: AuditItem["actor"]) => {
    const name = actorName(actor);
    if (actor.firstName && actor.lastName)
      return `${actor.firstName[0]}${actor.lastName[0]}`.toUpperCase();
    if (name && name.length >= 2) return name.slice(0, 2).toUpperCase();
    if (actor.email) return actor.email.slice(0, 2).toUpperCase();
    return "?";
  };

  const metadataSummary = (meta: Record<string, unknown> | null) => {
    if (!meta) return null;
    if (meta.name && typeof meta.name === "string") return meta.name;
    if (meta.title && typeof meta.title === "string") return meta.title;
    if (meta.teamName && typeof meta.teamName === "string")
      return meta.teamName;
    if (meta.removedName && typeof meta.removedName === "string")
      return meta.removedName;
    if (meta.email && typeof meta.email === "string") return meta.email;
    if (meta.sectionKey && typeof meta.sectionKey === "string")
      return meta.sectionKey;
    return null;
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
        <div className="text-center">
          <Spinner className="mx-auto mb-4 text-primary" size="lg" />
          <p className="text-muted-foreground">Loading audit trail...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden w-full">
      <div className="shrink-0 border-b bg-background w-full sticky top-0 z-50">
        <div className="px-4 py-4">
          <h1 className="text-2xl md:text-3xl font-bold truncate flex items-center gap-2">
            <History className="h-8 w-8 text-muted-foreground" />
            Audit trail
          </h1>
          <p className="text-sm text-muted-foreground truncate mt-1">
            Activity log for {activeTeam.patientName || activeTeam.name}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {items.length === 0 ? (
          <Card className="p-12 text-center max-w-md mx-auto">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
            <p className="text-muted-foreground">
              Actions in this team will appear here.
            </p>
          </Card>
        ) : (
          <ul className="space-y-2 max-w-3xl mx-auto">
            {items.map((item) => {
              const summary = metadataSummary(item.metadata);
              const actionLabel = ACTION_LABELS[item.action] ?? item.action;
              return (
                <li key={item.id}>
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3 min-w-0">
                      <UserAvatar
                        src={item.actor.imageUrl ?? undefined}
                        alt={actorName(item.actor)}
                        fallback={actorInitials(item.actor)}
                        className="h-9 w-9 shrink-0"
                      />
                      <div className="flex-1 min-w-0 flex items-baseline gap-2 flex-wrap">
                        <span className="font-medium shrink-0">
                          {actorName(item.actor)}
                        </span>
                        <span className="text-muted-foreground text-sm shrink-0">
                          {actionLabel}
                          {summary != null && (
                            <span className="text-muted-foreground/90">
                              {" "}
                              “{summary}”
                            </span>
                          )}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                        {format(
                          new Date(item.createdAt),
                          "MMM d, yyyy · h:mm a",
                        )}
                      </span>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
        {nextCursor && (
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              onClick={() => fetchAudit(nextCursor)}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Load more
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

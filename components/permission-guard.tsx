"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { useDataStore } from "@/store/use-data-store";
import { useTeamStore } from "@/store/use-team-store";

interface PermissionGuardProps {
  permission:
    | "canViewTasks"
    | "canViewNotes"
    | "canViewRoutines"
    | "canViewContacts"
    | "canViewMoods"
    | "canViewBurdenScales"
    | "canViewMembers";
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGuard({
  permission,
  children,
  fallback,
}: PermissionGuardProps) {
  const { activeTeam } = useTeamStore();
  const { teamData: teamDataFromStore } = useDataStore();

  const teamData = React.useMemo(() => {
    if (!activeTeam) return null;
    return teamDataFromStore[activeTeam.id] || null;
  }, [teamDataFromStore, activeTeam]);

  // Admins have all permissions
  if (teamData?.currentUser.isAdmin) {
    return <>{children}</>;
  }

  // Check if user has the required permission
  const hasPermission = teamData?.currentUser[permission] ?? false;

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <Card className="p-8 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You do not have permission to view this page. Please contact your
            team admin to request access.
          </p>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

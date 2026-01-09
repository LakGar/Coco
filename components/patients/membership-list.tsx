"use client";

import { PatientMembership, PatientInvite } from "@/utils/supabase/patients";
import { User, Mail, CheckCircle, Clock } from "lucide-react";

interface PatientMembershipListProps {
  memberships: PatientMembership[];
  invites: PatientInvite[];
  isOwner: boolean;
}

export function PatientMembershipList({
  memberships,
  invites,
  isOwner,
}: PatientMembershipListProps) {
  const acceptedMemberships = memberships.filter((m) => m.status === "accepted");
  const pendingMemberships = memberships.filter((m) => m.status === "pending");
  const activeInvites = invites.filter(
    (i) => !i.accepted_at && !i.revoked_at && new Date(i.expires_at) > new Date()
  );

  if (acceptedMemberships.length === 0 && activeInvites.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No members in the care circle yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {acceptedMemberships.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Members</h3>
          <div className="space-y-2">
            {acceptedMemberships.map((membership) => (
              <div
                key={`${membership.patient_id}-${membership.user_id}`}
                className="flex items-center justify-between p-3 border rounded-md"
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">User {membership.user_id.slice(0, 8)}</span>
                  <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
                    {membership.role}
                  </span>
                </div>
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingMemberships.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Pending</h3>
          <div className="space-y-2">
            {pendingMemberships.map((membership) => (
              <div
                key={`${membership.patient_id}-${membership.user_id}`}
                className="flex items-center justify-between p-3 border rounded-md"
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">User {membership.user_id.slice(0, 8)}</span>
                  <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
                    {membership.role}
                  </span>
                </div>
                <Clock className="w-4 h-4 text-yellow-600" />
              </div>
            ))}
          </div>
        </div>
      )}

      {isOwner && activeInvites.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Active Invites</h3>
          <div className="space-y-2">
            {activeInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between p-3 border rounded-md"
              >
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{invite.email}</span>
                  <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
                    {invite.role}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Expires {new Date(invite.expires_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptInviteAction } from "@/app/actions/patients";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";

export function AcceptInviteForm({ token }: { token: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [patientId, setPatientId] = useState<string | null>(null);

  const handleAccept = async () => {
    setError(null);
    setLoading(true);

    try {
      const result = await acceptInviteAction(token);
      if (result.success) {
        setSuccess(true);
        setPatientId(result.data.patientId);
        // Redirect to patient page after 2 seconds
        setTimeout(() => {
          router.push(`/dashboard/patients/${result.data.patientId}`);
        }, 2000);
      } else {
        setError(result.error || "Failed to accept invite");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center space-y-4">
        <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
        <div>
          <h2 className="text-lg font-semibold mb-2">Invite Accepted!</h2>
          <p className="text-sm text-muted-foreground">
            You've been added to the care circle. Redirecting...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-2">Join Care Circle</h2>
        <p className="text-sm text-muted-foreground">
          Accept this invite to join a patient's care circle and help manage their care.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-md flex items-center gap-2">
          <XCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <Button
        onClick={handleAccept}
        disabled={loading}
        className="w-full"
      >
        {loading ? "Accepting..." : "Accept Invite"}
      </Button>
    </div>
  );
}


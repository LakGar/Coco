"use client";

import { useState } from "react";
import { inviteCaregiverAction } from "@/app/actions/patients";
import { Button } from "@/components/ui/button";
import { UserPlus, Copy, Check } from "lucide-react";

export function InviteForm({ patientId }: { patientId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"caregiver" | "viewer">("caregiver");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await inviteCaregiverAction(patientId, email, role);
      if (result.success) {
        setInviteUrl(result.data.inviteUrl);
        setEmail("");
        setIsOpen(false);
      } else {
        setError(result.error || "Failed to create invite");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (inviteUrl) {
    return (
      <div className="space-y-4 p-4 bg-muted rounded-lg">
        <div>
          <p className="text-sm font-medium mb-2">Invite created!</p>
          <p className="text-xs text-muted-foreground mb-2">
            Share this link with the caregiver. They can only use it once.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={inviteUrl}
              readOnly
              className="flex-1 px-3 py-2 text-sm border border-input rounded-md bg-background"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setInviteUrl(null);
            setIsOpen(true);
          }}
        >
          Create Another Invite
        </Button>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)}>
        <UserPlus className="w-4 h-4 mr-2" />
        Invite Caregiver
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          required
          className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={loading}
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "caregiver" | "viewer")}
          className="w-full px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={loading}
        >
          <option value="caregiver">Caregiver</option>
          <option value="viewer">Viewer</option>
        </select>
      </div>
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {error}
        </div>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading || !email.trim()}>
          {loading ? "Creating..." : "Create Invite"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setIsOpen(false);
            setEmail("");
            setError(null);
          }}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}


"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

interface AddTeamMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  onSuccess?: () => void;
}

export function AddTeamMemberModal({
  open,
  onOpenChange,
  teamId,
  onSuccess,
}: AddTeamMemberModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    teamRole: "CAREGIVER" as "CAREGIVER" | "FAMILY" | "PHYSICIAN" | "PATIENT",
    isAdmin: false,
    accessLevel: "FULL" as "FULL" | "READ_ONLY",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/teams/${teamId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to invite team member");
      }

      const data = await response.json();
      toast.success(`Invitation sent to ${formData.email}`);

      // Reset form
      setFormData({
        email: "",
        name: "",
        teamRole: "CAREGIVER",
        isAdmin: false,
        accessLevel: "FULL",
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error inviting team member:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to invite team member",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Invite a new member to join your care team. They will receive an
            email invitation.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="member@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="teamRole">Role *</Label>
              <Select
                value={formData.teamRole}
                onValueChange={(
                  value: "CAREGIVER" | "FAMILY" | "PHYSICIAN" | "PATIENT",
                ) => setFormData({ ...formData, teamRole: value })}
                disabled={loading}
              >
                <SelectTrigger id="teamRole">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CAREGIVER">Caregiver</SelectItem>
                  <SelectItem value="FAMILY">Family Member</SelectItem>
                  <SelectItem value="PHYSICIAN">Physician</SelectItem>
                  <SelectItem value="PATIENT">Patient</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accessLevel">Access Level *</Label>
              <Select
                value={formData.accessLevel}
                onValueChange={(value: "FULL" | "READ_ONLY") =>
                  setFormData({ ...formData, accessLevel: value })
                }
                disabled={loading}
              >
                <SelectTrigger id="accessLevel">
                  <SelectValue placeholder="Select access level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FULL">Full Access</SelectItem>
                  <SelectItem value="READ_ONLY">Read Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isAdmin"
                checked={formData.isAdmin}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isAdmin: checked === true })
                }
                disabled={loading}
              />
              <Label
                htmlFor="isAdmin"
                className="text-sm font-normal cursor-pointer"
              >
                Make this member an admin
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Sending...
                </>
              ) : (
                "Send Invitation"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

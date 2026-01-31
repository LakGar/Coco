"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BadgeCheck, Save } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  imageUrl: string | null;
}

export default function AccountPage() {
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    name: "",
    firstName: "",
    lastName: "",
  });

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/user/profile")
      .then((res) =>
        res.ok ? res.json() : Promise.reject(new Error("Failed to load")),
      )
      .then((data) => {
        if (!cancelled && data.user) {
          setProfile(data.user);
          setForm({
            name: data.user.name ?? "",
            firstName: data.user.firstName ?? "",
            lastName: data.user.lastName ?? "",
          });
        }
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load profile");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name || undefined,
          firstName: form.firstName || undefined,
          lastName: form.lastName || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const data = await res.json();
      setProfile(data.user);
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="text-primary" size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              Could not load your account.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName =
    profile.name ||
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
    profile.email;

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex h-14 items-center gap-4 px-6">
          <h1 className="text-lg font-semibold">Account</h1>
          <p className="text-sm text-muted-foreground">
            Manage your profile and preferences
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BadgeCheck className="h-5 w-5" />
                Profile
              </CardTitle>
              <CardDescription>
                Your name and email. Email is managed by your sign-in provider.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={profile.imageUrl ?? undefined}
                    alt={displayName}
                  />
                  <AvatarFallback className="text-lg">
                    {displayName
                      .split(/\s+/)
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm text-muted-foreground">
                  Profile photo is synced from your sign-in provider and cannot
                  be changed here.
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    value={form.firstName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, firstName: e.target.value }))
                    }
                    placeholder="First name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    value={form.lastName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, lastName: e.target.value }))
                    }
                    placeholder="Last name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Display name (optional)</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="How you want to be shown"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={profile.email} disabled className="bg-muted" />
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Spinner className="mr-2 h-4 w-4" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save changes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

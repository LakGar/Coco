"use client";

import { useState } from "react";
import { createPatientAction } from "@/app/actions/patients";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function CreatePatientForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await createPatientAction(firstName);
      if (result.success) {
        // Refresh the page to show new patient
        window.location.reload();
      } else {
        setError(result.error || "Failed to create patient");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="w-4 h-4 mr-2" />
        Add Patient
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First name"
          required
          minLength={1}
          maxLength={100}
          className="flex-1 px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={loading}
        />
        <Button type="submit" disabled={loading || !firstName.trim()}>
          {loading ? "Creating..." : "Create"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setIsOpen(false);
            setFirstName("");
            setError(null);
          }}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {error}
        </div>
      )}
    </form>
  );
}


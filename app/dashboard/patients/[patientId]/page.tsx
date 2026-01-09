import { getPatient, getPatientMemberships, getPatientInvites, isPatientOwner } from "@/utils/supabase/patients";
import { redirect, notFound } from "next/navigation";
import { getCurrentProfile } from "@/utils/supabase/profile";
import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InviteForm } from "@/components/patients/invite-form";
import { PatientMembershipList } from "@/components/patients/membership-list";

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile || !profile.display_name) {
    redirect("/onboarding");
  }

  const { patientId } = await params;
  const patient = await getPatient(patientId);

  if (!patient) {
    notFound();
  }

  const memberships = await getPatientMemberships(patientId);
  const invites = await getPatientInvites(patientId);
  const isOwner = await isPatientOwner(patientId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/patients">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {patient.first_name}
          </h1>
          {patient.archived && (
            <p className="text-sm text-muted-foreground">Archived</p>
          )}
        </div>
      </div>

      {isOwner && (
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Care Circle</h2>
            <InviteForm patientId={patientId} />
          </div>
          <PatientMembershipList
            memberships={memberships}
            invites={invites}
            isOwner={isOwner}
          />
        </div>
      )}

      {!isOwner && (
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Care Circle</h2>
          <PatientMembershipList
            memberships={memberships}
            invites={[]}
            isOwner={false}
          />
        </div>
      )}
    </div>
  );
}


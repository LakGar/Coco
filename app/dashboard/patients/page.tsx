import { getAccessiblePatients } from "@/utils/supabase/patients";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/utils/supabase/profile";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreatePatientForm } from "@/components/patients/create-patient-form";

export default async function PatientsPage() {
  const profile = await getCurrentProfile();
  if (!profile || !profile.display_name) {
    redirect("/onboarding");
  }

  const patients = await getAccessiblePatients();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patients</h1>
          <p className="text-muted-foreground">
            Manage your patients and care circle
          </p>
        </div>
        <CreatePatientForm />
      </div>

      {patients.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No patients yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Get started by creating your first patient
          </p>
          <CreatePatientForm />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {patients.map((patient) => (
            <Link
              key={patient.id}
              href={`/dashboard/patients/${patient.id}`}
              className="rounded-lg border bg-card p-6 hover:bg-accent transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold">{patient.first_name}</h3>
                {patient.archived && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    Archived
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Created {new Date(patient.created_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}


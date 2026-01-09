import { getCurrentProfile } from "@/utils/supabase/profile";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const profile = await getCurrentProfile();

  if (!profile || !profile.display_name) {
    redirect("/onboarding");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {profile.display_name}
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your patients today.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">
            Total Patients
          </div>
          <div className="mt-2 text-2xl font-bold">0</div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">
            Active Sessions
          </div>
          <div className="mt-2 text-2xl font-bold">0</div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">
            This Month
          </div>
          <div className="mt-2 text-2xl font-bold">0</div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="text-sm font-medium text-muted-foreground">
            Pending
          </div>
          <div className="mt-2 text-2xl font-bold">0</div>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <p className="text-sm text-muted-foreground">
          No recent activity. Start by adding your first patient.
        </p>
      </div>
    </div>
  );
}


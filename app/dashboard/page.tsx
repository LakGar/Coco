import { getCurrentProfile } from "@/utils/supabase/profile";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const profile = await getCurrentProfile();

  if (!profile || !profile.display_name) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-light text-gray-900 mb-4">
          Welcome back, {profile.display_name}
        </h1>
        <p className="text-gray-600">
          This is your dashboard. More features coming soon.
        </p>
      </div>
    </div>
  );
}


import { acceptInviteAction } from "@/app/actions/patients";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/utils/supabase/profile";
import { AcceptInviteForm } from "@/components/patients/accept-invite-form";

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile || !profile.display_name) {
    // Redirect to signin with redirect back to this page
    redirect(`/signin?redirect=/dashboard/invites/${(await params).token}`);
  }

  const { token } = await params;

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Accept Invite</h1>
        <p className="text-muted-foreground">
          Join a patient's care circle
        </p>
      </div>
      <AcceptInviteForm token={token} />
    </div>
  );
}


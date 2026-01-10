import { auth, currentUser } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { NextResponse } from "next/server";

/**
 * API route to get/create a Supabase session for the current Clerk user
 * This allows client-side code to authenticate with Supabase after Clerk auth
 */
export async function GET() {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = getSupabaseAdmin();

  // Get the mapping
  const { data: mapping, error: mappingError } = await adminClient
    .from("clerk_user_mappings")
    .select("supabase_user_id, email")
    .eq("clerk_user_id", clerkUserId)
    .single();

  if (mappingError || !mapping) {
    return NextResponse.json(
      { error: "User not synced to Supabase" },
      { status: 404 }
    );
  }

  // Generate a magic link for the user (this creates a session)
  // Note: In production, you might want to use a different approach
  // like creating a custom JWT token
  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email: mapping.email || "",
  });

  if (linkError || !linkData) {
    return NextResponse.json(
      { error: "Failed to generate session", details: linkError?.message },
      { status: 500 }
    );
  }

  // Extract the token from the magic link
  // The magic link format is: {url}#access_token=...&refresh_token=...
  const url = new URL(linkData.properties.action_link);
  const accessToken = url.hash.split("access_token=")[1]?.split("&")[0];
  const refreshToken = url.hash.split("refresh_token=")[1]?.split("&")[0];

  if (!accessToken) {
    return NextResponse.json(
      { error: "Failed to extract session token" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    access_token: accessToken,
    refresh_token: refreshToken,
    supabase_user_id: mapping.supabase_user_id,
  });
}


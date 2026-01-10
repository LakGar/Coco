import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";

export async function POST(req: Request) {
  // Get the Svix headers for verification
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occurred -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occurred", {
      status: 400,
    });
  }

  const supabase = getSupabaseAdmin();

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id: clerkUserId, email_addresses, first_name, last_name } = evt.data;

    const email = email_addresses?.[0]?.email_address;
    if (!email) {
      console.error("No email found for Clerk user:", clerkUserId);
      return new Response("No email found", { status: 400 });
    }

    try {
      // Create Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true, // Auto-confirm email since Clerk already verified it
        user_metadata: {
          clerk_user_id: clerkUserId,
          first_name,
          last_name,
        },
      });

      if (authError) {
        console.error("Error creating Supabase user:", authError);
        return new Response(
          JSON.stringify({ error: "Failed to create Supabase user", details: authError.message }),
          { status: 500 }
        );
      }

      if (!authData.user) {
        return new Response("Failed to create Supabase user", { status: 500 });
      }

      // Create mapping record
      const { error: mappingError } = await supabase
        .from("clerk_user_mappings")
        .insert({
          clerk_user_id: clerkUserId,
          supabase_user_id: authData.user.id,
          email: email,
        });

      if (mappingError) {
        console.error("Error creating mapping:", mappingError);
        // Try to clean up the Supabase user if mapping fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        return new Response(
          JSON.stringify({ error: "Failed to create mapping", details: mappingError.message }),
          { status: 500 }
        );
      }

      console.log(`Successfully synced Clerk user ${clerkUserId} to Supabase user ${authData.user.id}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          clerk_user_id: clerkUserId,
          supabase_user_id: authData.user.id 
        }),
        { status: 200 }
      );
    } catch (error) {
      console.error("Unexpected error:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error", details: String(error) }),
        { status: 500 }
      );
    }
  }

  if (eventType === "user.updated") {
    const { id: clerkUserId, email_addresses, first_name, last_name } = evt.data;
    const email = email_addresses?.[0]?.email_address;

    if (!email) {
      return new Response("No email found", { status: 400 });
    }

    try {
      // Get the mapping
      const { data: mapping, error: mappingError } = await supabase
        .from("clerk_user_mappings")
        .select("supabase_user_id")
        .eq("clerk_user_id", clerkUserId)
        .single();

      if (mappingError || !mapping) {
        console.error("Mapping not found for Clerk user:", clerkUserId);
        return new Response("Mapping not found", { status: 404 });
      }

      // Update Supabase Auth user
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        mapping.supabase_user_id,
        {
          email,
          user_metadata: {
            clerk_user_id: clerkUserId,
            first_name,
            last_name,
          },
        }
      );

      if (updateError) {
        console.error("Error updating Supabase user:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update Supabase user", details: updateError.message }),
          { status: 500 }
        );
      }

      // Update mapping email if changed
      await supabase
        .from("clerk_user_mappings")
        .update({ email })
        .eq("clerk_user_id", clerkUserId);

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
      console.error("Unexpected error:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error", details: String(error) }),
        { status: 500 }
      );
    }
  }

  if (eventType === "user.deleted") {
    const { id: clerkUserId } = evt.data;

    try {
      // Get the mapping
      const { data: mapping, error: mappingError } = await supabase
        .from("clerk_user_mappings")
        .select("supabase_user_id")
        .eq("clerk_user_id", clerkUserId)
        .single();

      if (mappingError || !mapping) {
        // Mapping might already be deleted (cascade), that's okay
        console.log("Mapping not found for deleted Clerk user:", clerkUserId);
        return new Response(JSON.stringify({ success: true, note: "Mapping not found" }), {
          status: 200,
        });
      }

      // Delete Supabase Auth user (this will cascade delete the mapping)
      const { error: deleteError } = await supabase.auth.admin.deleteUser(mapping.supabase_user_id);

      if (deleteError) {
        console.error("Error deleting Supabase user:", deleteError);
        return new Response(
          JSON.stringify({ error: "Failed to delete Supabase user", details: deleteError.message }),
          { status: 500 }
        );
      }

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
      console.error("Unexpected error:", error);
      return new Response(
        JSON.stringify({ error: "Internal server error", details: String(error) }),
        { status: 500 }
      );
    }
  }

  return new Response("", { status: 200 });
}


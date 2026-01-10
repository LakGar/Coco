import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getSupabaseAdmin, getSupabaseUserId } from "@/lib/supabase/client";

export async function POST(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      displayName,
      phoneNumber,
      timezone,
      notificationPreference,
      userRole,
      caringForSomeone,
      patientName,
      dementiaStage,
      whatHelps,
      whatTriggers,
      baselineNotes,
      invites,
      dailyTrackingItems,
      morningCheckinTime,
      eveningCheckinTime,
      weeklySummaryEnabled,
      weeklySummaryTime,
      carePlanWorks,
      carePlanAvoid,
      carePlanSteps,
      selectedGroups,
      consentAccepted,
    } = body;

    // Validation
    if (!displayName || !displayName.trim()) {
      return NextResponse.json(
        { error: "Display name is required" },
        { status: 400 }
      );
    }

    if (!phoneNumber || !phoneNumber.trim()) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    if (!timezone) {
      return NextResponse.json(
        { error: "Timezone is required" },
        { status: 400 }
      );
    }

    if (!consentAccepted) {
      return NextResponse.json(
        { error: "Consent is required" },
        { status: 400 }
      );
    }

    // Get Supabase user ID
    const supabaseUserId = await getSupabaseUserId();

    if (!supabaseUserId) {
      return NextResponse.json(
        { error: "User not synced to Supabase. Please try again in a moment." },
        { status: 404 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Update user profile
    const { error: profileError } = await supabase
      .from("user_profiles")
      .update({
        display_name: displayName.trim(),
        timezone: timezone,
      })
      .eq("user_id", supabaseUserId);

    if (profileError) {
      console.error("Error updating user profile:", profileError);
      return NextResponse.json(
        { error: "Failed to update profile", details: profileError.message },
        { status: 500 }
      );
    }

    // Update user settings with notification preferences and phone
    const notificationPrefs = {
      email: notificationPreference === "email" || notificationPreference === "both",
      text: notificationPreference === "text" || notificationPreference === "both",
      phone_number: phoneNumber.trim(),
      daily_tracking_items: dailyTrackingItems || [],
      morning_checkin_time: morningCheckinTime || "09:00",
      evening_checkin_time: eveningCheckinTime || "20:00",
      weekly_summary_enabled: weeklySummaryEnabled || false,
      weekly_summary_time: weeklySummaryTime || "18:00",
    };

    const { error: settingsError } = await supabase
      .from("user_settings")
      .update({
        notification_prefs: notificationPrefs,
      })
      .eq("user_id", supabaseUserId);

    if (settingsError) {
      console.error("Error updating user settings:", settingsError);
    }

    // Save consent
    if (consentAccepted) {
      await supabase.from("user_consents").insert({
        user_id: supabaseUserId,
        consent_type: "terms_of_service",
        consent_version: "1.0",
        metadata: { user_role: userRole },
      });
    }

    // Create patient if user is caring for someone
    let patientId: string | null = null;
    if (caringForSomeone === "yes" && patientName) {
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .insert({
          created_by: supabaseUserId,
          owner_user_id: supabaseUserId,
          display_name: patientName.trim(),
          dementia_stage: dementiaStage || null,
          baseline_notes: [
            ...(whatHelps || []).map((h: string) => `Helps: ${h}`),
            ...(whatTriggers || []).map((t: string) => `Triggers: ${t}`),
            baselineNotes || "",
          ]
            .filter(Boolean)
            .join("\n\n"),
        })
        .select()
        .single();

      if (patientError) {
        console.error("Error creating patient:", patientError);
      } else {
        patientId = patientData.id;

        // Create care plan items
        const carePlanItems = [
          ...(carePlanWorks || []).map((text: string, idx: number) => ({
            patient_id: patientId,
            category: "works" as const,
            text: text.trim(),
            sort_order: idx,
            created_by: supabaseUserId,
          })),
          ...(carePlanAvoid || []).map((text: string, idx: number) => ({
            patient_id: patientId,
            category: "avoid" as const,
            text: text.trim(),
            sort_order: idx,
            created_by: supabaseUserId,
          })),
          ...(carePlanSteps || []).map((text: string, idx: number) => ({
            patient_id: patientId,
            category: "steps" as const,
            text: text.trim(),
            sort_order: idx,
            created_by: supabaseUserId,
          })),
        ];

        if (carePlanItems.length > 0) {
          await supabase.from("care_plan_items").insert(carePlanItems);
        }

        // Create patient invites
        if (invites && invites.length > 0) {
          const inviteItems = invites
            .filter((inv: any) => inv.email && inv.email.trim())
            .map((inv: any) => ({
              patient_id: patientId,
              invited_email: inv.email.trim(),
              role: inv.role || "caregiver",
              token: crypto.randomUUID(),
              status: "invited" as const,
              created_by: supabaseUserId,
            }));

          if (inviteItems.length > 0) {
            await supabase.from("patient_invites").insert(inviteItems);
          }
        }
      }
    }

    // Handle support groups
    if (selectedGroups && selectedGroups.length > 0) {
      // For now, we'll create group join requests
      // In production, you might want to auto-join public groups or create groups
      for (const groupName of selectedGroups) {
        // Check if group exists, if not create it
        const { data: existingGroup } = await supabase
          .from("groups")
          .select("id")
          .eq("name", groupName)
          .single();

        let groupId: string;

        if (existingGroup) {
          groupId = existingGroup.id;
        } else {
          // Create public group
          const { data: newGroup, error: groupError } = await supabase
            .from("groups")
            .insert({
              created_by: supabaseUserId,
              name: groupName,
              visibility: "public",
              topic: groupName.toLowerCase().replace(/\s+/g, "_"),
            })
            .select()
            .single();

          if (groupError) {
            console.error("Error creating group:", groupError);
            continue;
          }
          groupId = newGroup.id;
        }

        // Add user to group
        await supabase.from("group_memberships").insert({
          group_id: groupId,
          user_id: supabaseUserId,
          role: "member",
          status: "active",
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Onboarding completed successfully",
      patientId,
    });
  } catch (error) {
    console.error("Error in onboarding API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

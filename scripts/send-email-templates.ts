/**
 * Script to send all email templates to a specified email address
 * Usage: npx tsx scripts/send-email-templates.ts
 */

import { Resend } from "resend";
import { getInviteEmailTemplate } from "../lib/email";

// Load environment variables from .env.local
// In Next.js, we need to manually load them for scripts
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnvFile() {
  try {
    const envPath = resolve(process.cwd(), ".env.local");
    const envFile = readFileSync(envPath, "utf-8");
    const envVars: Record<string, string> = {};

    envFile.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        if (key && valueParts.length > 0) {
          const value = valueParts.join("=").replace(/^["']|["']$/g, "");
          envVars[key.trim()] = value.trim();
        }
      }
    });

    Object.assign(process.env, envVars);
  } catch (error) {
    console.warn("Could not load .env.local file:", error);
  }
}

loadEnvFile();

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Coco <hello@joincoco.app>";
const TARGET_EMAIL = "lakgarg2002@gmail.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

if (!RESEND_API_KEY) {
  console.error("❌ RESEND_API_KEY is not set in .env.local");
  process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);

async function sendEmailTemplate(
  subject: string,
  html: string,
  templateName: string
) {
  try {
    console.log(`📧 Sending ${templateName}...`);
    const { data, error } = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: TARGET_EMAIL,
      subject: `[Coco Email Templates] ${subject}`,
      html,
    });

    if (error) {
      console.error(`❌ Error sending ${templateName}:`, error);
      return false;
    }

    console.log(`✅ Successfully sent ${templateName} (ID: ${data?.id})`);
    return true;
  } catch (error) {
    console.error(`❌ Exception sending ${templateName}:`, error);
    return false;
  }
}

async function sendAllTemplates() {
  console.log("🚀 Starting to send all email templates...\n");
  console.log(`From: ${RESEND_FROM_EMAIL}`);
  console.log(`To: ${TARGET_EMAIL}\n`);

  const results: { name: string; success: boolean }[] = [];

  // Template 1: Patient Invite Email
  const patientInviteHtml = getInviteEmailTemplate({
    inviteUrl: `${APP_URL}/accept-invite?code=test-patient-invite-code-12345`,
    inviterName: "Dr. Sarah Johnson",
    teamName: "John's Care Team",
    role: "PATIENT",
    isPatient: true,
    invitedName: "John",
  });
  results.push({
    name: "Patient Invite Email",
    success: await sendEmailTemplate(
      "Patient Invite - Welcome to Care Team",
      patientInviteHtml,
      "Patient Invite Email"
    ),
  });

  // Wait a bit between emails to avoid rate limits
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Template 2: Caregiver Invite Email
  const caregiverInviteHtml = getInviteEmailTemplate({
    inviteUrl: `${APP_URL}/accept-invite?code=test-caregiver-invite-code-67890`,
    inviterName: "Dr. Sarah Johnson",
    teamName: "John's Care Team",
    role: "CAREGIVER",
    isPatient: false,
    invitedName: "Jane",
  });
  results.push({
    name: "Caregiver Invite Email",
    success: await sendEmailTemplate(
      "Caregiver Invite - Join Care Team",
      caregiverInviteHtml,
      "Caregiver Invite Email"
    ),
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Template 3: Doctor Invite Email
  const doctorInviteHtml = getInviteEmailTemplate({
    inviteUrl: `${APP_URL}/accept-invite?code=test-doctor-invite-code-abcde`,
    inviterName: "Dr. Sarah Johnson",
    teamName: "John's Care Team",
    role: "DOCTOR",
    isPatient: false,
    invitedName: "Dr. Michael Chen",
  });
  results.push({
    name: "Doctor Invite Email",
    success: await sendEmailTemplate(
      "Doctor Invite - Join Care Team",
      doctorInviteHtml,
      "Doctor Invite Email"
    ),
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Template 4: Nurse Invite Email
  const nurseInviteHtml = getInviteEmailTemplate({
    inviteUrl: `${APP_URL}/accept-invite?code=test-nurse-invite-code-fghij`,
    inviterName: "Dr. Sarah Johnson",
    teamName: "John's Care Team",
    role: "NURSE",
    isPatient: false,
    invitedName: "Nurse Emily",
  });
  results.push({
    name: "Nurse Invite Email",
    success: await sendEmailTemplate(
      "Nurse Invite - Join Care Team",
      nurseInviteHtml,
      "Nurse Invite Email"
    ),
  });

  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Template 5: Patient Invite without name
  const patientInviteNoNameHtml = getInviteEmailTemplate({
    inviteUrl: `${APP_URL}/accept-invite?code=test-patient-no-name-12345`,
    inviterName: "Dr. Sarah Johnson",
    teamName: "John's Care Team",
    role: "PATIENT",
    isPatient: true,
  });
  results.push({
    name: "Patient Invite (No Name)",
    success: await sendEmailTemplate(
      "Patient Invite - No Name Provided",
      patientInviteNoNameHtml,
      "Patient Invite (No Name)"
    ),
  });

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 Summary:");
  console.log("=".repeat(50));
  results.forEach((result) => {
    console.log(`${result.success ? "✅" : "❌"} ${result.name}`);
  });
  console.log("=".repeat(50));
  const successCount = results.filter((r) => r.success).length;
  console.log(`\nSent ${successCount}/${results.length} emails successfully`);
}

// Run the script
sendAllTemplates()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });

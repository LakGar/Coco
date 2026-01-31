import { Resend } from "resend";
import { log, loggerUtils } from "./logger";

if (!process.env.RESEND_API_KEY) {
  log.warn(
    { type: "email_config_missing" },
    "RESEND_API_KEY is not set. Email sending will be disabled.",
  );
  log.warn(
    { type: "email_config_missing" },
    "For testing, sign up at https://resend.com and add RESEND_API_KEY to .env.local",
  );
}

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendInviteEmail({
  to,
  inviteCode,
  inviterName,
  teamName,
  role,
  isPatient = false,
  invitedName,
}: {
  to: string;
  inviteCode: string;
  inviterName: string;
  teamName: string;
  role: string;
  isPatient?: boolean;
  invitedName?: string;
}) {
  if (!resend) {
    log.info(
      { type: "email_not_configured", to },
      "Email service not configured. Would send invite",
    );
    return { success: false, error: "Email service not configured" };
  }

  // Use production URL if in production, otherwise use NEXT_PUBLIC_APP_URL or localhost
  const isProduction =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production";
  const appUrl = isProduction
    ? "https://joincoco.app"
    : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const inviteUrl = `${appUrl}/accept-invite?code=${inviteCode}`;

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Coco <onboarding@resend.dev>",
      to,
      subject: isPatient
        ? `You've been invited to join ${teamName}`
        : `${inviterName} invited you to join ${teamName}`,
      html: getInviteEmailTemplate({
        inviteUrl,
        inviterName,
        teamName,
        role,
        isPatient,
        invitedName,
      }),
    });

    if (error) {
      loggerUtils.logError(error, { type: "email_send_error", to, teamName });
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    loggerUtils.logError(error, { type: "email_send_error", to, teamName });
    return { success: false, error };
  }
}

export function getInviteEmailTemplate({
  inviteUrl,
  inviterName,
  teamName,
  role,
  isPatient,
  invitedName,
}: {
  inviteUrl: string;
  inviterName: string;
  teamName: string;
  role: string;
  isPatient: boolean;
  invitedName?: string;
}) {
  const roleDisplay = role
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");

  // Determine logo URL - use production URL in production, otherwise use the app URL
  const isProduction =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production";
  const logoUrl =
    "https://www.joincoco.app/_next/image?url=%2Flogo.png&w=1920&q=75";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Join ${teamName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Georgia, 'Times New Roman', serif; background-color: #ffffff;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #ffffff;">
    <tr>
      <td align="center" style="padding: 60px 20px 40px;">
        <!-- Logo and Brand -->
        <table role="presentation" style="width: 100%; max-width: 500px; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 0 0 40px;">
              <img src="${logoUrl}" alt="COCO" style="width: 48px; height: 48px; display: block; margin: 0 auto 12px;" />
              <span style="font-family: Georgia, 'Times New Roman', serif; font-size: 24px; font-weight: 300; letter-spacing: 0.1em; color: #1a1a1a; text-transform: uppercase;">
                COCO
              </span>
            </td>
          </tr>
        </table>

        <!-- Content -->
        <table role="presentation" style="width: 100%; max-width: 500px; border-collapse: collapse;">
          <tr>
            <td style="padding: 0 0 32px;">
              <h1 style="margin: 0 0 16px; font-family: Georgia, 'Times New Roman', serif; font-size: 20px; font-weight: 400; color: #1a1a1a; line-height: 1.5;">
                ${isPatient ? `Welcome to ${teamName}` : `You've been invited`}
              </h1>
              
              <p style="margin: 0 0 24px; font-family: Georgia, 'Times New Roman', serif; font-size: 16px; font-weight: 400; color: #4a4a4a; line-height: 1.6;">
                ${invitedName ? `Hi ${invitedName},` : "Hi there,"}
              </p>
              
              <p style="margin: 0 0 32px; font-family: Georgia, 'Times New Roman', serif; font-size: 16px; font-weight: 400; color: #4a4a4a; line-height: 1.6;">
                ${
                  isPatient
                    ? `${inviterName} has invited you to join ${teamName}.`
                    : `${inviterName} has invited you to join ${teamName} as a ${roleDisplay}.`
                }
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 0 0 24px;">
                    <a href="${inviteUrl}" style="display: inline-block; padding: 12px 32px; background-color: #1a1a1a; color: #ffffff; text-decoration: none; font-family: Georgia, 'Times New Roman', serif; font-size: 14px; font-weight: 400; letter-spacing: 0.05em;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Alternative Link -->
              <p style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 12px; font-weight: 400; color: #6b6b6b; line-height: 1.6;">
                Or copy this link: <a href="${inviteUrl}" style="color: #1a1a1a; text-decoration: underline; word-break: break-all;">${inviteUrl}</a>
              </p>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" style="width: 100%; max-width: 500px; border-collapse: collapse; margin-top: 48px;">
          <tr>
            <td style="padding: 32px 0 0; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0 0 8px; font-family: Georgia, 'Times New Roman', serif; font-size: 12px; font-weight: 400; color: #6b6b6b; text-align: center; line-height: 1.5;">
                This invitation expires in 7 days.
              </p>
              <p style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 11px; font-weight: 400; color: #9b9b9b; text-align: center;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Send a generic notification email (in-app notification companion).
 */
export async function sendNotificationEmail({
  to,
  subject,
  title,
  message,
  linkUrl,
  linkLabel = "View",
}: {
  to: string;
  subject: string;
  title: string;
  message: string;
  linkUrl?: string;
  linkLabel?: string;
}) {
  if (!resend) {
    log.info(
      { type: "email_not_configured", to },
      "Email service not configured. Would send notification",
    );
    return { success: false, error: "Email service not configured" };
  }

  const isProduction =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production";
  const appUrl = isProduction
    ? "https://joincoco.app"
    : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const fullLinkUrl = linkUrl
    ? linkUrl.startsWith("http")
      ? linkUrl
      : `${appUrl}${linkUrl}`
    : appUrl;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Georgia, 'Times New Roman', serif; background-color: #ffffff;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <h1 style="margin: 0 0 16px; font-size: 20px; font-weight: 400; color: #1a1a1a;">${title}</h1>
        <p style="margin: 0 0 24px; font-size: 16px; color: #4a4a4a; line-height: 1.6;">${message}</p>
        ${linkUrl ? `<a href="${fullLinkUrl}" style="display: inline-block; padding: 12px 24px; background-color: #1a1a1a; color: #ffffff; text-decoration: none; font-size: 14px;">${linkLabel}</a>` : ""}
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Coco <onboarding@resend.dev>",
      to,
      subject,
      html,
    });
    if (error) {
      loggerUtils.logError(error, { type: "email_send_error", to });
      return { success: false, error };
    }
    return { success: true, data };
  } catch (error) {
    loggerUtils.logError(error, { type: "email_send_error", to });
    return { success: false, error };
  }
}

export type DigestSection = { title: string; items: string[] };

/**
 * Send a daily or weekly digest email (HTML with sections).
 */
export async function sendDigestEmail({
  to,
  subject,
  sections,
  dashboardUrl,
}: {
  to: string;
  subject: string;
  sections: DigestSection[];
  dashboardUrl: string;
}): Promise<{ success: boolean; data?: unknown; error?: string }> {
  if (!resend) {
    log.info(
      { type: "email_not_configured", to },
      "Email service not configured. Would send digest",
    );
    return { success: false, error: "Email service not configured" };
  }

  const sectionsHtml = sections
    .filter((s) => s.items.length > 0)
    .map(
      (s) => `
        <tr><td style="padding: 0 0 8px; font-size: 14px; font-weight: 600; color: #1a1a1a;">${s.title}</td></tr>
        ${s.items.map((item) => `<tr><td style="padding: 0 0 4px 16px; font-size: 14px; color: #4a4a4a;">• ${item}</td></tr>`).join("")}
        <tr><td style="padding: 0 0 16px;"></td></tr>
      `,
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Georgia, 'Times New Roman', serif; background-color: #ffffff;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <h1 style="margin: 0 0 24px; font-size: 20px; font-weight: 400; color: #1a1a1a;">${subject}</h1>
        <table role="presentation" style="width: 100%; max-width: 560px;">
          ${sectionsHtml || "<tr><td style='color: #6b6b6b;'>No new updates this period.</td></tr>"}
        </table>
        <p style="margin: 24px 0 0;">
          <a href="${dashboardUrl}" style="display: inline-block; padding: 12px 24px; background-color: #1a1a1a; color: #ffffff; text-decoration: none; font-size: 14px;">Open dashboard</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Coco <onboarding@resend.dev>",
      to,
      subject,
      html,
    });
    if (error) {
      loggerUtils.logError(error, { type: "email_send_error", to });
      return {
        success: false,
        error: typeof error === "string" ? error : JSON.stringify(error),
      };
    }
    return { success: true, data };
  } catch (err) {
    loggerUtils.logError(err, { type: "email_send_error", to });
    return { success: false, error: String(err) };
  }
}

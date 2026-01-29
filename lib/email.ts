import { Resend } from 'resend'
import { log, loggerUtils } from './logger'

if (!process.env.RESEND_API_KEY) {
  log.warn({ type: "email_config_missing" }, 'RESEND_API_KEY is not set. Email sending will be disabled.')
  log.warn({ type: "email_config_missing" }, 'For testing, sign up at https://resend.com and add RESEND_API_KEY to .env.local')
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function sendInviteEmail({
  to,
  inviteCode,
  inviterName,
  teamName,
  role,
  isPatient = false,
  invitedName,
}: {
  to: string
  inviteCode: string
  inviterName: string
  teamName: string
  role: string
  isPatient?: boolean
  invitedName?: string
}) {
  if (!resend) {
    log.info({ type: "email_not_configured", to }, 'Email service not configured. Would send invite')
    return { success: false, error: 'Email service not configured' }
  }

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/accept-invite?code=${inviteCode}`

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Coco <onboarding@resend.dev>',
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
    })

    if (error) {
      loggerUtils.logError(error, { type: "email_send_error", to, teamName })
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    loggerUtils.logError(error, { type: "email_send_error", to, teamName })
    return { success: false, error }
  }
}

function getInviteEmailTemplate({
  inviteUrl,
  inviterName,
  teamName,
  role,
  isPatient,
  invitedName,
}: {
  inviteUrl: string
  inviterName: string
  teamName: string
  role: string
  isPatient: boolean
  invitedName?: string
}) {
  const roleDisplay = role
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Join ${teamName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f6e9cf; background-image: linear-gradient(135deg, #f6e9cf 0%, #f5f5f0 100%);">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f6e9cf;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #d4a574 0%, #c8966a 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; letter-spacing: -0.5px;">
                Coco
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px; font-weight: 400;">
                Cognitive Companion
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 24px; font-weight: 600; line-height: 1.3;">
                ${isPatient ? `Welcome to ${teamName}` : `You've been invited!`}
              </h2>
              
              <p style="margin: 0 0 20px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                ${invitedName ? `Hi ${invitedName},` : 'Hi there,'}<br><br>
                ${isPatient 
                  ? `Your care team has been set up, and ${inviterName} has invited you to join ${teamName}.`
                  : `${inviterName} has invited you to join ${teamName} as a ${roleDisplay}.`
                }
              </p>
              
              <p style="margin: 0 0 30px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Click the button below to accept your invitation and create your account.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 0 0 30px 0;">
                    <a href="${inviteUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #d4a574 0%, #c8966a 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 2px 4px rgba(212, 165, 116, 0.3);">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Alternative Link -->
              <p style="margin: 0; color: #6b6b6b; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 0 0; color: #d4a574; font-size: 14px; word-break: break-all; line-height: 1.6;">
                ${inviteUrl}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #fafafa; border-top: 1px solid #e5e5e5; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #6b6b6b; font-size: 14px;">
                This invitation will expire in 7 days.
              </p>
              <p style="margin: 0; color: #9b9b9b; font-size: 12px;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Footer Text -->
        <p style="margin: 20px 0 0 0; color: #6b6b6b; font-size: 12px; text-align: center;">
          © ${new Date().getFullYear()} Coco. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}


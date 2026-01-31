import { prisma } from "./prisma";
import { NotificationType } from "@prisma/client";
import { sendNotificationEmail } from "./email";
import { log } from "./logger";

const TYPE_TO_SETTINGS_KEY: Record<
  NotificationType,
  keyof Pick<
    import("@prisma/client").UserNotificationSettings,
    | "contactSetupReminderFrequency"
    | "taskDueFrequency"
    | "routineMissedFrequency"
    | "teamInviteFrequency"
    | "permissionChangeFrequency"
    | "systemAlertFrequency"
  >
> = {
  CONTACT_SETUP_REMINDER: "contactSetupReminderFrequency",
  TASK_DUE: "taskDueFrequency",
  ROUTINE_MISSED: "routineMissedFrequency",
  TEAM_INVITE: "teamInviteFrequency",
  PERMISSION_CHANGE: "permissionChangeFrequency",
  SYSTEM_ALERT: "systemAlertFrequency",
};

/**
 * Create an in-app notification. Does not send email.
 */
export async function createNotification(params: {
  teamId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string | null;
  linkLabel?: string | null;
}) {
  return prisma.notification.create({
    data: {
      teamId: params.teamId,
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      linkUrl: params.linkUrl ?? null,
      linkLabel: params.linkLabel ?? null,
    },
  });
}

/**
 * Check if we should send an immediate email for this notification type based on user settings.
 * Only sends when frequency is EVERY_EVENT and email is enabled.
 */
export function shouldSendImmediateEmail(
  notificationType: NotificationType,
  settings: {
    emailNotificationsEnabled: boolean;
    contactSetupReminderFrequency: string;
    taskDueFrequency: string;
    routineMissedFrequency: string;
    teamInviteFrequency: string;
    permissionChangeFrequency: string;
    systemAlertFrequency: string;
  } | null,
): boolean {
  if (!settings?.emailNotificationsEnabled) return false;
  const key = TYPE_TO_SETTINGS_KEY[notificationType];
  const frequency = key ? (settings[key] as string) : "DISABLED";
  return frequency === "EVERY_EVENT";
}

/**
 * Create in-app notification and optionally send email based on user notification settings.
 * Fetches user email from DB; does not throw on email failure.
 */
export async function createAndNotify(params: {
  teamId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string | null;
  linkLabel?: string | null;
}): Promise<{
  notification: Awaited<ReturnType<typeof createNotification>>;
  emailSent: boolean;
}> {
  const notification = await createNotification(params);

  let emailSent = false;
  const [user, settings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: params.userId },
      select: { email: true },
    }),
    prisma.userNotificationSettings.findUnique({
      where: { userId: params.userId },
    }),
  ]);

  if (
    user?.email &&
    settings &&
    shouldSendImmediateEmail(params.type, settings)
  ) {
    try {
      const appUrl =
        process.env.NODE_ENV === "production" ||
        process.env.VERCEL_ENV === "production"
          ? "https://joincoco.app"
          : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const fullLinkUrl = params.linkUrl
        ? params.linkUrl.startsWith("http")
          ? params.linkUrl
          : `${appUrl}${params.linkUrl}`
        : appUrl;
      const result = await sendNotificationEmail({
        to: user.email,
        subject: params.title,
        title: params.title,
        message: params.message,
        linkUrl: params.linkUrl ?? fullLinkUrl,
        linkLabel: params.linkLabel ?? "View",
      });
      if (result.success) {
        log.info(
          {
            type: "notification_email_sent",
            userId: params.userId,
            notificationId: notification.id,
          },
          "Notification email sent",
        );
        emailSent = true;
      }
    } catch (error) {
      log.error(
        { type: "notification_email_error", userId: params.userId, error },
        "Failed to send notification email",
      );
    }
  }

  return { notification, emailSent };
}

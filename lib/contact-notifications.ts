import { prisma } from './prisma'
import { NotificationType } from '@prisma/client'
import { log } from './logger'

/**
 * Check if team has emergency contacts set up and create notification if not
 */
export async function checkAndCreateContactSetupNotification(
  teamId: string,
  userId: string
): Promise<void> {
  try {
    // Check if emergency contact exists
    const emergencyContact = await prisma.contact.findFirst({
      where: {
        teamId: teamId,
        type: 'EMERGENCY_CONTACT',
      },
    })

    // Check if notification already exists
    const existingNotification = await prisma.notification.findFirst({
      where: {
        teamId: teamId,
        userId: userId,
        type: 'CONTACT_SETUP_REMINDER',
        isRead: false,
      },
    })

    // If no emergency contact and no existing notification, create one
    if (!emergencyContact && !existingNotification) {
      await prisma.notification.create({
        data: {
          teamId: teamId,
          userId: userId,
          type: NotificationType.CONTACT_SETUP_REMINDER,
          title: 'Setup Required: Emergency Contacts',
          message: 'Add emergency contacts and important phone numbers for quick access during emergencies.',
          linkUrl: `/dashboard/contacts`,
          linkLabel: 'Set up contacts',
        },
      })

      log.info({
        teamId,
        userId,
        type: 'contact_setup_notification_created',
      }, 'Created contact setup reminder notification')
    }

    // If emergency contact exists but notification is still unread, mark it as read
    if (emergencyContact && existingNotification) {
      await prisma.notification.update({
        where: { id: existingNotification.id },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      })

      log.info({
        teamId,
        userId,
        notificationId: existingNotification.id,
        type: 'contact_setup_notification_auto_read',
      }, 'Auto-marked contact setup notification as read')
    }
  } catch (error) {
    log.error({
      error,
      teamId,
      userId,
      type: 'contact_notification_check_error',
    }, 'Error checking and creating contact setup notification')
  }
}

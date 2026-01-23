import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { log, loggerUtils } from '@/lib/logger'

export async function POST(req: Request) {
  // You can find this in the Clerk Dashboard -> Webhooks -> choose the webhook
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    loggerUtils.logError(new Error('WEBHOOK_SECRET is missing from environment variables'), {
      type: 'webhook_config_error',
    })
    throw new Error('Please add WEBHOOK_SECRET from Clerk Dashboard to .env.local')
  }

  log.debug({ type: 'webhook_received' }, 'Webhook received - checking headers')

  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    loggerUtils.logError(err, { type: 'webhook_verification_error' })
    return new Response('Error occured', {
      status: 400,
    })
  }

  // Handle the webhook
  const eventType = evt.type
  log.info({ type: 'webhook_event', eventType }, `Processing webhook event: ${eventType}`)

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data

    try {
      const user =       await prisma.user.create({
        data: {
          clerkId: id,
          email: email_addresses[0]?.email_address || '',
          firstName: first_name || null,
          lastName: last_name || null,
          imageUrl: image_url || null,
          role: 'CAREGIVER', // Default role, will be updated in onboarding
          onboardingComplete: false,
        },
      })
      log.info({ type: 'webhook_user_created', userId: user.id, clerkId: id }, 'User created successfully in database')
    } catch (error) {
      loggerUtils.logError(error, { type: 'webhook_user_create_error', clerkId: id })
      // Return more detailed error for debugging
      return new Response(
        JSON.stringify({ error: 'Error creating user', details: error instanceof Error ? error.message : String(error) }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  if (eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data

    try {
      await prisma.user.update({
        where: { clerkId: id },
        data: {
          email: email_addresses[0]?.email_address || '',
          firstName: first_name || null,
          lastName: last_name || null,
          imageUrl: image_url || null,
        },
      })
      log.info({ type: 'webhook_user_updated', clerkId: id }, 'User updated successfully')
    } catch (error) {
      loggerUtils.logError(error, { type: 'webhook_user_update_error', clerkId: id })
      return new Response('Error updating user', { status: 500 })
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data

    try {
      await prisma.user.delete({
        where: { clerkId: id },
      })
      log.info({ type: 'webhook_user_deleted', clerkId: id }, 'User deleted successfully')
    } catch (error) {
      loggerUtils.logError(error, { type: 'webhook_user_delete_error', clerkId: id })
      return new Response('Error deleting user', { status: 500 })
    }
  }

  return new Response('', { status: 200 })
}


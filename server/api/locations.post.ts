import { addLocation } from '../utils/sheets'
import { requireAuth } from '../utils/auth'
import { isAdminEmail } from '../utils/admin'
import { sendPendingNotification, sendSubmissionConfirmation } from '../utils/mailer'

async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true // not configured — dev or opt-out
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token }),
  })
  const data = (await res.json()) as { success: boolean }
  return data.success
}

export default defineEventHandler(async (event) => {
  const email = requireAuth(event)
  const body = await readBody(event)

  // Verify Turnstile when token is present; sync replays won't have one — auth is the gate.
  if (body?.turnstileToken) {
    const valid = await verifyTurnstile(body.turnstileToken)
    if (!valid)
      throw createError({
        statusCode: 400,
        message: 'Human verification failed. Please try again.',
      })
  }

  if (!body?.name?.trim()) throw createError({ statusCode: 400, message: 'Name is required' })
  if (body.name.trim().length > 100)
    throw createError({ statusCode: 400, message: 'Name must be 100 characters or fewer' })
  if ((body.description?.trim() ?? '').length > 100)
    throw createError({ statusCode: 400, message: 'Description must be 100 characters or fewer' })
  if (!body?.qris?.trim())
    throw createError({ statusCode: 400, message: 'QRIS string is required' })
  if (typeof body.latitude !== 'number' || typeof body.longitude !== 'number')
    throw createError({ statusCode: 400, message: 'Valid location is required' })

  const latitude = Math.max(-90, Math.min(90, body.latitude))
  const longitude = Math.max(-180, Math.min(180, body.longitude))

  const admin = await isAdminEmail(email)
  const status = admin ? '1' : '2'

  const location = await addLocation({
    name: body.name.trim(),
    description: body.description?.trim() ?? '',
    latitude,
    longitude,
    qris: body.qris.trim(),
    creator: email,
    status,
  })

  // Await before returning — on Vercel serverless the function is terminated
  // as soon as the response is sent, so fire-and-forget never completes.
  // Admin submissions are auto-approved — no emails needed.
  // For everyone else: notify the admin, and confirm receipt to the submitter.
  if (!admin) {
    await Promise.all([
      sendPendingNotification({
        id: location.id,
        name: location.name,
        description: location.description,
        latitude: location.latitude,
        longitude: location.longitude,
        creator: location.creator,
        created_at: location.created_at,
      }).catch((err) => console.error('[mailer] Failed to send notification:', err)),
      sendSubmissionConfirmation({
        name: location.name,
        creator: location.creator,
      }).catch((err) => console.error('[mailer] Failed to send confirmation:', err)),
    ])
  }

  return location
})

import { addLocation } from '../utils/sheets'
import { requireAuth } from '../utils/auth'
import { isAdminEmail } from '../utils/admin'
import { sendPendingNotification, sendSubmissionConfirmation } from '../utils/mailer'

const ipStore = new Map<string, number[]>()
const LIMIT = 5
const WINDOW_MS = 60_000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const hits = (ipStore.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  if (hits.length >= LIMIT) return false
  hits.push(now)
  ipStore.set(ip, hits)
  return true
}

export default defineEventHandler(async (event) => {
  const ip =
    getHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim() ??
    getHeader(event, 'x-real-ip') ??
    'unknown'

  if (!checkRateLimit(ip))
    throw createError({
      statusCode: 429,
      message: 'Too many requests. Please wait before submitting again.',
    })

  const email = requireAuth(event)
  const body = await readBody(event)

  if (!body?.name?.trim()) throw createError({ statusCode: 400, message: 'Name is required' })
  if (!body?.qris?.trim())
    throw createError({ statusCode: 400, message: 'QRIS string is required' })
  if (typeof body.latitude !== 'number' || typeof body.longitude !== 'number')
    throw createError({ statusCode: 400, message: 'Valid location is required' })

  const admin = await isAdminEmail(email)
  const status = admin ? '1' : '2'

  const location = await addLocation({
    name: body.name.trim(),
    description: body.description?.trim() ?? '',
    latitude: body.latitude,
    longitude: body.longitude,
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

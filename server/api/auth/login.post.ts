import { OAuth2Client } from 'google-auth-library'
import { isAdminEmail } from '../../utils/admin'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const credential = body?.credential as string | undefined
  if (!credential) throw createError({ statusCode: 400, message: 'Credential required' })

  const clientId = useRuntimeConfig().googleClientId as string
  if (!clientId) throw createError({ statusCode: 500, message: 'Google Client ID not configured' })

  let email: string
  try {
    const client = new OAuth2Client(clientId)
    const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId })
    const payload = ticket.getPayload()
    if (!payload?.email) throw new Error('No email in payload')
    email = payload.email
  } catch {
    throw createError({ statusCode: 401, message: 'Invalid Google credential' })
  }

  const cookieOpts = {
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  }

  // httpOnly — server auth verification
  setCookie(event, 'auth_email', email, { ...cookieOpts, httpOnly: true })
  // non-httpOnly — client hint to skip the /api/auth/me call when unauthenticated
  setCookie(event, 'auth_hint', '1', { ...cookieOpts, httpOnly: false })

  const isAdmin = await isAdminEmail(email)
  return { email, isAdmin }
})

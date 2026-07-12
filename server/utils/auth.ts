import type { H3Event } from 'h3'
import { SignJWT, jwtVerify } from 'jose'

// The session cookie holds a signed JWT (not a plaintext email), so a forged or
// tampered value fails signature verification and is rejected.
const COOKIE_NAME = 'auth_email'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 days

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw createError({ statusCode: 500, message: 'AUTH_SECRET not configured' })
  return new TextEncoder().encode(secret)
}

/** Signs a session token for the given email (HS256, 30-day expiry). */
export async function signAuthToken(email: string): Promise<string> {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(getSecret())
}

/** Returns the verified email from the session cookie, or null if absent/invalid/expired. */
export async function getAuthEmail(event: H3Event): Promise<string | null> {
  const token = getCookie(event, COOKIE_NAME)
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return typeof payload.email === 'string' ? payload.email : null
  } catch {
    return null // bad signature, malformed, or expired
  }
}

export async function requireAuth(event: H3Event): Promise<string> {
  const email = await getAuthEmail(event)
  if (!email) throw createError({ statusCode: 401, message: 'Authentication required' })
  return email
}

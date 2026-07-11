/**
 * Verifies a Cloudflare Turnstile token server-side.
 * Returns true when Turnstile is not configured (dev / opt-out).
 */
export async function verifyTurnstile(token: string): Promise<boolean> {
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

/**
 * Enforces Turnstile on a write. When configured, the token is MANDATORY — a
 * missing token is rejected just like an invalid one, so a valid session cookie
 * alone (e.g. replayed via Postman) cannot write. Cloudflare tokens are
 * single-use and short-lived, so every accepted write requires a fresh solve.
 * No-op when TURNSTILE_SECRET_KEY isn't set (dev / opt-out).
 */
export async function requireTurnstile(token: string | undefined): Promise<void> {
  if (!process.env.TURNSTILE_SECRET_KEY) return
  if (!token) throw createError({ statusCode: 400, message: 'Human verification required.' })
  const valid = await verifyTurnstile(token)
  if (!valid)
    throw createError({ statusCode: 400, message: 'Human verification failed. Please try again.' })
}

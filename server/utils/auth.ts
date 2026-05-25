import type { H3Event } from 'h3'

export function requireAuth(event: H3Event): string {
  const email = getCookie(event, 'auth_email')
  if (!email) throw createError({ statusCode: 401, message: 'Authentication required' })
  return email
}

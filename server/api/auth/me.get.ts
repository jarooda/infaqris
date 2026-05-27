import { isAdminEmail } from '../../utils/admin'

export default defineEventHandler(async (event) => {
  const email = getCookie(event, 'auth_email')
  if (!email) throw createError({ statusCode: 401, message: 'Not authenticated' })
  const isAdmin = await isAdminEmail(email)
  return { email, isAdmin }
})

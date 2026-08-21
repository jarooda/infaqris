import { isAdminEmail } from '../../utils/admin'
import { getAuthEmail } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  const email = await getAuthEmail(event)
  if (!email) throw createError({ statusCode: 401, message: 'Not authenticated' })
  const isAdmin = await isAdminEmail(email)
  return { email, isAdmin }
})

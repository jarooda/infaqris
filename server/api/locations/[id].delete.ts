import { softDeleteLocation } from '../../utils/sheets'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const email = requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID is required' })

  await softDeleteLocation(id, email)
  return { success: true }
})

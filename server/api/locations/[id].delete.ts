import { softDeleteLocation } from '../../utils/sheets'
import { requireAdmin } from '../../utils/admin'

export default defineEventHandler(async (event) => {
  const email = await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID is required' })

  await softDeleteLocation(id, email)
  return { success: true }
})

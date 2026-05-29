import { requireAdmin } from '../../../utils/admin'
import { deleteLocation } from '../../../utils/sheets'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID is required' })

  await deleteLocation(id)
  return { ok: true }
})

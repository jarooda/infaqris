import { requireAdmin } from '../../../utils/admin'
import { updateLocationStatus } from '../../../utils/sheets'

export default defineEventHandler(async (event) => {
  const email = await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID is required' })

  const body = await readBody(event)
  const status = body?.status
  if (!['0', '1', '2'].includes(status)) {
    throw createError({ statusCode: 400, message: 'Status must be 0, 1, or 2' })
  }

  await updateLocationStatus(id, status, email)
  return { ok: true }
})

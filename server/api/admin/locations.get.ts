import { requireAdmin } from '../../utils/admin'
import { getAdminLocations } from '../../utils/sheets'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  await requireAdmin(event)
  return await getAdminLocations()
})

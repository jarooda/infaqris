import { requireAdmin } from '../../utils/admin'
import { getAdminLocations } from '../../utils/sheets'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return await getAdminLocations()
})

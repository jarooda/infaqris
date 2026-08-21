import { requireAuth } from '../../utils/auth'
import { getAdminLocations } from '../../utils/sheets'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  const email = await requireAuth(event)
  const locations = await getAdminLocations()
  return locations.filter((loc) => loc.creator === email)
})

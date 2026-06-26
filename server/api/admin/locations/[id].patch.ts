import { requireAdmin } from '../../../utils/admin'
import { getAdminLocations, updateLocationStatus } from '../../../utils/sheets'
import {
  sendLocationApprovedNotification,
  sendLocationRejectedNotification,
} from '../../../utils/mailer'

export default defineEventHandler(async (event) => {
  const email = await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID is required' })

  const body = await readBody(event)
  const status = body?.status
  if (!['0', '1', '2'].includes(status)) {
    throw createError({ statusCode: 400, message: 'Status must be 0, 1, or 2' })
  }

  const all = await getAdminLocations()
  const current = all.find((l) => l.id === id)

  await updateLocationStatus(id, status, email)

  if (current?.creator && current.creator !== email && current.status !== status) {
    if (status === '1') {
      await sendLocationApprovedNotification({
        name: current.name,
        description: current.description,
        latitude: current.latitude,
        longitude: current.longitude,
        creator: current.creator,
      }).catch((err) => console.error('[mailer] Failed to send approval notification:', err))
    } else if (status === '0') {
      await sendLocationRejectedNotification({
        name: current.name,
        creator: current.creator,
      }).catch((err) => console.error('[mailer] Failed to send rejection notification:', err))
    }
  }

  return { ok: true }
})

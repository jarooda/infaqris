import { fetchLocations, softDeleteLocation } from '../../utils/sheets'
import { requireAdmin } from '../../utils/admin'
import { sendLocationDeletedNotification } from '../../utils/mailer'

export default defineEventHandler(async (event) => {
  const email = await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID is required' })

  const all = await fetchLocations()
  const current = all.find((l) => l.id === id)

  await softDeleteLocation(id, email)

  if (current?.creator && current.creator !== email) {
    await sendLocationDeletedNotification({
      name: current.name,
      creator: current.creator,
    }).catch((err) => console.error('[mailer] Failed to send deletion notification:', err))
  }

  return { success: true }
})

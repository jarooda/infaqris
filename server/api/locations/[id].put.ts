import { isNumber } from 'jalutils/type'
import { getLocations, updateLocation } from '../../utils/sheets'
import { requireAdmin } from '../../utils/admin'
import { sendLocationUpdatedNotification } from '../../utils/mailer'

export default defineEventHandler(async (event) => {
  const email = await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID is required' })

  const body = await readBody(event)

  if (!body?.name?.trim()) throw createError({ statusCode: 400, message: 'Name is required' })
  if (body.name.trim().length > 100)
    throw createError({ statusCode: 400, message: 'Name must be 100 characters or fewer' })
  if ((body.description?.trim() ?? '').length > 500)
    throw createError({ statusCode: 400, message: 'Description must be 500 characters or fewer' })
  if (!body?.qris?.trim())
    throw createError({ statusCode: 400, message: 'QRIS string is required' })
  if (!isNumber(body.latitude) || !isNumber(body.longitude))
    throw createError({ statusCode: 400, message: 'Valid location is required' })

  const latitude = Math.max(-90, Math.min(90, body.latitude))
  const longitude = Math.max(-180, Math.min(180, body.longitude))

  // If the entry is pending (status 2), promote it to active (status 1) on admin edit
  const all = await getLocations()
  const current = all.find((l) => l.id === id)
  const newStatus = current?.status === '2' ? '1' : undefined

  const updated = await updateLocation(
    id,
    {
      name: body.name.trim(),
      description: body.description?.trim() ?? '',
      latitude,
      longitude,
      qris: body.qris.trim(),
    },
    email,
    newStatus,
  )

  if (current?.creator && current.creator !== email) {
    await sendLocationUpdatedNotification({
      name: updated.name,
      description: updated.description,
      latitude: updated.latitude,
      longitude: updated.longitude,
      creator: current.creator,
    }).catch((err) => console.error('[mailer] Failed to send update notification:', err))
  }

  return updated
})

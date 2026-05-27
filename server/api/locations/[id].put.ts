import { isNumber } from 'jalutils/type'
import { getLocations, updateLocation } from '../../utils/sheets'
import { requireAdmin } from '../../utils/admin'

export default defineEventHandler(async (event) => {
  const email = await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID is required' })

  const body = await readBody(event)

  if (!body?.name?.trim()) throw createError({ statusCode: 400, message: 'Name is required' })
  if (!body?.qris?.trim())
    throw createError({ statusCode: 400, message: 'QRIS string is required' })
  if (!isNumber(body.latitude) || !isNumber(body.longitude))
    throw createError({ statusCode: 400, message: 'Valid location is required' })

  // If the entry is pending (status 2), promote it to active (status 1) on admin edit
  const all = await getLocations()
  const current = all.find((l) => l.id === id)
  const newStatus = current?.status === '2' ? '1' : undefined

  return await updateLocation(
    id,
    {
      name: body.name.trim(),
      description: body.description?.trim() ?? '',
      latitude: body.latitude,
      longitude: body.longitude,
      qris: body.qris.trim(),
    },
    email,
    newStatus,
  )
})

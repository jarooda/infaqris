import { isNumber } from 'jalutils/type'
import { updateLocation } from '../../utils/sheets'
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
  )
})

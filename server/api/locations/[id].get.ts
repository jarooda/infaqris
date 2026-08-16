import { getLocations } from '../../utils/sheets'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID is required' })

  const locations = await getLocations()
  const location = locations.find((l) => l.id === id)
  if (!location) throw createError({ statusCode: 404, message: 'Location not found' })

  const { creator: _c, latest_editor: _le, ...publicLocation } = location
  return publicLocation
})

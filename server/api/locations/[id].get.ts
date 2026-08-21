import { getLocations } from '../../utils/sheets'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID is required' })

  const locations = await getLocations()
  const location = locations.find((l) => l.id === id)
  if (!location) throw createError({ statusCode: 404, message: 'Location not found' })

  // Set only on the success path — a 404 for a location that is merely pending
  // approval must not be cached publicly for the next minute.
  setResponseHeader(
    event,
    'Cache-Control',
    'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
  )

  const { creator: _c, latest_editor: _le, ...publicLocation } = location
  return publicLocation
})

import { getLocations } from '../utils/sheets'

let cache: { data: ReturnType<typeof stripEmails>; expiresAt: number } | null = null
const CACHE_TTL = 60_000

function stripEmails(locations: Awaited<ReturnType<typeof getLocations>>) {
  return locations.map(({ creator: _c, latest_editor: _le, ...loc }) => loc)
}

export default defineEventHandler(async () => {
  const now = Date.now()
  if (cache && cache.expiresAt > now) return cache.data

  const data = stripEmails(await getLocations())
  cache = { data, expiresAt: now + CACHE_TTL }
  return data
})

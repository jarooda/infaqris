import { getLocations } from '../utils/sheets'

function stripEmails(locations: Awaited<ReturnType<typeof getLocations>>) {
  return locations.map(({ creator: _c, latest_editor: _le, ...loc }) => loc)
}

export default defineEventHandler(async (event) => {
  // max-age=0 keeps the browser revalidating (so a submitter isn't served their
  // own pre-edit copy); s-maxage lets the CDN absorb the fan-out instead.
  setResponseHeader(
    event,
    'Cache-Control',
    'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
  )

  return stripEmails(await getLocations())
})

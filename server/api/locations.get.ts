import { getLocations } from '../utils/sheets'

export default defineEventHandler(async () => {
  return await getLocations()
})

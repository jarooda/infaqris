import { google } from 'googleapis'

function getSheets() {
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!key)
    throw createError({ statusCode: 500, message: 'GOOGLE_SERVICE_ACCOUNT_KEY not configured' })

  const credentials = JSON.parse(key)
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  return google.sheets({ version: 'v4', auth })
}

function spreadsheetId() {
  const id = process.env.GOOGLE_SPREADSHEET_ID
  if (!id) throw createError({ statusCode: 500, message: 'GOOGLE_SPREADSHEET_ID not configured' })
  return id
}

// Returns the 0-based row index (row 0 = sheet row 1 = header)
async function findRowIndex(id: string): Promise<number> {
  const sheets = getSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId(),
    range: 'A:A',
  })
  const idx = (res.data.values ?? []).findIndex((row) => row[0] === id)
  if (idx === -1) throw createError({ statusCode: 404, message: 'Location not found' })
  return idx
}

// Sheet columns A–K:
// A=id  B=name  C=description  D=latitude  E=longitude  F=qris
// G=created_at  H=modified_at  I=creator  J=latest_editor  K=status (1=active, 0=deleted)

function mapRow(row: unknown[]) {
  return {
    id: (row[0] ?? '') as string,
    name: (row[1] ?? '') as string,
    description: (row[2] ?? '') as string,
    latitude: parseFloat(row[3] as string) || 0,
    longitude: parseFloat(row[4] as string) || 0,
    qris: (row[5] ?? '') as string,
    created_at: (row[6] ?? '') as string,
    modified_at: (row[7] ?? '') as string,
    creator: (row[8] ?? '') as string,
    latest_editor: (row[9] ?? '') as string,
    status: (row[10] ?? '1') as string,
  }
}

export type Location = ReturnType<typeof mapRow>

// Uncached read — use this on write paths, where a decision is made from the
// current row and stale data would corrupt the write.
export async function fetchLocations(): Promise<Location[]> {
  const sheets = getSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId(),
    range: 'A2:K',
  })

  return (res.data.values ?? []).map(mapRow).filter((loc) => loc.id && loc.status === '1')
}

// --- Active-locations cache ---
//
// Shared by every public read path (/api/locations, /api/locations/[id],
// /api/og/[id]) so one Sheets read serves all three. The in-flight promise is
// cached rather than the resolved value, so a burst of concurrent misses
// collapses into a single upstream request instead of stampeding.

const LOCATIONS_TTL = 60_000
let locationsCache: { promise: Promise<Location[]>; expiresAt: number } | null = null

export function invalidateLocations() {
  locationsCache = null
}

export function getLocations(): Promise<Location[]> {
  const now = Date.now()
  if (locationsCache && locationsCache.expiresAt > now) return locationsCache.promise

  const promise = fetchLocations()
  locationsCache = { promise, expiresAt: now + LOCATIONS_TTL }

  // A failed fetch must not be served for the full TTL.
  promise.catch(() => {
    if (locationsCache?.promise === promise) locationsCache = null
  })

  return promise
}

export async function addLocation(data: {
  name: string
  description: string
  latitude: number
  longitude: number
  qris: string
  creator: string
  status?: string
}) {
  const sheets = getSheets()
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const status = data.status ?? '1'

  await sheets.spreadsheets.values.append({
    spreadsheetId: spreadsheetId(),
    range: 'A:K',
    valueInputOption: 'RAW',
    requestBody: {
      values: [
        [
          id,
          data.name,
          data.description,
          data.latitude,
          data.longitude,
          data.qris,
          now,
          '',
          data.creator,
          '',
          status,
        ],
      ],
    },
  })

  invalidateLocations()

  return {
    id,
    name: data.name,
    description: data.description,
    latitude: data.latitude,
    longitude: data.longitude,
    qris: data.qris,
    created_at: now,
    modified_at: '',
    creator: data.creator,
    latest_editor: '',
    status,
  }
}

export async function updateLocation(
  id: string,
  data: {
    name: string
    description: string
    latitude: number
    longitude: number
    qris: string
  },
  latestEditor: string,
  status?: string,
) {
  const sheets = getSheets()
  const rowIdx = await findRowIndex(id)
  const sheetRow = rowIdx + 1
  const now = new Date().toISOString()

  // Only update the changed fields; preserve created_at (G) and creator (I)
  const ranges: { range: string; values: unknown[][] }[] = [
    {
      range: `B${sheetRow}:F${sheetRow}`,
      values: [[data.name, data.description, data.latitude, data.longitude, data.qris]],
    },
    { range: `H${sheetRow}`, values: [[now]] },
    { range: `J${sheetRow}`, values: [[latestEditor]] },
  ]

  if (status !== undefined) {
    ranges.push({ range: `K${sheetRow}`, values: [[status]] })
  }

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: spreadsheetId(),
    requestBody: { valueInputOption: 'RAW', data: ranges },
  })

  invalidateLocations()

  return {
    id,
    ...data,
    modified_at: now,
    latest_editor: latestEditor,
    ...(status !== undefined ? { status } : {}),
  }
}

export async function getAdminLocations() {
  const sheets = getSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId(),
    range: 'A2:K',
  })

  return (res.data.values ?? []).map(mapRow).filter((loc) => loc.id)
}

export async function updateLocationStatus(id: string, status: string, latestEditor: string) {
  const sheets = getSheets()
  const rowIdx = await findRowIndex(id)
  const sheetRow = rowIdx + 1
  const now = new Date().toISOString()

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: spreadsheetId(),
    requestBody: {
      valueInputOption: 'RAW',
      data: [
        { range: `H${sheetRow}`, values: [[now]] },
        { range: `J${sheetRow}`, values: [[latestEditor]] },
        { range: `K${sheetRow}`, values: [[status]] },
      ],
    },
  })

  invalidateLocations()
}

export async function deleteLocation(id: string) {
  const sheets = getSheets()
  const rowIdx = await findRowIndex(id)
  const sheetRow = rowIdx + 1

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: spreadsheetId(),
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: 0,
              dimension: 'ROWS',
              startIndex: sheetRow - 1,
              endIndex: sheetRow,
            },
          },
        },
      ],
    },
  })

  invalidateLocations()
}

export async function softDeleteLocation(id: string, latestEditor: string) {
  const sheets = getSheets()
  const rowIdx = await findRowIndex(id)
  const sheetRow = rowIdx + 1
  const now = new Date().toISOString()

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: spreadsheetId(),
    requestBody: {
      valueInputOption: 'RAW',
      data: [
        { range: `H${sheetRow}`, values: [[now]] },
        { range: `J${sheetRow}`, values: [[latestEditor]] },
        { range: `K${sheetRow}`, values: [['0']] },
      ],
    },
  })

  invalidateLocations()
}

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

export async function getLocations() {
  const sheets = getSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId(),
    range: 'A2:K',
  })

  return (res.data.values ?? [])
    .map((row) => ({
      id: row[0] ?? '',
      name: row[1] ?? '',
      description: row[2] ?? '',
      latitude: parseFloat(row[3]) || 0,
      longitude: parseFloat(row[4]) || 0,
      qris: row[5] ?? '',
      created_at: row[6] ?? '',
      modified_at: row[7] ?? '',
      creator: row[8] ?? '',
      latest_editor: row[9] ?? '',
      status: row[10] ?? '1',
    }))
    .filter((loc) => loc.id && loc.status === '1')
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

  return (res.data.values ?? [])
    .map((row) => ({
      id: row[0] ?? '',
      name: row[1] ?? '',
      description: row[2] ?? '',
      latitude: parseFloat(row[3]) || 0,
      longitude: parseFloat(row[4]) || 0,
      qris: row[5] ?? '',
      created_at: row[6] ?? '',
      modified_at: row[7] ?? '',
      creator: row[8] ?? '',
      latest_editor: row[9] ?? '',
      status: row[10] ?? '1',
    }))
    .filter((loc) => loc.id)
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
}

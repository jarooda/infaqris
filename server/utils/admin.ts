import type { H3Event } from 'h3'
import { google } from 'googleapis'
import { getAuthEmail } from './auth'

// --- Sheets helper (local to avoid circular import with sheets.ts) ---

function getAdminSheets() {
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!key) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY not configured')
  const credentials = JSON.parse(key)
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  return google.sheets({ version: 'v4', auth })
}

// --- Admin email cache ---

interface AdminCache {
  emails: string[]
  expiresAt: number
}

let cache: AdminCache | null = null
// A revoked admin email retains access for up to this duration after removal from the sheet.
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * GOOGLE_SPREADSHEET_SHEET_ADMIN_ID may be either a sheet tab name ("admin")
 * or a numeric GID (e.g. "1314803775" — visible in the URL as ?gid=…).
 * When it's a GID, we look up the actual tab title via spreadsheets.get.
 */
async function resolveSheetTitle(spreadsheetId: string, sheetAdminId: string): Promise<string> {
  const gid = parseInt(sheetAdminId, 10)
  if (isNaN(gid)) return sheetAdminId // already a tab name

  const sheets = getAdminSheets()
  const meta = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties' })
  const sheet = meta.data.sheets?.find((s) => s.properties?.sheetId === gid)
  if (!sheet?.properties?.title) throw new Error(`Sheet with GID ${gid} not found in spreadsheet`)
  return sheet.properties.title
}

export async function getAdminEmails(): Promise<string[]> {
  const now = Date.now()
  if (cache && cache.expiresAt > now) return cache.emails

  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID
  const sheetAdminId = process.env.GOOGLE_SPREADSHEET_SHEET_ADMIN_ID

  if (!spreadsheetId || !sheetAdminId) {
    cache = { emails: [], expiresAt: now + CACHE_TTL }
    return []
  }

  try {
    const sheets = getAdminSheets()
    const sheetTitle = await resolveSheetTitle(spreadsheetId, sheetAdminId)
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetTitle}!A2:A`,
    })
    const emails = (res.data.values ?? [])
      .map((row) => row[0]?.toString().toLowerCase().trim())
      .filter(Boolean) as string[]

    cache = { emails, expiresAt: now + CACHE_TTL }
    return emails
  } catch (err) {
    console.error('[admin] Failed to fetch admin emails:', err)
    cache = { emails: [], expiresAt: now + 30_000 } // short TTL on error
    return []
  }
}

export async function isAdminEmail(email: string): Promise<boolean> {
  const admins = await getAdminEmails()
  return admins.includes(email.toLowerCase())
}

/**
 * Like `requireAuth`, but also verifies the user is an admin.
 * Throws 401 if unauthenticated, 403 if not an admin.
 */
export async function requireAdmin(event: H3Event): Promise<string> {
  const email = await getAuthEmail(event)
  if (!email) throw createError({ statusCode: 401, message: 'Authentication required' })
  const admin = await isAdminEmail(email)
  if (!admin) throw createError({ statusCode: 403, message: 'Admin access required' })
  return email
}

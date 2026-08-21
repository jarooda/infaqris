import { createHash } from 'node:crypto'
import type { H3Event } from 'h3'
import QRCode from 'qrcode'
import sharp from 'sharp'
import { getLocations } from '../../utils/sheets'
import { parseQris, isMccMismatch } from '../../../app/utils/parseQris'

const QR_SIZE = 800
const LOGO_RATIO = 0.22
const LOGO_PADDING_RATIO = 0.12

let logoCache: Buffer | null = null
async function getLogo(event: H3Event) {
  if (logoCache) return logoCache
  const { origin } = getRequestURL(event)
  const res = await fetch(`${origin}/infaqris.png`)
  logoCache = Buffer.from(await res.arrayBuffer())
  return logoCache
}

export default defineEventHandler(async (event) => {
  const rawId = getRouterParam(event, 'id')
  if (!rawId) throw createError({ statusCode: 400, message: 'ID is required' })
  const id = rawId.replace(/\.png$/, '')

  const locations = await getLocations()
  const location = locations.find((l) => l.id === id)
  if (!location?.qris) throw createError({ statusCode: 404, message: 'Location not found' })

  const mcc = parseQris(location.qris)?.mcc
  const suspicious = isMccMismatch(mcc)

  // The rendered PNG is a pure function of these two inputs, so the tag can be
  // computed before the expensive part — a revalidation returns 304 without
  // ever running QRCode/sharp. Not `immutable`: the id outlives the QRIS
  // string, so a corrected QRIS has to be able to invalidate this URL.
  const etag = `"${createHash('sha1').update(`${location.qris}:${suspicious}`).digest('hex')}"`
  setResponseHeader(event, 'ETag', etag)
  // A month at the edge, which we can purge; only an hour in browsers, which we
  // can't. A stale QR sends money to the wrong merchant, so the cache we cannot
  // reach is the one that stays short.
  setResponseHeader(
    event,
    'Cache-Control',
    'public, max-age=3600, s-maxage=2592000, stale-while-revalidate=604800',
  )

  if (getRequestHeader(event, 'if-none-match') === etag) return sendNoContent(event, 304)

  // Suspicious-MCC locations hide their QR behind a trust prompt in the UI
  // (see LocationDetail.vue) — the share preview must not leak a scannable
  // QR either, so fall back to the plain logo instead of generating it.
  const image = suspicious ? await getLogo(event) : await qrisImage(event, location.qris)

  setResponseHeader(event, 'Content-Type', 'image/png')
  return image
})

async function qrisImage(event: H3Event, qris: string) {
  const qrBuffer = await QRCode.toBuffer(qris, {
    type: 'png',
    errorCorrectionLevel: 'H',
    width: QR_SIZE,
    margin: 2,
  })

  const logoSize = Math.round(QR_SIZE * LOGO_RATIO)
  const padding = Math.round(logoSize * LOGO_PADDING_RATIO)
  const logoBuffer = await sharp(await getLogo(event))
    .resize(logoSize, logoSize, { fit: 'contain', background: '#ffffff' })
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: '#ffffff',
    })
    .png()
    .toBuffer()

  return sharp(qrBuffer)
    .composite([{ input: logoBuffer, gravity: 'center' }])
    .png()
    .toBuffer()
}

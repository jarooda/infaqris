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

  // Suspicious-MCC locations hide their QR behind a trust prompt in the UI
  // (see LocationDetail.vue) — the share preview must not leak a scannable
  // QR either, so fall back to the plain logo instead of generating it.
  const mcc = parseQris(location.qris)?.mcc
  const image = isMccMismatch(mcc) ? await getLogo(event) : await qrisImage(event, location.qris)

  setResponseHeader(event, 'Content-Type', 'image/png')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
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

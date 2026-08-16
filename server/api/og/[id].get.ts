import type { H3Event } from 'h3'
import QRCode from 'qrcode'
import sharp from 'sharp'
import { getLocations } from '../../utils/sheets'

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

  const qrBuffer = await QRCode.toBuffer(location.qris, {
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

  const image = await sharp(qrBuffer)
    .composite([{ input: logoBuffer, gravity: 'center' }])
    .png()
    .toBuffer()

  setResponseHeader(event, 'Content-Type', 'image/png')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')
  return image
})

import nodemailer from 'nodemailer'

export interface PendingLocationPayload {
  id: string
  name: string
  description: string
  latitude: number
  longitude: number
  creator: string
  created_at: string
}

function spreadsheetUrl(): string | null {
  return process.env.GOOGLE_SPREADSHEET_PUBLIC_URL || null
}

function createTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_EMAIL, SMTP_PASSWORD } = process.env

  if (!SMTP_HOST || !SMTP_EMAIL || !SMTP_PASSWORD) return null

  const port = parseInt(SMTP_PORT ?? '587', 10)

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_EMAIL, pass: SMTP_PASSWORD },
  })
}

// Resolved from jlds's light-theme tokens (registry/css/index.css) — email
// clients don't reliably load linked stylesheets or resolve CSS variables,
// so values are inlined directly rather than referenced via var(--token).
const FONT_SANS =
  "'Geist', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"
const FONT_MONO = "'Geist Mono', ui-monospace, 'SF Mono', 'JetBrains Mono', 'Menlo', monospace"

function emailLayout(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/jarooda/jlds@main/registry/css/index.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/jarooda/jlds@main/registry/css/table.css">
</head>
<body style="margin:0;padding:24px;background:#f3f5f3;font-family:${FONT_SANS};">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #d8ddd9;border-radius:16px;padding:24px;box-shadow:0 1px 2px rgba(43,52,70,0.05),0 1px 3px rgba(43,52,70,0.08);">
    ${bodyHtml}
  </div>
</body>
</html>`
}

function tableRow(label: string, valueHtml: string, isLast: boolean): string {
  const border = isLast ? '' : 'border-bottom:1px solid #e6e9e6;'
  return `
        <tr>
          <td style="padding:8px 16px 8px 0;${border}color:#5a655f;white-space:nowrap;vertical-align:top">${label}</td>
          <td style="padding:8px 0;${border}color:#161b18">${valueHtml}</td>
        </tr>`
}

export async function sendPendingNotification(location: PendingLocationPayload): Promise<void> {
  const { SMTP_EMAIL, RECIPIENT_EMAIL } = process.env

  const transporter = createTransporter()
  if (!transporter || !RECIPIENT_EMAIL) {
    console.warn('[mailer] SMTP not fully configured — skipping notification email')
    return
  }

  const mapsUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`

  await transporter.sendMail({
    from: `"InfaQRIS Bot" <${SMTP_EMAIL}>`,
    to: RECIPIENT_EMAIL,
    subject: `[InfaQRIS] Submission baru menunggu persetujuan: ${location.name}`,
    html: emailLayout(`
      <h2 style="margin:0 0 16px;color:#161b18;font-size:20px">📋 Submission baru</h2>
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:100%;font-size:14px">
        ${tableRow('ID', `<code style="font-size:12px;background:#e8ebe8;padding:2px 6px;border-radius:4px;font-family:${FONT_MONO}">${location.id}</code>`, false)}
        ${tableRow('Nama', `<strong>${location.name}</strong>`, false)}
        ${tableRow('Deskripsi', location.description || '—', false)}
        ${tableRow('Koordinat', `<a href="${mapsUrl}" style="color:#157053">${location.latitude}, ${location.longitude}</a>`, false)}
        ${tableRow('Dikirim oleh', location.creator, false)}
        ${tableRow('Waktu', new Date(location.created_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }), true)}
      </table>
      <hr style="margin:16px 0;border:none;border-top:1px solid #e6e9e6">
      <p style="font-size:13px;color:#8a948f">
        Untuk menyetujui, ubah kolom <strong>status</strong> dari <code>2</code> ke <code>1</code>
        di Google Sheet.<br>Untuk menolak, ubah ke <code>0</code>.
      </p>
    `),
  })
}

export interface SubmissionConfirmationPayload {
  name: string
  creator: string
}

export async function sendSubmissionConfirmation(
  payload: SubmissionConfirmationPayload,
): Promise<void> {
  const { SMTP_EMAIL } = process.env

  const transporter = createTransporter()
  if (!transporter || !payload.creator) {
    console.warn('[mailer] SMTP not fully configured — skipping confirmation email')
    return
  }

  const sheetUrl = spreadsheetUrl()

  await transporter.sendMail({
    from: `"InfaQRIS Bot" <${SMTP_EMAIL}>`,
    to: payload.creator,
    subject: `[InfaQRIS] Terima kasih — submission "${payload.name}" diterima`,
    html: emailLayout(`
      <h2 style="margin:0 0 16px;color:#161b18;font-size:20px">🙏 Terima kasih!</h2>
      <p style="margin:0 0 16px;font-size:14px;color:#5a655f">
        Submission QRIS kamu sudah kami terima dan akan segera ditinjau.<br>
        <em style="color:#8a948f">Your QRIS submission has been received and will be reviewed shortly.</em>
      </p>
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:100%;font-size:14px">
        ${tableRow('Nama', `<strong>${payload.name}</strong>`, false)}
        ${tableRow(
          'Status',
          `<span style="display:inline-block;background:#fdf3e0;color:#b45309;font-size:12px;font-weight:600;padding:2px 10px;border-radius:999px">Menunggu persetujuan</span>`,
          true,
        )}
      </table>
      ${
        sheetUrl
          ? `<p style="margin:16px 0 8px;font-size:14px;color:#5a655f">
              Pantau seluruh data di Google Sheet: /
              <em style="color:#8a948f">Track all the data in the Google Sheet:</em>
            </p>
            <p style="margin:0 0 8px">
              <a href="${sheetUrl}" style="display:inline-block;background:#157053;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:12px;font-size:14px">
                📊 Lihat Spreadsheet
              </a>
            </p>`
          : ''
      }
      <hr style="margin:16px 0;border:none;border-top:1px solid #e6e9e6">
      <p style="margin:0 0 12px;font-size:13px;color:#8a948f;line-height:1.65">
        Submission akan ditinjau oleh admin. Setelah <strong>disetujui</strong>, QRIS langsung
        tampil di peta InfaQRIS; jika ditolak, data tidak akan ditampilkan.<br>
        <em>An admin will review your submission. Once <strong>approved</strong> it appears on the
        InfaQRIS map; if rejected, it won't be shown.</em>
      </p>
      <p style="margin:0;font-size:12px;color:#aab2ad">
        Email ini dikirim otomatis oleh InfaQRIS. / This email was sent automatically by InfaQRIS.
      </p>
    `),
  })
}

export interface LocationUpdatedPayload {
  name: string
  description: string
  latitude: number
  longitude: number
  creator: string
}

export async function sendLocationUpdatedNotification(
  payload: LocationUpdatedPayload,
): Promise<void> {
  const { SMTP_EMAIL } = process.env

  const transporter = createTransporter()
  if (!transporter || !payload.creator) {
    console.warn('[mailer] SMTP not fully configured — skipping update notification email')
    return
  }

  const mapsUrl = `https://www.google.com/maps?q=${payload.latitude},${payload.longitude}`

  await transporter.sendMail({
    from: `"InfaQRIS Bot" <${SMTP_EMAIL}>`,
    to: payload.creator,
    subject: `[InfaQRIS] Submission kamu "${payload.name}" telah diperbarui`,
    html: emailLayout(`
      <h2 style="margin:0 0 16px;color:#161b18;font-size:20px">✏️ Submission diperbarui</h2>
      <p style="margin:0 0 16px;font-size:14px;color:#5a655f">
        Seorang admin memperbarui data submission QRIS kamu.<br>
        <em style="color:#8a948f">An admin updated your QRIS submission.</em>
      </p>
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:100%;font-size:14px">
        ${tableRow('Nama', `<strong>${payload.name}</strong>`, false)}
        ${tableRow('Deskripsi', payload.description || '—', false)}
        ${tableRow('Koordinat', `<a href="${mapsUrl}" style="color:#157053">${payload.latitude}, ${payload.longitude}</a>`, true)}
      </table>
      <hr style="margin:16px 0;border:none;border-top:1px solid #e6e9e6">
      <p style="margin:0;font-size:12px;color:#aab2ad">
        Email ini dikirim otomatis oleh InfaQRIS. / This email was sent automatically by InfaQRIS.
      </p>
    `),
  })
}

export interface LocationDeletedPayload {
  name: string
  creator: string
}

export async function sendLocationDeletedNotification(
  payload: LocationDeletedPayload,
): Promise<void> {
  const { SMTP_EMAIL } = process.env

  const transporter = createTransporter()
  if (!transporter || !payload.creator) {
    console.warn('[mailer] SMTP not fully configured — skipping deletion notification email')
    return
  }

  await transporter.sendMail({
    from: `"InfaQRIS Bot" <${SMTP_EMAIL}>`,
    to: payload.creator,
    subject: `[InfaQRIS] Submission kamu "${payload.name}" telah dihapus`,
    html: emailLayout(`
      <h2 style="margin:0 0 16px;color:#161b18;font-size:20px">🗑️ Submission dihapus</h2>
      <p style="margin:0 0 16px;font-size:14px;color:#5a655f">
        Submission QRIS kamu <strong style="color:#161b18">"${payload.name}"</strong> telah dihapus oleh admin dan
        tidak lagi tampil di peta InfaQRIS.<br>
        <em style="color:#8a948f">Your QRIS submission "${payload.name}" was removed by an admin
        and no longer appears on the InfaQRIS map.</em>
      </p>
      <hr style="margin:16px 0;border:none;border-top:1px solid #e6e9e6">
      <p style="margin:0;font-size:12px;color:#aab2ad">
        Email ini dikirim otomatis oleh InfaQRIS. / This email was sent automatically by InfaQRIS.
      </p>
    `),
  })
}

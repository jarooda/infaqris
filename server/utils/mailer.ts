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
    html: `
      <h2 style="margin:0 0 16px">📋 Submission baru</h2>
      <table style="border-collapse:collapse;font-size:14px">
        <tr>
          <td style="padding:6px 12px 6px 0;color:#666">ID</td>
          <td style="padding:6px 0"><code style="font-size:12px;background:#f3f4f6;padding:2px 6px;border-radius:4px">${location.id}</code></td>
        </tr>
        <tr>
          <td style="padding:6px 12px 6px 0;color:#666;white-space:nowrap">Nama</td>
          <td style="padding:6px 0"><strong>${location.name}</strong></td>
        </tr>
        <tr>
          <td style="padding:6px 12px 6px 0;color:#666">Deskripsi</td>
          <td style="padding:6px 0">${location.description || '—'}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px 6px 0;color:#666">Koordinat</td>
          <td style="padding:6px 0">
            <a href="${mapsUrl}" style="color:#2563eb">${location.latitude}, ${location.longitude}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:6px 12px 6px 0;color:#666">Dikirim oleh</td>
          <td style="padding:6px 0">${location.creator}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px 6px 0;color:#666">Waktu</td>
          <td style="padding:6px 0">${new Date(location.created_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}</td>
        </tr>
      </table>
      <hr style="margin:16px 0;border:none;border-top:1px solid #e5e7eb">
      <p style="font-size:13px;color:#6b7280">
        Untuk menyetujui, ubah kolom <strong>status</strong> dari <code>2</code> ke <code>1</code>
        di Google Sheet.<br>Untuk menolak, ubah ke <code>0</code>.
      </p>
    `,
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
    html: `
      <h2 style="margin:0 0 16px">🙏 Terima kasih!</h2>
      <p style="margin:0 0 16px;font-size:14px;color:#374151">
        Submission QRIS kamu sudah kami terima dan akan segera ditinjau.<br>
        <em style="color:#6b7280">Your QRIS submission has been received and will be reviewed shortly.</em>
      </p>
      <table style="border-collapse:collapse;font-size:14px">
        <tr>
          <td style="padding:6px 12px 6px 0;color:#666;white-space:nowrap">Nama</td>
          <td style="padding:6px 0"><strong>${payload.name}</strong></td>
        </tr>
        <tr>
          <td style="padding:6px 12px 6px 0;color:#666">Status</td>
          <td style="padding:6px 0">
            <span style="display:inline-block;background:#fef3c7;color:#b45309;font-size:12px;font-weight:600;padding:2px 10px;border-radius:9999px">Menunggu persetujuan</span>
          </td>
        </tr>
      </table>
      ${
        sheetUrl
          ? `<p style="margin:16px 0 8px;font-size:14px;color:#374151">
              Pantau seluruh data di Google Sheet: /
              <em style="color:#6b7280">Track all the data in the Google Sheet:</em>
            </p>
            <p style="margin:0 0 8px">
              <a href="${sheetUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:14px">
                📊 Lihat Spreadsheet
              </a>
            </p>`
          : ''
      }
      <hr style="margin:16px 0;border:none;border-top:1px solid #e5e7eb">
      <p style="margin:0 0 12px;font-size:13px;color:#6b7280;line-height:1.6">
        Submission akan ditinjau oleh admin. Setelah <strong>disetujui</strong>, QRIS langsung
        tampil di peta InfaQRIS; jika ditolak, data tidak akan ditampilkan.<br>
        <em>An admin will review your submission. Once <strong>approved</strong> it appears on the
        InfaQRIS map; if rejected, it won't be shown.</em>
      </p>
      <p style="margin:0;font-size:12px;color:#9ca3af">
        Email ini dikirim otomatis oleh InfaQRIS. / This email was sent automatically by InfaQRIS.
      </p>
    `,
  })
}

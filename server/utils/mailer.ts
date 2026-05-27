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

export async function sendPendingNotification(location: PendingLocationPayload): Promise<void> {
  const { SMTP_HOST, SMTP_PORT, SMTP_EMAIL, SMTP_PASSWORD, RECIPIENT_EMAIL } = process.env

  if (!SMTP_HOST || !SMTP_EMAIL || !SMTP_PASSWORD || !RECIPIENT_EMAIL) {
    console.warn('[mailer] SMTP not fully configured — skipping notification email')
    return
  }

  const port = parseInt(SMTP_PORT ?? '587', 10)

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_EMAIL, pass: SMTP_PASSWORD },
  })

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

export interface QrisInfo {
  merchantName: string
  merchantId: string
  city: string
  bank: string
}

const BANK_MAP: Record<string, string> = {
  'ID.CO.BANKBSI.WWW': 'Bank BSI',
  'ID.CO.BRI.WWW': 'Bank BRI',
  'ID.CO.BNI.WWW': 'Bank BNI',
  'ID.CO.MANDIRI.WWW': 'Bank Mandiri',
  'ID.CO.MANDIRISYARIAH.WWW': 'Bank Mandiri Syariah',
  'ID.CO.BCA.WWW': 'Bank BCA',
  'ID.CO.CIMB.WWW': 'Bank CIMB Niaga',
  'ID.CO.BANKJATENG.WWW': 'Bank Jateng',
  'ID.CO.BANKJATIM.WWW': 'Bank Jatim',
  'ID.CO.BANKDKI.WWW': 'Bank DKI',
  'ID.CO.PERMATABANK.WWW': 'Bank Permata',
  'ID.CO.DANAMON.WWW': 'Bank Danamon',
  'ID.CO.BANKBTN.WWW': 'Bank BTN',
  'ID.CO.BANKNAGARI.WWW': 'Bank Nagari',
  'ID.CO.OVO.WWW': 'OVO',
  'ID.CO.GOPAY.WWW': 'GoPay',
  'ID.CO.DANA.WWW': 'DANA',
  'ID.CO.LINKAJA.WWW': 'LinkAja',
  'ID.CO.SHOPEEPAY.WWW': 'ShopeePay',
}

function readTlv(s: string): Map<string, string> {
  const result = new Map<string, string>()
  let i = 0
  while (i + 4 <= s.length) {
    const tag = s.slice(i, i + 2)
    const len = parseInt(s.slice(i + 2, i + 4), 10)
    if (isNaN(len) || i + 4 + len > s.length) break
    const value = s.slice(i + 4, i + 4 + len)
    result.set(tag, value)
    i += 4 + len
  }
  return result
}

export function parseQris(qris: string): QrisInfo | null {
  try {
    const outer = readTlv(qris)

    // Tag 59: merchant name
    const merchantName = outer.get('59') ?? ''

    // Tag 60: city
    const city = outer.get('60') ?? ''

    // Tag 26: acquirer info → sub-tag 00 is bank domain
    let bank = ''
    const tag26 = outer.get('26')
    if (tag26) {
      const inner26 = readTlv(tag26)
      const domain = inner26.get('00') ?? ''
      bank = BANK_MAP[domain] ?? domain.replace(/^ID\.CO\.|\.WWW$/g, '').replace(/\./g, ' ')
    }

    // Tag 51: QRIS national info → sub-tag 02 is NMID
    let merchantId = ''
    const tag51 = outer.get('51')
    if (tag51) {
      const inner51 = readTlv(tag51)
      merchantId = inner51.get('02') ?? ''
    }

    if (!merchantName && !merchantId) return null

    return { merchantName, merchantId, city, bank }
  } catch {
    return null
  }
}

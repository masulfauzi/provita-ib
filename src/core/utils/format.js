/**
 * Helper format tampilan. Nominal dari API berupa string desimal ("1250000.00") atau
 * integer rupiah; semua perhitungan dilakukan dalam satuan sen (integer) agar tidak
 * terkena galat float.
 */

const MINUS = '−'
const BULAN_PENDEK = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
]
const BULAN_PANJANG = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

/** Ubah nominal API (string desimal / integer rupiah) menjadi integer sen. */
export function keSen(nilai) {
  if (nilai === null || nilai === undefined || nilai === '') return 0
  if (typeof nilai === 'number') {
    if (!Number.isFinite(nilai)) return 0
    return Math.round(nilai * 100)
  }
  const cocok = String(nilai)
    .trim()
    .match(/^([+-]?)(\d+)(?:\.(\d{1,2})\d*)?$/)
  if (!cocok) return 0
  const [, tanda, bulat, desimal = '0'] = cocok
  const sen = Number(bulat) * 100 + Number(desimal.padEnd(2, '0'))
  return tanda === '-' ? -sen : sen
}

const formatRibuan = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 })

/**
 * Format rupiah: `Rp 1.250.000`.
 * @param {string|number} nilai
 * @param {{ tanda?: boolean, sembunyikan?: boolean }} [opsi]
 *   tanda: tampilkan `+Rp` / `−Rp`; sembunyikan: tampilkan `Rp ••••••`.
 */
export function rupiah(nilai, opsi = {}) {
  if (opsi.sembunyikan) return 'Rp ••••••'
  const sen = keSen(nilai)
  const mutlak = Math.abs(sen)
  const bulat = Math.floor(mutlak / 100)
  const sisa = mutlak % 100
  let teks = `Rp ${formatRibuan.format(bulat)}`
  if (sisa) teks += `,${String(sisa).padStart(2, '0')}`
  if (sen < 0) return `${MINUS}${teks}`
  if (opsi.tanda && sen > 0) return `+${teks}`
  return teks
}

/** Ubah nilai tanggal (Date / ISO string) menjadi Date lokal. `YYYY-MM-DD` dibaca sebagai tanggal lokal. */
export function keTanggal(nilai) {
  if (nilai instanceof Date) return nilai
  if (typeof nilai === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(nilai)) {
    const [y, m, d] = nilai.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  return new Date(nilai)
}

function samaHari(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** "Hari ini", "Kemarin", atau "12 Okt 2026". */
export function tanggal(nilai, sekarang = new Date()) {
  if (!nilai) return '-'
  const d = keTanggal(nilai)
  if (Number.isNaN(d.getTime())) return '-'
  if (samaHari(d, sekarang)) return 'Hari ini'
  const kemarin = new Date(sekarang.getFullYear(), sekarang.getMonth(), sekarang.getDate() - 1)
  if (samaHari(d, kemarin)) return 'Kemarin'
  return `${d.getDate()} ${BULAN_PENDEK[d.getMonth()]} ${d.getFullYear()}`
}

/** "12 Oktober 2026" (tanpa label relatif). */
export function tanggalPanjang(nilai, { hari = false } = {}) {
  if (!nilai) return '-'
  const d = keTanggal(nilai)
  if (Number.isNaN(d.getTime())) return '-'
  const teks = `${d.getDate()} ${BULAN_PANJANG[d.getMonth()]} ${d.getFullYear()}`
  return hari ? `${HARI[d.getDay()]}, ${teks}` : teks
}

/** "14:05" */
export function jam(nilai) {
  if (!nilai) return '-'
  const d = keTanggal(nilai)
  if (Number.isNaN(d.getTime())) return '-'
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** Date → "YYYY-MM-DD" (zona waktu lokal). */
export function keISODate(d) {
  const t = keTanggal(d)
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
}

/** `25039` → `•••039` */
export function samarkanRekening(nomor, tampil = 3) {
  const s = String(nomor ?? '')
  if (!s) return ''
  return `•••${s.slice(-tampil)}`
}

/** Format nomor rekening agar mudah dibaca: `1101025041` → `110 102 5041`. */
export function formatRekening(nomor) {
  const s = String(nomor ?? '').replace(/\s+/g, '')
  if (s.length <= 4) return s
  return s.replace(/^(\d{3})(\d{3})(\d+)$/, '$1 $2 $3')
}

/** Selisih hari kalender dari `dari` ke `ke` (positif bila `ke` di masa depan). */
export function selisihHari(ke, dari = new Date()) {
  const a = keTanggal(dari)
  const b = keTanggal(ke)
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((utcB - utcA) / 86400000)
}

const SATUAN = [
  '',
  'satu',
  'dua',
  'tiga',
  'empat',
  'lima',
  'enam',
  'tujuh',
  'delapan',
  'sembilan',
  'sepuluh',
  'sebelas',
]

function terbilangBulat(n) {
  if (n < 12) return SATUAN[n]
  if (n < 20) return `${SATUAN[n - 10]} belas`
  if (n < 100) return `${SATUAN[Math.floor(n / 10)]} puluh ${terbilangBulat(n % 10)}`
  if (n < 200) return `seratus ${terbilangBulat(n - 100)}`
  if (n < 1000) return `${SATUAN[Math.floor(n / 100)]} ratus ${terbilangBulat(n % 100)}`
  if (n < 2000) return `seribu ${terbilangBulat(n - 1000)}`
  if (n < 1e6) return `${terbilangBulat(Math.floor(n / 1000))} ribu ${terbilangBulat(n % 1000)}`
  if (n < 1e9) return `${terbilangBulat(Math.floor(n / 1e6))} juta ${terbilangBulat(n % 1e6)}`
  if (n < 1e12) return `${terbilangBulat(Math.floor(n / 1e9))} miliar ${terbilangBulat(n % 1e9)}`
  return `${terbilangBulat(Math.floor(n / 1e12))} triliun ${terbilangBulat(n % 1e12)}`
}

/** 1250000 → "satu juta dua ratus lima puluh ribu rupiah" */
export function terbilang(nilai, { satuan = 'rupiah' } = {}) {
  const bulat = Math.trunc(keSen(nilai) / 100)
  if (bulat === 0) return `nol ${satuan}`.trim()
  const teks = terbilangBulat(Math.abs(bulat)).replace(/\s+/g, ' ').trim()
  return `${bulat < 0 ? 'minus ' : ''}${teks} ${satuan}`.trim()
}

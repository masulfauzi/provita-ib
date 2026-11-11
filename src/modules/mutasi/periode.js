import { keISODate, keSen, keTanggal, tanggal, tanggalPanjang } from '@/core/utils/format'

export const PRESET_PERIODE = [
  { value: 'hari-ini', label: 'Hari ini' },
  { value: '7-hari', label: '7 hari' },
  { value: '30-hari', label: '30 hari' },
  { value: 'bulan-ini', label: 'Bulan ini' },
  { value: 'bulan-lalu', label: 'Bulan lalu' },
  { value: 'kustom', label: 'Pilih tanggal' },
]

export const PILIHAN_JENIS = [
  { value: 'semua', label: 'Semua' },
  { value: 'masuk', label: 'Masuk' },
  { value: 'keluar', label: 'Keluar' },
]

export const PERIODE_DEFAULT = '30-hari'
export const MAKS_BULAN = 3

function tglSaja(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function tambahBulan(d, n) {
  const h = new Date(d.getFullYear(), d.getMonth() + n, 1)
  h.setDate(Math.min(d.getDate(), new Date(h.getFullYear(), h.getMonth() + 1, 0).getDate()))
  return h
}

/** Rentang tanggal untuk preset periode. */
export function rentangPreset(preset, sekarang = new Date()) {
  const t = tglSaja(sekarang)
  const hari = (n) => new Date(t.getFullYear(), t.getMonth(), t.getDate() + n)
  switch (preset) {
    case 'hari-ini':
      return { dari: t, sampai: t }
    case '7-hari':
      return { dari: hari(-6), sampai: t }
    case 'bulan-ini':
      return { dari: new Date(t.getFullYear(), t.getMonth(), 1), sampai: t }
    case 'bulan-lalu':
      return {
        dari: new Date(t.getFullYear(), t.getMonth() - 1, 1),
        sampai: new Date(t.getFullYear(), t.getMonth(), 0),
      }
    case '30-hari':
    default:
      return { dari: hari(-29), sampai: t }
  }
}

/** Validasi rentang kustom. Mengembalikan pesan error atau null. */
export function validasiRentang(dari, sampai, sekarang = new Date()) {
  if (!dari || !sampai) return 'Pilih tanggal awal dan akhir.'
  const a = tglSaja(keTanggal(dari))
  const b = tglSaja(keTanggal(sampai))
  if (a > b) return 'Tanggal awal harus sebelum tanggal akhir.'
  if (b > tglSaja(sekarang)) return 'Tanggal akhir tidak boleh melebihi hari ini.'
  if (a < tambahBulan(b, -MAKS_BULAN)) return `Rentang maksimal ${MAKS_BULAN} bulan per tampilan.`
  return null
}

const POLA = /^\d{4}-\d{2}-\d{2}$/

/** Baca filter dari query URL (dengan nilai default yang aman). */
export function bacaFilter(query = {}, sekarang = new Date()) {
  const jenis = ['masuk', 'keluar'].includes(query.jenis) ? query.jenis : 'semua'
  let periode = PRESET_PERIODE.some((p) => p.value === query.periode)
    ? query.periode
    : PERIODE_DEFAULT
  let dari
  let sampai
  if (periode === 'kustom') {
    if (
      POLA.test(query.dari || '') &&
      POLA.test(query.sampai || '') &&
      !validasiRentang(query.dari, query.sampai, sekarang)
    ) {
      dari = query.dari
      sampai = query.sampai
    } else {
      periode = PERIODE_DEFAULT
    }
  }
  if (!dari) {
    const r = rentangPreset(periode, sekarang)
    dari = keISODate(r.dari)
    sampai = keISODate(r.sampai)
  }
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1)
  return { periode, dari, sampai, jenis, page }
}

/** Filter → query URL (hanya nilai non-default agar URL tetap rapi). */
export function keQuery(filter) {
  const q = {}
  if (filter.rekening) q.rekening = String(filter.rekening)
  if (filter.periode && filter.periode !== PERIODE_DEFAULT) q.periode = filter.periode
  if (filter.periode === 'kustom') {
    q.dari = filter.dari
    q.sampai = filter.sampai
  }
  if (filter.jenis && filter.jenis !== 'semua') q.jenis = filter.jenis
  if (filter.page && filter.page > 1) q.page = String(filter.page)
  return q
}

/** Label periode untuk ditampilkan: "1 Okt 2026 – 30 Okt 2026". */
export function labelRentang(dari, sampai) {
  if (dari === sampai) return tanggalPanjang(dari)
  return `${tanggal(dari, new Date(0))} – ${tanggal(sampai, new Date(0))}`
}

/** Kelompokkan transaksi per tanggal (urutan dipertahankan). */
export function kelompokkanPerTanggal(items) {
  const grup = []
  const indeks = new Map()
  for (const t of items) {
    const kunci = keISODate(new Date(t.waktu))
    if (!indeks.has(kunci)) {
      indeks.set(kunci, grup.length)
      grup.push({ tanggal: kunci, label: tanggal(kunci), items: [] })
    }
    grup[indeks.get(kunci)].items.push(t)
  }
  return grup
}

/** Jumlah masuk & keluar dari daftar transaksi (string desimal). */
export function jumlahkan(items) {
  let masuk = 0
  let keluar = 0
  for (const t of items) {
    if (t.jenis === 'masuk') masuk += keSen(t.nominal)
    else keluar += keSen(t.nominal)
  }
  return { masuk: (masuk / 100).toFixed(2), keluar: (keluar / 100).toFixed(2) }
}

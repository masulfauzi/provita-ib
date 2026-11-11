/** Error API yang sudah dinormalisasi dengan pesan berbahasa Indonesia. */
export class ApiError extends Error {
  /**
   * @param {object} p
   * @param {'validasi'|'auth'|'terlarang'|'tidak-ditemukan'|'batas'|'server'|'jaringan'|'lain'} p.tipe
   * @param {string} p.message
   * @param {number} [p.status]
   * @param {string} [p.kode]          kode dari API, mis. WAJIB_GANTI_PASSWORD
   * @param {Record<string,string>} [p.fieldErrors] error per field (422)
   * @param {number} [p.retryAfter]    detik tunggu (429)
   * @param {object} [p.data]          body respons mentah
   */
  constructor({ tipe, message, status, kode, fieldErrors = {}, retryAfter, data }) {
    super(message)
    this.name = 'ApiError'
    this.tipe = tipe
    this.status = status
    this.kode = kode
    this.fieldErrors = fieldErrors
    this.retryAfter = retryAfter
    this.data = data
  }
}

export const PESAN = {
  sesiBerakhir: 'Sesi Anda berakhir, silakan masuk kembali.',
  server: 'Layanan sedang mengalami gangguan. Silakan coba beberapa saat lagi.',
  jaringan: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
  terlarang: 'Anda tidak memiliki akses ke data ini.',
  tidakDitemukan: 'Data tidak ditemukan.',
  validasi: 'Periksa kembali isian Anda.',
}

/** "Terlalu banyak percobaan, coba lagi dalam X menit" */
export function pesanBatas(detik) {
  const menit = Math.max(1, Math.ceil((Number(detik) || 60) / 60))
  return `Terlalu banyak percobaan, coba lagi dalam ${menit} menit.`
}

/** Ubah `errors` Laravel ({field: [pesan,…]}) menjadi {field: pesan}. */
export function ratakanErrors(errors) {
  const hasil = {}
  for (const [k, v] of Object.entries(errors || {})) {
    hasil[k] = Array.isArray(v) ? v[0] : String(v)
  }
  return hasil
}

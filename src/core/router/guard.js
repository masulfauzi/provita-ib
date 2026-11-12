/**
 * Guard route (fungsi murni agar mudah diuji).
 *
 * Urutan aturan:
 *   1. Route `bebas` (404, pemeliharaan) → selalu boleh.
 *   2. Route publik (/masuk, /aktivasi) → tamu boleh; yang sudah login dialihkan ke tujuan.
 *   3. Belum login → /masuk?redirect=…
 *   4. Selain itu → boleh.
 *
 * Akun dibuat lewat aktivasi sebelum login, jadi tidak ada langkah wajib setelah login.
 * Catatan: guard ini hanya untuk kenyamanan. Pembatasan sebenarnya ditegakkan API.
 */

export const RUTE = {
  masuk: 'masuk',
  aktivasi: 'aktivasi',
  aktivasiData: 'aktivasi-data',
  beranda: 'beranda',
}

/** Hanya izinkan redirect ke path internal (cegah open redirect). */
export function redirectAman(nilai) {
  if (typeof nilai !== 'string') return null
  if (!nilai.startsWith('/') || nilai.startsWith('//') || nilai.startsWith('/\\')) return null
  if (nilai.startsWith('/masuk') || nilai.startsWith('/aktivasi')) return null
  return nilai
}

/** Ke mana nasabah diarahkan setelah login / saat membuka halaman publik. */
export function tujuanSetelahMasuk(redirect) {
  return redirectAman(redirect) || { name: RUTE.beranda }
}

/**
 * @param {{ name?: string, fullPath: string, query?: object, meta?: object }} to
 * @param {{ masuk: boolean }} status
 * @returns {true | object | string}
 */
export function resolveGuard(to, status) {
  const meta = to.meta || {}
  if (meta.bebas) return true

  if (meta.publik) {
    return status.masuk ? tujuanSetelahMasuk(to.query?.redirect) : true
  }

  if (!status.masuk) {
    const query = to.fullPath && to.fullPath !== '/' ? { redirect: to.fullPath } : {}
    return { name: RUTE.masuk, query }
  }

  return true
}

/**
 * Guard alur wajib nasabah (fungsi murni agar mudah diuji).
 *
 * Urutan aturan:
 *   1. Route publik (/masuk) → bila sudah login, alihkan ke tujuan sesuai status.
 *   2. Belum login → /masuk?redirect=…
 *   3. wajibGantiPassword → hanya /ganti-password.
 *   4. !profilLengkap → hanya /lengkapi-data.
 *   5. Selain itu → semua halaman; /ganti-password & /lengkapi-data dialihkan ke beranda.
 *
 * Catatan: guard ini hanya untuk kenyamanan. Pembatasan sebenarnya ditegakkan API.
 */

export const RUTE = {
  masuk: 'masuk',
  gantiPassword: 'ganti-password',
  lengkapiData: 'lengkapi-data',
  beranda: 'beranda',
}

/** Hanya izinkan redirect ke path internal (cegah open redirect). */
export function redirectAman(nilai) {
  if (typeof nilai !== 'string') return null
  if (!nilai.startsWith('/') || nilai.startsWith('//') || nilai.startsWith('/\\')) return null
  if (nilai.startsWith('/masuk')) return null
  return nilai
}

/** Ke mana nasabah diarahkan setelah login / saat membuka halaman publik. */
export function tujuanSesuaiStatus(status, redirect) {
  if (status.wajibGantiPassword) return { name: RUTE.gantiPassword }
  if (!status.profilLengkap) return { name: RUTE.lengkapiData }
  return redirectAman(redirect) || { name: RUTE.beranda }
}

/**
 * @param {{ name?: string, fullPath: string, query?: object, meta?: object }} to
 * @param {{ masuk: boolean, wajibGantiPassword: boolean, profilLengkap: boolean }} status
 * @returns {true | object | string}
 */
export function resolveGuard(to, status) {
  const meta = to.meta || {}
  if (meta.bebas) return true

  // 1. Halaman publik
  if (meta.publik) {
    return status.masuk ? tujuanSesuaiStatus(status, to.query?.redirect) : true
  }

  // 2. Belum login
  if (!status.masuk) {
    const query = to.fullPath && to.fullPath !== '/' ? { redirect: to.fullPath } : {}
    return { name: RUTE.masuk, query }
  }

  // 3. Wajib ganti password
  if (status.wajibGantiPassword) {
    return to.name === RUTE.gantiPassword ? true : { name: RUTE.gantiPassword }
  }

  // 4. Wajib lengkapi data
  if (!status.profilLengkap) {
    return to.name === RUTE.lengkapiData ? true : { name: RUTE.lengkapiData }
  }

  // 5. Onboarding selesai
  if (to.name === RUTE.gantiPassword || to.name === RUTE.lengkapiData) {
    return { name: RUTE.beranda }
  }
  return true
}

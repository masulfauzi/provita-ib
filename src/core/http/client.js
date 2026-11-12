import axios from 'axios'
import { ApiError, PESAN, pesanBatas, ratakanErrors } from './errors'

/**
 * Alamat API:
 *   - VITE_API_URL   : origin Laravel (mis. https://api.<domain>); kosong = same-origin (proxy Vite).
 *   - VITE_API_PREFIX: prefix endpoint nasabah, default `/api/v1`.
 * CSRF cookie Sanctum berada di root (`/sanctum/csrf-cookie`), tidak ikut prefix.
 */
export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')
export const API_PREFIX = import.meta.env.VITE_API_PREFIX ?? '/api/v1'

/**
 * Instance axios untuk API Laravel (Sanctum SPA, cookie).
 * Opsi tambahan per-permintaan:
 *   - skipAuthRedirect: true → 401 tidak memicu pengalihan ke halaman login.
 */
export const http = axios.create({
  baseURL: `${API_URL}${API_PREFIX}`,
  withCredentials: true,
  withXSRFToken: true,
  timeout: 30000,
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

const hooks = {
  /** Dipanggil saat sesi tidak valid (401). */
  onUnauthorized: () => {},
}

/** Pasang callback yang membutuhkan router/store (dipanggil sekali dari main.js). */
export function configureHttp(h) {
  Object.assign(hooks, h)
}

let csrfPromise = null
/** Ambil cookie CSRF Sanctum (sekali, kecuali dipaksa). */
export function ensureCsrf(force = false) {
  if (force) csrfPromise = null
  if (!csrfPromise) {
    csrfPromise = http
      .get('/sanctum/csrf-cookie', { baseURL: API_URL || '/', skipAuthRedirect: true })
      .catch((e) => {
        csrfPromise = null
        throw e
      })
  }
  return csrfPromise
}

async function bacaBody(data) {
  if (typeof Blob !== 'undefined' && data instanceof Blob) {
    try {
      return JSON.parse(await data.text())
    } catch {
      return {}
    }
  }
  return data || {}
}

/** Normalisasi error axios menjadi ApiError dengan pesan berbahasa Indonesia. */
export async function tanganiError(error) {
  if (error instanceof ApiError || axios.isCancel(error)) throw error
  const config = error.config || {}
  const res = error.response
  if (!res) throw new ApiError({ tipe: 'jaringan', message: PESAN.jaringan })

  const { status } = res
  const body = await bacaBody(res.data)

  if (status === 419 && !config._diulang) {
    config._diulang = true
    await ensureCsrf(true)
    return http.request(config)
  }
  if (status === 419) {
    // Masih 419 setelah CSRF diambil ulang: sesi tidak bisa dibuat (origin tidak terdaftar di
    // SANCTUM_STATEFUL_DOMAINS atau cookie diblokir browser). Bukan kesalahan kredensial.
    if (!config.skipAuthRedirect) hooks.onUnauthorized()
    throw new ApiError({
      tipe: 'sesi',
      status,
      message:
        'Tidak dapat membuat sesi. Pastikan aplikasi dibuka dari alamat resmi dan cookie diizinkan.',
      data: body,
    })
  }
  if (status === 401) {
    if (!config.skipAuthRedirect) hooks.onUnauthorized()
    throw new ApiError({ tipe: 'auth', status, message: PESAN.sesiBerakhir, data: body })
  }
  if (status === 403) {
    throw new ApiError({
      tipe: 'terlarang',
      status,
      kode: body.kode,
      message: body.message || PESAN.terlarang,
      data: body,
    })
  }
  if (status === 404) {
    throw new ApiError({
      tipe: 'tidak-ditemukan',
      status,
      message: PESAN.tidakDitemukan,
      data: body,
    })
  }
  if (status === 409) {
    // Mis. SUDAH_AKTIVASI: akun sudah dibuat.
    throw new ApiError({
      tipe: 'konflik',
      status,
      kode: body.kode,
      message: body.message || 'Data sudah ada.',
      data: body,
    })
  }
  if (status === 422) {
    throw new ApiError({
      tipe: 'validasi',
      status,
      message: body.message || PESAN.validasi,
      fieldErrors: ratakanErrors(body.errors),
      data: body,
    })
  }
  if (status === 429) {
    const retryAfter = Number(res.headers?.['retry-after'] ?? body.retry_after ?? 60)
    throw new ApiError({
      tipe: 'batas',
      status,
      message: pesanBatas(retryAfter),
      retryAfter,
      data: body,
    })
  }
  if (status >= 500)
    throw new ApiError({ tipe: 'server', status, message: PESAN.server, data: body })
  throw new ApiError({ tipe: 'lain', status, message: body.message || PESAN.server, data: body })
}

http.interceptors.response.use((r) => r, tanganiError)

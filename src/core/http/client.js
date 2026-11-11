import axios from 'axios'
import { ApiError, PESAN, pesanBatas, ratakanErrors } from './errors'

/**
 * Instance axios untuk API Laravel (Sanctum SPA, cookie).
 * Opsi tambahan per-permintaan:
 *   - skipAuthRedirect: true → 401 tidak memicu pengalihan ke halaman login.
 */
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
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
  /** Dipanggil saat API menolak karena onboarding belum selesai (403 + kode). */
  onWajib: () => {},
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
    csrfPromise = http.get('/sanctum/csrf-cookie', { skipAuthRedirect: true }).catch((e) => {
      csrfPromise = null
      throw e
    })
  }
  return csrfPromise
}

export const KODE_WAJIB = ['WAJIB_GANTI_PASSWORD', 'WAJIB_LENGKAPI_DATA']

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
  if (status === 401 || status === 419) {
    if (!config.skipAuthRedirect) hooks.onUnauthorized()
    throw new ApiError({ tipe: 'auth', status, message: PESAN.sesiBerakhir, data: body })
  }
  if (status === 403) {
    if (KODE_WAJIB.includes(body.kode)) {
      hooks.onWajib(body.kode)
    }
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

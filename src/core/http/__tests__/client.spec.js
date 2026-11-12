import { afterEach, describe, expect, it, vi } from 'vitest'
import { ensureCsrf, http, API_PREFIX } from '../client'

describe('http client', () => {
  afterEach(() => vi.restoreAllMocks())

  it('endpoint nasabah memakai prefix /api/v1', () => {
    expect(API_PREFIX).toBe('/api/v1')
    expect(http.defaults.baseURL.endsWith('/api/v1')).toBe(true)
    expect(http.defaults.withCredentials).toBe(true)
    expect(http.defaults.withXSRFToken).toBe(true)
  })

  it('CSRF cookie diambil dari root, tanpa prefix', async () => {
    const urls = []
    http.defaults.adapter = async (config) => {
      urls.push(http.getUri(config))
      return { data: null, status: 204, statusText: 'No Content', headers: {}, config }
    }
    await ensureCsrf(true)
    expect(urls).toHaveLength(1)
    expect(urls[0]).toMatch(/\/sanctum\/csrf-cookie$/)
    expect(urls[0]).not.toContain('/api/v1')
  })

  it('419 yang berulang → error tipe sesi, bukan kredensial salah', async () => {
    http.defaults.adapter = async (config) => {
      if (config.url.includes('csrf')) return { data: null, status: 204, headers: {}, config }
      const err = new Error('419')
      err.config = config
      err.response = { status: 419, data: { message: 'CSRF' }, headers: {} }
      throw err
    }
    await expect(
      http.post(
        '/nasabah/login',
        { no_hp: '081234567890', password: 'x' },
        { skipAuthRedirect: true },
      ),
    ).rejects.toMatchObject({ tipe: 'sesi', status: 419 })
  })

  it('409 → error tipe konflik dengan kode dari API', async () => {
    http.defaults.adapter = async (config) => {
      if (config.url.includes('csrf')) return { data: null, status: 204, headers: {}, config }
      const err = new Error('409')
      err.config = config
      err.response = {
        status: 409,
        data: { message: 'Akun sudah diaktivasi.', kode: 'SUDAH_AKTIVASI' },
        headers: {},
      }
      throw err
    }
    await expect(http.post('/nasabah/aktivasi/cek', {})).rejects.toMatchObject({
      tipe: 'konflik',
      kode: 'SUDAH_AKTIVASI',
      message: 'Akun sudah diaktivasi.',
    })
  })
})

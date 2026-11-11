import { describe, expect, it } from 'vitest'
import { redirectAman, resolveGuard } from '../guard'

const rute = (name, extra = {}) => ({ name, fullPath: `/${name}`, query: {}, meta: {}, ...extra })
const masuk = rute('masuk', { meta: { publik: true } })
const status = (s = {}) => ({ masuk: true, wajibGantiPassword: false, profilLengkap: true, ...s })

describe('resolveGuard', () => {
  it('1. halaman publik: tamu boleh, yang sudah login dialihkan sesuai status', () => {
    expect(resolveGuard(masuk, status({ masuk: false }))).toBe(true)
    expect(resolveGuard(masuk, status())).toEqual({ name: 'beranda' })
    expect(resolveGuard(masuk, status({ wajibGantiPassword: true }))).toEqual({
      name: 'ganti-password',
    })
    expect(resolveGuard(masuk, status({ profilLengkap: false }))).toEqual({ name: 'lengkapi-data' })
    expect(resolveGuard({ ...masuk, query: { redirect: '/mutasi' } }, status())).toBe('/mutasi')
  })

  it('2. belum login → /masuk?redirect=…', () => {
    expect(resolveGuard(rute('mutasi'), status({ masuk: false }))).toEqual({
      name: 'masuk',
      query: { redirect: '/mutasi' },
    })
  })

  it('3. wajib ganti password → hanya /ganti-password', () => {
    const s = status({ wajibGantiPassword: true, profilLengkap: false })
    expect(resolveGuard(rute('beranda'), s)).toEqual({ name: 'ganti-password' })
    expect(resolveGuard(rute('lengkapi-data'), s)).toEqual({ name: 'ganti-password' })
    expect(resolveGuard(rute('ganti-password'), s)).toBe(true)
  })

  it('4. profil belum lengkap → hanya /lengkapi-data', () => {
    const s = status({ profilLengkap: false })
    expect(resolveGuard(rute('mutasi'), s)).toEqual({ name: 'lengkapi-data' })
    expect(resolveGuard(rute('ganti-password'), s)).toEqual({ name: 'lengkapi-data' })
    expect(resolveGuard(rute('lengkapi-data'), s)).toBe(true)
  })

  it('5. onboarding selesai → semua halaman, onboarding dialihkan ke beranda', () => {
    expect(resolveGuard(rute('mutasi'), status())).toBe(true)
    expect(resolveGuard(rute('profil'), status())).toBe(true)
    expect(resolveGuard(rute('ganti-password'), status())).toEqual({ name: 'beranda' })
    expect(resolveGuard(rute('lengkapi-data'), status())).toEqual({ name: 'beranda' })
  })

  it('halaman bebas (404/pemeliharaan) selalu boleh', () => {
    expect(resolveGuard(rute('x', { meta: { bebas: true } }), status({ masuk: false }))).toBe(true)
  })
})

describe('redirectAman', () => {
  it('menolak redirect eksternal', () => {
    expect(redirectAman('/mutasi?x=1')).toBe('/mutasi?x=1')
    expect(redirectAman('//evil.com')).toBeNull()
    expect(redirectAman('https://evil.com')).toBeNull()
    expect(redirectAman('/\\evil.com')).toBeNull()
    expect(redirectAman('/masuk')).toBeNull()
  })
})

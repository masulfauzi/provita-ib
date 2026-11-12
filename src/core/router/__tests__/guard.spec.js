import { describe, expect, it } from 'vitest'
import { redirectAman, resolveGuard } from '../guard'

const rute = (name, extra = {}) => ({ name, fullPath: `/${name}`, query: {}, meta: {}, ...extra })
const masuk = rute('masuk', { meta: { publik: true } })
const status = (s = {}) => ({ masuk: true, ...s })
const aktivasi = rute('aktivasi', { meta: { publik: true } })

describe('resolveGuard', () => {
  it('halaman publik (masuk, aktivasi): tamu boleh, yang sudah login dialihkan', () => {
    expect(resolveGuard(masuk, status({ masuk: false }))).toBe(true)
    expect(resolveGuard(aktivasi, status({ masuk: false }))).toBe(true)
    expect(resolveGuard(masuk, status())).toEqual({ name: 'beranda' })
    expect(resolveGuard(aktivasi, status())).toEqual({ name: 'beranda' })
    expect(resolveGuard({ ...masuk, query: { redirect: '/mutasi' } }, status())).toBe('/mutasi')
  })

  it('belum login → /masuk?redirect=…', () => {
    expect(resolveGuard(rute('mutasi'), status({ masuk: false }))).toEqual({
      name: 'masuk',
      query: { redirect: '/mutasi' },
    })
  })

  it('sudah login → semua halaman aplikasi boleh (tidak ada langkah wajib)', () => {
    expect(resolveGuard(rute('mutasi'), status())).toBe(true)
    expect(resolveGuard(rute('profil'), status())).toBe(true)
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
    expect(redirectAman('/aktivasi/data')).toBeNull()
  })
})

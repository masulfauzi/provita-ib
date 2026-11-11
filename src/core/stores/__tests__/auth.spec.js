import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineStore } from 'pinia'
import { ref } from 'vue'

vi.mock('@/core/http/client', () => ({
  http: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
  ensureCsrf: vi.fn().mockResolvedValue(),
}))

import { http, ensureCsrf } from '@/core/http/client'
import { buatPinia } from '@/test-utils'
import { useAuthStore } from '../auth'

const me = () => ({
  nis: '25039',
  nama: 'Andi Pratama',
  wajib_ganti_password: true,
  profil_lengkap: false,
})

describe('auth store', () => {
  beforeEach(() => {
    buatPinia()
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('fetchMe mengisi status dari API', async () => {
    http.get.mockResolvedValue({ data: { data: me() } })
    const auth = useAuthStore()
    await auth.fetchMe()
    expect(auth.masuk).toBe(true)
    expect(auth.wajibGantiPassword).toBe(true)
    expect(auth.profilLengkap).toBe(false)
    expect(auth.dimuat).toBe(true)
  })

  it('fetchMe 401 → belum login', async () => {
    http.get.mockRejectedValue({ tipe: 'auth' })
    const auth = useAuthStore()
    await auth.fetchMe()
    expect(auth.masuk).toBe(false)
    expect(auth.dimuat).toBe(true)
  })

  it('login mengambil CSRF cookie dulu', async () => {
    http.post.mockResolvedValue({ data: { data: { ...me(), wajib_ganti_password: false } } })
    const auth = useAuthStore()
    await auth.login({ nis: '25039', password: 'x' })
    expect(ensureCsrf).toHaveBeenCalled()
    expect(http.post).toHaveBeenCalledWith(
      '/nasabah/login',
      { nis: '25039', password: 'x' },
      expect.anything(),
    )
    expect(auth.wajibGantiPassword).toBe(false)
  })

  it('gantiPassword menurunkan flag wajib', async () => {
    http.get.mockResolvedValue({ data: { data: me() } })
    http.put.mockResolvedValue({ data: {} })
    const auth = useAuthStore()
    await auth.fetchMe()
    await auth.gantiPassword({ password_lama: 'a', password: 'b', password_confirmation: 'b' })
    expect(auth.wajibGantiPassword).toBe(false)
  })

  it('logout menghapus semua state Pinia & sessionStorage', async () => {
    const useLain = defineStore('lain', () => ({ isi: ref([]) }))
    http.get.mockResolvedValue({ data: { data: me() } })
    http.post.mockResolvedValue({})
    const auth = useAuthStore()
    const lain = useLain()
    await auth.fetchMe()
    lain.isi = [1, 2, 3]
    sessionStorage.setItem('draf', 'x')

    await auth.logout()

    expect(auth.user).toBeNull()
    expect(lain.isi).toEqual([])
    expect(sessionStorage.getItem('draf')).toBeNull()
  })
})

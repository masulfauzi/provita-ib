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
  nis: '25041',
  nama: 'Rizky Ramadhan',
  no_hp: '081234567890',
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
    expect(auth.user.no_hp).toBe('081234567890')
    expect(auth.dimuat).toBe(true)
  })

  it('fetchMe 401 → belum login', async () => {
    http.get.mockRejectedValue({ tipe: 'auth' })
    const auth = useAuthStore()
    await auth.fetchMe()
    expect(auth.masuk).toBe(false)
    expect(auth.dimuat).toBe(true)
  })

  it('login mengambil CSRF cookie dulu dan mengirim No. HP yang dinormalisasi', async () => {
    http.post.mockResolvedValue({ data: { data: me() } })
    const auth = useAuthStore()
    await auth.login({ no_hp: '+62 812-3456-7890', password: 'x' })
    expect(ensureCsrf).toHaveBeenCalled()
    expect(http.post).toHaveBeenCalledWith(
      '/nasabah/login',
      { no_hp: '081234567890', password: 'x' },
      expect.anything(),
    )
    expect(auth.masuk).toBe(true)
  })

  it('gantiNoHp memperbarui No. HP di state', async () => {
    http.get.mockResolvedValue({ data: { data: me() } })
    http.put.mockResolvedValue({ data: { message: 'OK', data: { no_hp: '085700001111' } } })
    const auth = useAuthStore()
    await auth.fetchMe()
    const hasil = await auth.gantiNoHp({
      password: 'Provita2026',
      no_hp: '0857-0000-1111',
      no_hp_confirmation: '0857-0000-1111',
    })
    expect(http.put).toHaveBeenCalledWith('/nasabah/no-hp', {
      password: 'Provita2026',
      no_hp: '085700001111',
      no_hp_confirmation: '085700001111',
    })
    expect(hasil).toEqual({ message: 'OK', no_hp: '085700001111' })
    expect(auth.user.no_hp).toBe('085700001111')
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

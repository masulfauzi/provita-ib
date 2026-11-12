import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { ensureCsrf, http } from '@/core/http/client'
import { normalisasiHp } from '@/core/utils/format'
import { resetSemuaStore } from './reset'

/**
 * Status autentikasi nasabah.
 * Status selalu diambil dari `GET /nasabah/me` saat aplikasi dibuka; tidak ada
 * data sesi yang disimpan di localStorage (sesi = cookie HttpOnly Sanctum).
 * Akun dibuat lewat aktivasi (modul `aktivasi`), login memakai No. HP + password.
 */
export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const dimuat = ref(false)

  const masuk = computed(() => !!user.value)
  const namaPanggilan = computed(
    () => user.value?.nama_panggilan || user.value?.nama?.split(' ')[0] || '',
  )

  async function fetchMe() {
    try {
      const { data } = await http.get('/nasabah/me', { skipAuthRedirect: true })
      user.value = data.data
    } catch (e) {
      if (e.tipe === 'auth') user.value = null
      else throw e
    } finally {
      dimuat.value = true
    }
  }

  async function login({ no_hp, password }) {
    await ensureCsrf()
    const { data } = await http.post(
      '/nasabah/login',
      { no_hp: normalisasiHp(no_hp), password },
      { skipAuthRedirect: true },
    )
    if (data?.data) user.value = data.data
    else await fetchMe()
    dimuat.value = true
  }

  /** Hapus semua state Pinia & sessionStorage (dipakai saat logout / sesi berakhir). */
  function bersihkanSesi() {
    resetSemuaStore()
    try {
      sessionStorage.clear()
    } catch {
      /* diabaikan */
    }
    dimuat.value = true
  }

  async function logout() {
    try {
      await http.post('/nasabah/logout', null, { skipAuthRedirect: true })
    } catch {
      /* sesi di server mungkin sudah habis; tetap bersihkan sisi klien */
    } finally {
      bersihkanSesi()
    }
  }

  async function gantiPassword(payload) {
    await http.put('/nasabah/password', payload)
  }

  /** PUT /nasabah/no-hp — kembalikan { message, no_hp }. */
  async function gantiNoHp({ password, no_hp, no_hp_confirmation }) {
    const { data } = await http.put('/nasabah/no-hp', {
      password,
      no_hp: normalisasiHp(no_hp),
      no_hp_confirmation: normalisasiHp(no_hp_confirmation),
    })
    const baru = data?.data?.no_hp
    if (baru && user.value) user.value.no_hp = baru
    return { message: data?.message, no_hp: baru }
  }

  return {
    user,
    dimuat,
    masuk,
    namaPanggilan,
    fetchMe,
    login,
    logout,
    gantiPassword,
    gantiNoHp,
    bersihkanSesi,
  }
})

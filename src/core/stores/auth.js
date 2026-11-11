import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { ensureCsrf, http } from '@/core/http/client'
import { resetSemuaStore } from './reset'

/**
 * Status autentikasi & onboarding nasabah.
 * Status selalu diambil dari `GET /nasabah/me` saat aplikasi dibuka; tidak ada
 * data sesi yang disimpan di localStorage (sesi = cookie HttpOnly Sanctum).
 */
export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const wajibGantiPassword = ref(false)
  const profilLengkap = ref(false)
  const dimuat = ref(false)

  const masuk = computed(() => !!user.value)
  const namaPanggilan = computed(
    () => user.value?.nama_panggilan || user.value?.nama?.split(' ')[0] || '',
  )

  function terapkan(data) {
    user.value = data
    wajibGantiPassword.value = !!data?.wajib_ganti_password
    profilLengkap.value = !!data?.profil_lengkap
  }

  function kosongkan() {
    user.value = null
    wajibGantiPassword.value = false
    profilLengkap.value = false
  }

  async function fetchMe() {
    try {
      const { data } = await http.get('/nasabah/me', { skipAuthRedirect: true })
      terapkan(data.data)
    } catch (e) {
      if (e.tipe === 'auth') kosongkan()
      else throw e
    } finally {
      dimuat.value = true
    }
  }

  async function login({ nis, password }) {
    await ensureCsrf()
    const { data } = await http.post(
      '/nasabah/login',
      { nis, password },
      { skipAuthRedirect: true },
    )
    if (data?.data) terapkan(data.data)
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
    wajibGantiPassword.value = false
    if (user.value) user.value.wajib_ganti_password = false
  }

  function tandaiProfilLengkap() {
    profilLengkap.value = true
    if (user.value) user.value.profil_lengkap = true
  }

  return {
    user,
    wajibGantiPassword,
    profilLengkap,
    dimuat,
    masuk,
    namaPanggilan,
    fetchMe,
    login,
    logout,
    gantiPassword,
    tandaiProfilLengkap,
    bersihkanSesi,
  }
})

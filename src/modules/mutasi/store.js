import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ambilDaftarRekening } from './api'

/** Daftar rekening untuk pilihan di halaman mutasi (di-cache selama sesi). */
export const useMutasiStore = defineStore('mutasi', () => {
  const rekening = ref([])
  const status = ref('awal')
  const galat = ref('')

  async function muatRekening({ paksa = false } = {}) {
    if (status.value === 'siap' && !paksa) return
    status.value = 'memuat'
    try {
      rekening.value = await ambilDaftarRekening()
      status.value = 'siap'
    } catch (e) {
      galat.value = e.message
      status.value = 'galat'
    }
  }

  return { rekening, status, galat, muatRekening }
})

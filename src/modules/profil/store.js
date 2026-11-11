import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ambilProfil } from './api'

export const useProfilStore = defineStore('profil', () => {
  const data = ref(null)
  const status = ref('awal')
  const galat = ref('')

  async function muat({ paksa = false } = {}) {
    if (status.value === 'siap' && !paksa) return
    status.value = 'memuat'
    try {
      data.value = await ambilProfil()
      status.value = 'siap'
    } catch (e) {
      galat.value = e.message
      status.value = 'galat'
    }
  }

  return { data, status, galat, muat }
})

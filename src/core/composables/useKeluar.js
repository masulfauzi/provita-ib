import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/core/stores/auth'

/**
 * Aksi keluar bersama. `alasan` ditampilkan di halaman login:
 * 'keluar' (manual), 'tidak-aktif' (auto-logout), 'sesi' (sesi berakhir).
 */
export function useKeluar() {
  const auth = useAuthStore()
  const router = useRouter()
  const sedangKeluar = ref(false)

  async function keluar(alasan = 'keluar') {
    if (sedangKeluar.value) return
    sedangKeluar.value = true
    try {
      await auth.logout()
      await router.replace({ name: 'masuk', query: { alasan } })
    } finally {
      sedangKeluar.value = false
    }
  }

  return { keluar, sedangKeluar }
}

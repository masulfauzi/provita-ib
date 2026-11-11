import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { keSen } from '@/core/utils/format'
import { ambilDaftarRekening, ambilTransaksiTerakhir } from './api'

export const useRekeningStore = defineStore('rekening', () => {
  const daftar = ref([])
  const saldoPer = ref(null)
  const status = ref('awal') // awal | memuat | siap | galat
  const galat = ref('')

  const terakhir = ref([])
  const statusTerakhir = ref('awal')

  const totalSaldo = computed(() => {
    const sen = daftar.value
      .filter((r) => r.status !== 'ditutup')
      .reduce((a, r) => a + keSen(r.saldo), 0)
    return (sen / 100).toFixed(2)
  })

  async function muat({ paksa = false } = {}) {
    if (status.value === 'memuat') return
    if (status.value === 'siap' && !paksa) return
    status.value = 'memuat'
    galat.value = ''
    try {
      const hasil = await ambilDaftarRekening()
      daftar.value = hasil.data
      saldoPer.value = hasil.meta?.saldo_per || new Date().toISOString()
      status.value = 'siap'
    } catch (e) {
      galat.value = e.message
      status.value = 'galat'
    }
  }

  /** 5 transaksi terakhir lintas rekening. */
  async function muatTerakhir({ paksa = false } = {}) {
    if (statusTerakhir.value === 'siap' && !paksa) return
    statusTerakhir.value = 'memuat'
    try {
      const per = await Promise.all(
        daftar.value
          .filter((r) => r.status !== 'ditutup')
          .map(async (r) =>
            (await ambilTransaksiTerakhir(r.id, 5)).map((t) => ({ ...t, rekening: r })),
          ),
      )
      terakhir.value = per
        .flat()
        .sort((a, b) => new Date(b.waktu) - new Date(a.waktu))
        .slice(0, 5)
      statusTerakhir.value = 'siap'
    } catch {
      statusTerakhir.value = 'galat'
    }
  }

  async function muatUlang() {
    await muat({ paksa: true })
    if (status.value === 'siap') await muatTerakhir({ paksa: true })
  }

  return {
    daftar,
    saldoPer,
    status,
    galat,
    terakhir,
    statusTerakhir,
    totalSaldo,
    muat,
    muatTerakhir,
    muatUlang,
  }
})

/**
 * Preferensi sembunyikan nominal (hanya preferensi tampilan, bukan data rekening).
 * Default: tersembunyi di HP, terlihat di desktop.
 */
export function useSembunyikanSaldo() {
  const diHp = typeof window !== 'undefined' && window.matchMedia?.('(max-width: 767px)').matches
  return useLocalStorage('ib:sembunyikan-saldo', !!diHp)
}

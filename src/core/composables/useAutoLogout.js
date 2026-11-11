import { onScopeDispose, ref, watch } from 'vue'
import { useIdle } from '@vueuse/core'

export const BATAS_DIAM_MS = 10 * 60 * 1000
export const PERINGATAN_DETIK = 60

/**
 * Auto-logout setelah diam `batasMs` (default 10 menit). Peringatan hitung mundur
 * muncul `peringatanDetik` sebelum waktu habis.
 */
export function useAutoLogout({
  onLogout,
  batasMs = BATAS_DIAM_MS,
  peringatanDetik = PERINGATAN_DETIK,
}) {
  const { idle, reset } = useIdle(Math.max(batasMs - peringatanDetik * 1000, 1000))
  const tampil = ref(false)
  const sisa = ref(peringatanDetik)
  let timer = null

  function hentikan() {
    if (timer) clearInterval(timer)
    timer = null
    tampil.value = false
  }

  function mulai() {
    tampil.value = true
    sisa.value = peringatanDetik
    const batas = Date.now() + peringatanDetik * 1000
    timer = setInterval(() => {
      sisa.value = Math.max(0, Math.ceil((batas - Date.now()) / 1000))
      if (sisa.value <= 0) {
        hentikan()
        onLogout()
      }
    }, 250)
  }

  watch(idle, (v) => {
    if (v && !tampil.value) mulai()
  })

  function tetapMasuk() {
    hentikan()
    reset()
  }

  onScopeDispose(hentikan)

  return { tampil, sisa, tetapMasuk }
}

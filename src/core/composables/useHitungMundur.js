import { onBeforeUnmount, ref } from 'vue'

/**
 * Hitung mundur per detik (mis. setelah 429 "terlalu banyak percobaan").
 * @param {() => void} [selesai] dipanggil saat hitungan mencapai 0
 */
export function useHitungMundur(selesai) {
  const sisa = ref(0)
  let timer = null

  function berhenti() {
    clearInterval(timer)
    timer = null
  }

  function mulai(detik) {
    berhenti()
    sisa.value = Math.max(0, Math.ceil(Number(detik) || 0))
    if (sisa.value <= 0) return
    timer = setInterval(() => {
      sisa.value -= 1
      if (sisa.value <= 0) {
        berhenti()
        selesai?.()
      }
    }, 1000)
  }

  onBeforeUnmount(berhenti)
  return { sisa, mulai, berhenti }
}

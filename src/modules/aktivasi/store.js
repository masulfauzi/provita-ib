import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const KUNCI = 'ib:aktivasi'

function bacaTersimpan() {
  try {
    return JSON.parse(sessionStorage.getItem(KUNCI) || 'null')
  } catch {
    return null
  }
}

/**
 * Hasil aktivasi langkah 1. Status verifikasi sebenarnya disimpan di sesi server
 * (15 menit); salinan di sessionStorage hanya agar langkah 2 tetap tampil setelah refresh.
 */
export const useAktivasiStore = defineStore('aktivasi', () => {
  /** @type {import('vue').Ref<null | { nama, kelas, jenis_nasabah, wajib_wali, berlaku_sampai, identitas, no_rekening }>} */
  const hasil = ref(bacaTersimpan())
  /** Pesan untuk langkah 1 (mis. sesi aktivasi kedaluwarsa). */
  const pesan = ref('')

  const berlakuSampai = computed(() =>
    hasil.value?.berlaku_sampai ? new Date(hasil.value.berlaku_sampai).getTime() : 0,
  )

  function simpan(data) {
    hasil.value = data
    pesan.value = ''
    try {
      sessionStorage.setItem(KUNCI, JSON.stringify(data))
    } catch {
      /* diabaikan */
    }
  }

  function bersihkan(pesanBaru = '') {
    hasil.value = null
    pesan.value = pesanBaru
    try {
      sessionStorage.removeItem(KUNCI)
    } catch {
      /* diabaikan */
    }
  }

  return { hasil, pesan, berlakuSampai, simpan, bersihkan }
})

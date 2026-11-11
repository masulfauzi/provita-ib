<script setup>
import { computed } from 'vue'
import { jam, keTanggal, tanggal, tanggalPanjang } from '@/core/utils/format'

const props = defineProps({
  nilai: { type: [String, Date], default: null },
  /** relatif: "Hari ini" / "12 Okt 2026"; panjang: "12 Oktober 2026"; hari: "Senin, 12 Oktober 2026"; jam: "14:05"; lengkap: relatif + jam */
  mode: { type: String, default: 'relatif' },
})

const teks = computed(() => {
  if (!props.nilai) return '-'
  switch (props.mode) {
    case 'panjang':
      return tanggalPanjang(props.nilai)
    case 'hari':
      return tanggalPanjang(props.nilai, { hari: true })
    case 'jam':
      return jam(props.nilai)
    case 'lengkap':
      return `${tanggal(props.nilai)}, ${jam(props.nilai)}`
    default:
      return tanggal(props.nilai)
  }
})

const iso = computed(() => {
  if (!props.nilai) return undefined
  const d = keTanggal(props.nilai)
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
})
</script>

<template>
  <time class="tnum" :datetime="iso">{{ teks }}</time>
</template>

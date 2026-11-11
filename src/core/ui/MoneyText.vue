<script setup>
import { computed } from 'vue'
import { keSen, rupiah } from '@/core/utils/format'

const props = defineProps({
  nilai: { type: [String, Number], default: 0 },
  /** Tampilkan tanda +/− dan warna hijau/merah. */
  tanda: { type: Boolean, default: false },
  /** Paksa arah (untuk mutasi yang nominalnya selalu positif). */
  arah: { type: String, default: null, validator: (v) => [null, 'masuk', 'keluar'].includes(v) },
  sembunyikan: { type: Boolean, default: false },
})

const sen = computed(() => {
  const s = keSen(props.nilai)
  if (props.arah === 'masuk') return Math.abs(s)
  if (props.arah === 'keluar') return -Math.abs(s)
  return s
})

const teks = computed(() =>
  rupiah((sen.value / 100).toFixed(2), {
    tanda: props.tanda || !!props.arah,
    sembunyikan: props.sembunyikan,
  }),
)

const warna = computed(() => {
  if (props.sembunyikan || !(props.tanda || props.arah)) return ''
  if (sen.value > 0) return 'text-success-ink'
  if (sen.value < 0) return 'text-danger-ink'
  return ''
})
</script>

<template>
  <span
    class="tnum whitespace-nowrap"
    :class="warna"
    :aria-label="sembunyikan ? 'Nominal disembunyikan' : undefined"
  >
    {{ teks }}
  </span>
</template>

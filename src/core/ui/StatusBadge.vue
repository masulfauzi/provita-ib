<script setup>
const props = defineProps({
  label: { type: String, required: true },
  nada: {
    type: String,
    default: 'netral',
    validator: (v) => ['sukses', 'info', 'peringatan', 'bahaya', 'netral', 'utama'].includes(v),
  },
  titik: { type: Boolean, default: false },
})

const kelas = {
  sukses: 'bg-success/12 text-success-ink',
  info: 'bg-info-ink/10 text-info-ink',
  peringatan: 'bg-warning-soft text-warning-ink',
  bahaya: 'bg-danger/12 text-danger-ink',
  netral: 'bg-hairline text-muted',
  utama: 'bg-primary-soft-strong text-primary-hover',
}
</script>

<template>
  <span class="pill" :class="kelas[props.nada]">
    <span v-if="titik" class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
    {{ label }}
  </span>
</template>

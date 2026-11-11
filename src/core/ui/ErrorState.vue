<script setup>
import Button from 'primevue/button'

defineProps({
  judul: { type: String, default: 'Gagal memuat data' },
  pesan: { type: String, default: 'Terjadi kesalahan. Silakan coba lagi.' },
  memuat: { type: Boolean, default: false },
})
defineEmits(['coba-lagi'])
</script>

<template>
  <div class="flex flex-col items-center justify-center px-6 py-12 text-center" role="alert">
    <div
      class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft text-danger-ink"
    >
      <i class="pi pi-exclamation-triangle text-xl" aria-hidden="true" />
    </div>
    <p class="text-title-md text-ink">{{ judul }}</p>
    <p class="mt-1 max-w-sm text-body-md text-muted">{{ pesan }}</p>
    <Button
      class="mt-5"
      label="Coba lagi"
      icon="pi pi-refresh"
      severity="secondary"
      outlined
      :loading="memuat"
      @click="$emit('coba-lagi')"
    />
  </div>
</template>

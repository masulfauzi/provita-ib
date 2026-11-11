<script setup>
defineProps({
  ikon: { type: String, default: 'pi pi-inbox' },
  judul: { type: String, required: true },
  pesan: { type: String, default: '' },
})
</script>

<template>
  <div class="flex flex-col items-center justify-center px-6 py-12 text-center">
    <div
      class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary"
    >
      <i :class="ikon" class="text-xl" aria-hidden="true" />
    </div>
    <p class="text-title-md text-ink">{{ judul }}</p>
    <p v-if="pesan" class="mt-1 max-w-sm text-body-md text-muted">{{ pesan }}</p>
    <div v-if="$slots.default" class="mt-5"><slot /></div>
  </div>
</template>

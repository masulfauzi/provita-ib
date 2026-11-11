<script setup>
defineProps({
  judul: { type: String, required: true },
  subjudul: { type: String, default: '' },
  eyebrow: { type: String, default: '' },
})
</script>

<template>
  <header class="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
    <div class="min-w-0">
      <p v-if="eyebrow" class="mb-1 text-label-sm uppercase text-primary">{{ eyebrow }}</p>
      <h1
        class="text-[26px] leading-[34px] font-bold tracking-[-0.015em] text-ink md:text-headline-lg"
      >
        {{ judul }}
      </h1>
      <p v-if="subjudul || $slots.subjudul" class="mt-1 text-body-md text-muted">
        <slot name="subjudul">{{ subjudul }}</slot>
      </p>
    </div>
    <div v-if="$slots.default" class="flex flex-wrap items-center gap-2">
      <slot />
    </div>
  </header>
</template>

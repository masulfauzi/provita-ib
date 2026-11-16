<script setup>
defineProps({
  /** Tampilkan teks nama bank di samping logo. */
  denganTeks: { type: Boolean, default: true },
  /** Varian warna teks: gelap (di latar terang) atau terang (di latar gelap). */
  terang: { type: Boolean, default: false },
})
</script>

<template>
  <div class="flex items-center gap-3">
    <svg class="h-9 w-9 shrink-0" viewBox="0 0 40 40" aria-hidden="true">
      <rect
        width="40"
        height="40"
        rx="11"
        :style="{ fill: terang ? '#ffffff' : 'var(--color-primary)' }"
      />
      <path
        d="M13 29V11h8.2c4.1 0 6.8 2.4 6.8 6s-2.7 6-6.8 6H17.5v6H13Zm4.5-9.8h3.4c1.6 0 2.6-.9 2.6-2.2s-1-2.2-2.6-2.2h-3.4v4.4Z"
        :style="{ fill: terang ? 'var(--color-primary)' : '#ffffff' }"
      />
      <circle cx="29" cy="28" r="3" style="fill: var(--color-aksen)" />
    </svg>
    <div v-if="denganTeks" class="flex flex-col leading-tight">
      <span class="text-title-md" :class="terang ? 'text-white' : 'text-ink'">Bank Provita</span>
      <span
        class="text-label-sm uppercase"
        :class="terang ? 'text-on-primary-container' : 'text-primary'"
      >
        Bank Mini SMKN 2 Semarang
      </span>
    </div>
  </div>
</template>

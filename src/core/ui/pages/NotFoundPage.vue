<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="text-center">
    <p class="mb-2 text-display text-primary tnum">404</p>
    <h1 class="mb-2 text-headline-sm text-ink">Halaman tidak ditemukan</h1>
    <p class="mb-8 text-body-md text-muted">
      Alamat yang Anda buka tidak tersedia atau sudah dipindahkan.
    </p>
    <RouterLink
      :to="{ name: 'beranda' }"
      class="inline-flex h-11 items-center gap-2 rounded-field bg-primary px-5 text-label-md text-white hover:bg-primary-hover"
    >
      <i class="pi pi-home" aria-hidden="true" />
      Kembali ke beranda
    </RouterLink>
  </div>
</template>

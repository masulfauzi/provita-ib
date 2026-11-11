<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import { useAuthStore } from '@/core/stores/auth'
import { redirectAman } from '@/core/router/guard'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const memuat = ref(false)

async function cobaLagi() {
  memuat.value = true
  auth.dimuat = false
  try {
    await router.replace(redirectAman(route.query.kembali) || '/')
  } finally {
    memuat.value = false
  }
}
</script>

<template>
  <div class="text-center">
    <div
      class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-warning-soft text-warning-ink"
    >
      <i class="pi pi-wrench text-2xl" aria-hidden="true" />
    </div>
    <h1 class="mb-2 text-headline-sm text-ink">Sedang dalam pemeliharaan</h1>
    <p class="mb-8 text-body-md text-muted">
      Layanan Internet Banking Bank Provita sedang tidak dapat diakses. Silakan coba beberapa saat
      lagi.
    </p>
    <Button label="Coba lagi" icon="pi pi-refresh" :loading="memuat" @click="cobaLagi" />
  </div>
</template>

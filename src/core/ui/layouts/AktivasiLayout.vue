<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AppLogo from '@/core/ui/AppLogo.vue'

const route = useRoute()

const langkah = [
  { no: 1, label: 'Verifikasi' },
  { no: 2, label: 'Data & password' },
]
const sekarang = computed(() => route.meta?.langkah || 1)
</script>

<template>
  <div class="min-h-dvh bg-canvas">
    <header class="sticky top-0 z-30 border-b border-outline/70 bg-card/90 backdrop-blur">
      <div class="mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-4">
        <AppLogo />
        <p class="text-body-sm text-muted">
          <span class="hidden sm:inline">Sudah punya akun?</span>
          <RouterLink :to="{ name: 'masuk' }" class="font-semibold text-primary hover:underline">
            Masuk
          </RouterLink>
        </p>
      </div>
    </header>

    <main id="konten" class="mx-auto max-w-3xl px-4 py-8">
      <ol class="mb-8 flex items-center gap-3" aria-label="Langkah aktivasi akun">
        <template v-for="(l, i) in langkah" :key="l.no">
          <li
            class="flex items-center gap-2.5"
            :aria-current="l.no === sekarang ? 'step' : undefined"
            :data-testid="`langkah-${l.no}`"
          >
            <span
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-label-md"
              :class="
                l.no < sekarang
                  ? 'bg-success text-white'
                  : l.no === sekarang
                    ? 'bg-primary text-white'
                    : 'border border-outline-strong bg-card text-muted'
              "
            >
              <i v-if="l.no < sekarang" class="pi pi-check text-[12px]" aria-hidden="true" />
              <template v-else>{{ l.no }}</template>
            </span>
            <span class="text-label-md" :class="l.no === sekarang ? 'text-ink' : 'text-muted'">
              {{ l.no }}. {{ l.label }}
            </span>
          </li>
          <li v-if="i < langkah.length - 1" class="h-px flex-1 bg-outline" aria-hidden="true" />
        </template>
      </ol>
      <slot />
    </main>
  </div>
</template>

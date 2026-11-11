<script setup>
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import Toast from 'primevue/toast'
import AppLayout from '@/core/ui/layouts/AppLayout.vue'
import GuestLayout from '@/core/ui/layouts/GuestLayout.vue'
import OnboardingLayout from '@/core/ui/layouts/OnboardingLayout.vue'
import PolosLayout from '@/core/ui/layouts/PolosLayout.vue'

const route = useRoute()
const layouts = {
  app: AppLayout,
  tamu: GuestLayout,
  onboarding: OnboardingLayout,
  polos: PolosLayout,
}
const layout = computed(() => layouts[route.meta?.layout] || AppLayout)
</script>

<template>
  <Toast position="top-center" class="max-w-[calc(100vw-2rem)]" />
  <!-- Sebelum navigasi pertama selesai, route.matched kosong: jangan render layout dulu -->
  <component :is="layout" v-if="route.matched.length">
    <RouterView />
  </component>
</template>

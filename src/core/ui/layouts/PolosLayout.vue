<script setup>
import AppLogo from '@/core/ui/AppLogo.vue'
</script>

<template>
  <div class="flex min-h-dvh flex-col items-center justify-center bg-canvas px-4 py-10">
    <AppLogo class="mb-10" />
    <main class="card w-full max-w-lg p-6 sm:p-10">
      <slot />
    </main>
  </div>
</template>

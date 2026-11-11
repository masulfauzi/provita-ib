<script setup>
import Skeleton from 'primevue/skeleton'

defineProps({
  /** kartu: grid kartu rekening; daftar: baris transaksi; teks: beberapa baris teks */
  varian: { type: String, default: 'daftar' },
  jumlah: { type: Number, default: 3 },
})
</script>

<template>
  <div aria-busy="true" aria-live="polite">
    <span class="sr-only">Memuat…</span>
    <div v-if="varian === 'kartu'" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div v-for="i in jumlah" :key="i" class="card p-6">
        <div class="mb-6 flex items-center gap-3">
          <Skeleton shape="circle" size="2.5rem" />
          <div class="flex-1">
            <Skeleton width="60%" class="mb-2" />
            <Skeleton width="40%" height=".75rem" />
          </div>
        </div>
        <Skeleton width="30%" height=".75rem" class="mb-2" />
        <Skeleton width="70%" height="2rem" />
      </div>
    </div>
    <div v-else-if="varian === 'daftar'" class="divide-y divide-hairline">
      <div v-for="i in jumlah" :key="i" class="flex items-center gap-4 py-4">
        <Skeleton shape="circle" size="2.5rem" />
        <div class="flex-1">
          <Skeleton width="55%" class="mb-2" />
          <Skeleton width="30%" height=".75rem" />
        </div>
        <Skeleton width="6rem" />
      </div>
    </div>
    <div v-else class="space-y-3">
      <Skeleton v-for="i in jumlah" :key="i" :width="`${90 - i * 10}%`" />
    </div>
  </div>
</template>

<script setup>
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import { useAutoLogout } from '@/core/composables/useAutoLogout'
import { useKeluar } from '@/core/composables/useKeluar'

const { keluar } = useKeluar()
const { tampil, sisa, tetapMasuk } = useAutoLogout({ onLogout: () => keluar('tidak-aktif') })
</script>

<template>
  <Dialog
    :visible="tampil"
    modal
    :closable="false"
    :draggable="false"
    header="Sesi akan berakhir"
    class="w-[min(28rem,calc(100vw-2rem))]"
  >
    <div class="flex items-start gap-4">
      <div
        class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning-ink"
      >
        <i class="pi pi-clock text-xl" aria-hidden="true" />
      </div>
      <p class="text-body-lg text-ink" aria-live="assertive">
        Tidak ada aktivitas selama beberapa menit. Demi keamanan, Anda akan keluar otomatis dalam
        <strong class="tnum" data-testid="hitung-mundur">{{ sisa }}</strong> detik.
      </p>
    </div>
    <template #footer>
      <Button label="Keluar sekarang" severity="secondary" text @click="keluar('keluar')" />
      <Button label="Tetap masuk" icon="pi pi-check" autofocus @click="tetapMasuk" />
    </template>
  </Dialog>
</template>

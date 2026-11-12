<script setup>
/** Indikator kekuatan + checklist aturan password (form ganti password & aktivasi). */
import { computed } from 'vue'
import { aturanPassword, kekuatanPassword } from '@/core/utils/password'

const props = defineProps({
  password: { type: String, default: '' },
  /** Konteks aturan: { lama?, terlarang } — lihat `aturanPassword`. */
  konteks: { type: Object, default: () => ({}) },
  idDaftar: { type: String, default: 'aturan-password' },
})

const aturan = computed(() => aturanPassword(props.password || '', props.konteks))
const kekuatan = computed(() => kekuatanPassword(props.password || ''))
const warnaKekuatan = ['bg-danger', 'bg-danger', 'bg-amber-500', 'bg-success', 'bg-success-ink']
</script>

<template>
  <div class="rounded-field border border-outline bg-canvas p-4">
    <div class="mb-3 flex items-center justify-between gap-3">
      <span class="eyebrow">Kekuatan password</span>
      <span class="text-label-md text-ink" data-testid="kekuatan-label">{{
        kekuatan.label || '—'
      }}</span>
    </div>
    <div class="mb-4 grid grid-cols-4 gap-1.5" aria-hidden="true">
      <span
        v-for="i in 4"
        :key="i"
        class="h-1.5 rounded-full transition-colors"
        :class="
          password && i <= Math.max(kekuatan.skor, 1) ? warnaKekuatan[kekuatan.skor] : 'bg-outline'
        "
      />
    </div>
    <ul :id="idDaftar" class="grid gap-2" aria-label="Aturan password">
      <li
        v-for="a in aturan"
        :key="a.kode"
        class="flex items-center gap-2 text-body-md"
        :class="a.ok ? 'text-success-ink' : 'text-muted'"
        :data-testid="`aturan-${a.kode}`"
        :data-ok="a.ok"
      >
        <i :class="a.ok ? 'pi pi-check-circle' : 'pi pi-circle'" aria-hidden="true" />
        <span>{{ a.label }}</span>
        <span class="sr-only">{{ a.ok ? '(terpenuhi)' : '(belum terpenuhi)' }}</span>
      </li>
    </ul>
  </div>
</template>

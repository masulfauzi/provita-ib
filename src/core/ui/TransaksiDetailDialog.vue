<script setup>
import { computed } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import MoneyText from './MoneyText.vue'
import { infoKategori } from '@/core/utils/transaksi'
import { jam, tanggalPanjang } from '@/core/utils/format'

const props = defineProps({
  transaksi: { type: Object, default: null },
})
const terlihat = defineModel('visible', { type: Boolean, default: false })

const t = computed(() => props.transaksi)
const baris = computed(() => {
  if (!t.value) return []
  const b = [
    { label: 'No. referensi', nilai: t.value.no_referensi, tnum: true },
    { label: 'Tanggal', nilai: tanggalPanjang(t.value.waktu, { hari: true }) },
    { label: 'Jam', nilai: `${jam(t.value.waktu)} WIB`, tnum: true },
    {
      label: 'Jenis',
      nilai: `${infoKategori(t.value.kategori).label} (${t.value.jenis === 'masuk' ? 'masuk' : 'keluar'})`,
    },
  ]
  if (t.value.petugas) b.push({ label: 'Petugas', nilai: t.value.petugas })
  if (t.value.loket) b.push({ label: 'Loket', nilai: t.value.loket })
  return b
})
</script>

<template>
  <Dialog
    v-model:visible="terlihat"
    modal
    header="Detail transaksi"
    :draggable="false"
    dismissable-mask
    class="w-[min(30rem,calc(100vw-2rem))]"
  >
    <template v-if="t">
      <div class="mb-5 rounded-xl bg-canvas p-5 text-center">
        <p class="eyebrow mb-1">{{ t.keterangan }}</p>
        <MoneyText :nilai="t.nominal" :arah="t.jenis" class="text-metric" />
      </div>
      <dl class="divide-y divide-hairline">
        <div v-for="b in baris" :key="b.label" class="flex justify-between gap-4 py-3">
          <dt class="text-body-md text-muted">{{ b.label }}</dt>
          <dd class="text-right text-body-md text-ink" :class="{ tnum: b.tnum }">{{ b.nilai }}</dd>
        </div>
        <div class="flex justify-between gap-4 py-3">
          <dt class="text-body-md text-muted">Saldo setelah transaksi</dt>
          <dd class="text-body-md font-semibold text-ink">
            <MoneyText :nilai="t.saldo_setelah" />
          </dd>
        </div>
      </dl>
    </template>
    <template #footer>
      <Button label="Tutup" severity="secondary" outlined @click="terlihat = false" />
    </template>
  </Dialog>
</template>

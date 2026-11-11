<script setup>
import { computed } from 'vue'
import MoneyText from './MoneyText.vue'
import { infoKategori } from '@/core/utils/transaksi'
import { jam, tanggal } from '@/core/utils/format'

const props = defineProps({
  transaksi: { type: Object, required: true },
  sembunyikan: { type: Boolean, default: false },
  /** Tampilkan saldo setelah transaksi. */
  tampilSaldo: { type: Boolean, default: false },
  /** Tampilkan tanggal (bukan hanya jam). */
  tampilTanggal: { type: Boolean, default: true },
  /** Label tambahan, mis. nama produk rekening. */
  keterangan2: { type: String, default: '' },
})
defineEmits(['pilih'])

const kat = computed(() => infoKategori(props.transaksi.kategori))
const masuk = computed(() => props.transaksi.jenis === 'masuk')
const waktu = computed(() =>
  props.tampilTanggal
    ? `${tanggal(props.transaksi.waktu)}, ${jam(props.transaksi.waktu)}`
    : jam(props.transaksi.waktu),
)
</script>

<template>
  <button
    type="button"
    class="flex w-full items-center gap-3 border-b border-hairline py-4 text-left transition-colors last:border-b-0 hover:bg-canvas/70 sm:gap-4"
    @click="$emit('pilih', transaksi)"
  >
    <span
      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
      :class="masuk ? 'bg-success-soft text-success-ink' : 'bg-danger-soft text-danger-ink'"
      aria-hidden="true"
    >
      <i :class="kat.ikon" class="text-[14px]" />
    </span>
    <span class="min-w-0 flex-1">
      <span class="block truncate text-title-md text-ink">{{
        transaksi.keterangan || kat.label
      }}</span>
      <span class="block truncate text-body-sm text-muted">
        <span class="tnum">{{ waktu }}</span>
        <template v-if="keterangan2"> · {{ keterangan2 }}</template>
      </span>
    </span>
    <span class="flex flex-col items-end">
      <MoneyText
        :nilai="transaksi.nominal"
        :arah="transaksi.jenis"
        :sembunyikan="sembunyikan"
        class="text-title-md"
      />
      <span v-if="tampilSaldo" class="text-body-sm text-muted">
        Saldo <MoneyText :nilai="transaksi.saldo_setelah" :sembunyikan="sembunyikan" />
      </span>
    </span>
  </button>
</template>

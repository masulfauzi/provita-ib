<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useClipboard } from '@vueuse/core'
import { useToast } from 'primevue/usetoast'
import MoneyText from '@/core/ui/MoneyText.vue'
import StatusBadge from '@/core/ui/StatusBadge.vue'
import { formatRekening, selisihHari, tanggal } from '@/core/utils/format'
import { infoProduk, infoStatus } from '@/core/utils/transaksi'

const props = defineProps({
  rekening: { type: Object, required: true },
  sembunyikan: { type: Boolean, default: false },
})

const toast = useToast()
const { copy } = useClipboard({ legacy: true })

const produk = computed(() => infoProduk(props.rekening.produk))
const status = computed(() => infoStatus(props.rekening.status))
const sisaHari = computed(() =>
  props.rekening.jatuh_tempo ? selisihHari(props.rekening.jatuh_tempo) : null,
)
const progres = computed(() => {
  const r = props.rekening
  if (!r.jatuh_tempo || !r.tanggal_buka) return null
  const total = selisihHari(r.jatuh_tempo, r.tanggal_buka)
  const jalan = selisihHari(new Date(), r.tanggal_buka)
  return Math.min(100, Math.max(0, Math.round((jalan / total) * 100)))
})

async function salin() {
  await copy(props.rekening.no_rekening)
  toast.add({ severity: 'success', summary: 'Nomor rekening disalin', life: 2500 })
}
</script>

<template>
  <article
    class="card card-interactive relative flex flex-col overflow-hidden"
    data-testid="kartu-rekening"
  >
    <span class="absolute inset-x-0 top-0 h-1" :class="produk.aksen" aria-hidden="true" />
    <div class="flex items-start justify-between gap-3 p-5 pb-0 sm:p-6 sm:pb-0">
      <div class="flex min-w-0 items-center gap-3">
        <span
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          :class="produk.badge"
          aria-hidden="true"
        >
          <i :class="produk.ikon" />
        </span>
        <div class="min-w-0">
          <h3 class="truncate text-title-md text-ink">
            <RouterLink
              :to="{ name: 'rekening-detail', params: { id: rekening.id } }"
              class="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
            >
              {{ rekening.nama_produk || produk.label }}
            </RouterLink>
          </h3>
          <div class="relative z-10 flex items-center gap-1 text-body-sm text-muted">
            <span class="tnum">{{ formatRekening(rekening.no_rekening) }}</span>
            <button
              type="button"
              class="rounded p-1 text-subtle hover:bg-hairline hover:text-primary"
              :aria-label="`Salin nomor rekening ${rekening.no_rekening}`"
              @click.stop="salin"
            >
              <i class="pi pi-copy text-[12px]" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
      <StatusBadge :label="status.label" :nada="status.nada" titik />
    </div>

    <div class="mx-5 my-5 rounded-xl bg-canvas p-4 sm:mx-6">
      <p class="eyebrow mb-1">Saldo</p>
      <MoneyText
        :nilai="rekening.saldo"
        :sembunyikan="sembunyikan"
        class="block text-[24px] leading-8 font-bold tracking-[-0.02em] text-ink"
      />
    </div>

    <div v-if="rekening.jatuh_tempo" class="mt-auto px-5 pb-5 sm:px-6 sm:pb-6">
      <div class="mb-2 flex items-center justify-between text-body-sm">
        <span class="text-muted"
          >Jatuh tempo <span class="tnum text-ink">{{ tanggal(rekening.jatuh_tempo) }}</span></span
        >
        <span
          class="tnum font-semibold"
          :class="sisaHari <= 30 ? 'text-warning-ink' : 'text-primary'"
        >
          {{ sisaHari > 0 ? `${sisaHari} hari lagi` : sisaHari === 0 ? 'Hari ini' : 'Sudah lewat' }}
        </span>
      </div>
      <div
        class="h-1.5 overflow-hidden rounded-full bg-hairline"
        role="progressbar"
        :aria-valuenow="progres"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-label="`Progres menuju jatuh tempo ${progres}%`"
      >
        <div class="h-full rounded-full" :class="produk.aksen" :style="{ width: `${progres}%` }" />
      </div>
    </div>
    <div
      v-else
      class="mt-auto flex items-center justify-between px-5 pb-5 text-body-sm text-muted sm:px-6 sm:pb-6"
    >
      <span v-if="rekening.suku_bunga != null"
        >Bunga <span class="tnum text-ink">{{ Number(rekening.suku_bunga) }}% p.a.</span></span
      >
      <span v-else>{{
        rekening.tanggal_buka ? `Dibuka ${tanggal(rekening.tanggal_buka)}` : ''
      }}</span>
      <span class="flex items-center gap-1 text-primary"
        >Detail <i class="pi pi-angle-right" aria-hidden="true"
      /></span>
    </div>
  </article>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useClipboard } from '@vueuse/core'
import { useToast } from 'primevue/usetoast'
import MoneyText from '@/core/ui/MoneyText.vue'
import StatusBadge from '@/core/ui/StatusBadge.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import ErrorState from '@/core/ui/ErrorState.vue'
import LoadingSkeleton from '@/core/ui/LoadingSkeleton.vue'
import TransaksiItem from '@/core/ui/TransaksiItem.vue'
import TransaksiDetailDialog from '@/core/ui/TransaksiDetailDialog.vue'
import {
  formatRekening,
  jam,
  rupiah,
  selisihHari,
  tanggal,
  tanggalPanjang,
} from '@/core/utils/format'
import { infoProduk, infoStatus } from '@/core/utils/transaksi'
import { ambilRekening, ambilTransaksiTerakhir } from '../api'
import { useSembunyikanSaldo } from '../store'

const route = useRoute()
const toast = useToast()
const { copy } = useClipboard({ legacy: true })
const sembunyikan = useSembunyikanSaldo()

const rekening = ref(null)
const saldoPer = ref(null)
const transaksi = ref([])
const status = ref('memuat')
const galat = ref(null)

async function muat() {
  status.value = 'memuat'
  galat.value = null
  try {
    const [rek, trx] = await Promise.all([
      ambilRekening(route.params.id),
      ambilTransaksiTerakhir(route.params.id, 5),
    ])
    rekening.value = rek.data
    saldoPer.value = rek.meta?.saldo_per
    transaksi.value = trx
    status.value = 'siap'
  } catch (e) {
    galat.value = e
    status.value = 'galat'
  }
}
watch(() => route.params.id, muat, { immediate: true })

const produk = computed(() => infoProduk(rekening.value?.produk))
const st = computed(() => infoStatus(rekening.value?.status))
const sisaHari = computed(() =>
  rekening.value?.jatuh_tempo ? selisihHari(rekening.value.jatuh_tempo) : null,
)
const progres = computed(() => {
  const r = rekening.value
  if (!r?.jatuh_tempo) return null
  const total = selisihHari(r.jatuh_tempo, r.tanggal_buka)
  return Math.min(
    100,
    Math.max(0, Math.round((selisihHari(new Date(), r.tanggal_buka) / total) * 100)),
  )
})

const info = computed(() => {
  const r = rekening.value
  if (!r) return []
  const b = [{ label: 'Produk', nilai: r.nama_produk || produk.value.label }]
  if (r.tanggal_buka) b.push({ label: 'Tanggal buka', nilai: tanggalPanjang(r.tanggal_buka) })
  if (r.suku_bunga != null)
    b.push({ label: 'Suku bunga', nilai: `${Number(r.suku_bunga)}% per tahun` })
  if (r.jangka_bulan) b.push({ label: 'Jangka waktu', nilai: `${r.jangka_bulan} bulan` })
  if (r.jatuh_tempo) b.push({ label: 'Jatuh tempo', nilai: tanggalPanjang(r.jatuh_tempo) })
  if (r.setoran_rutin)
    b.push({ label: 'Setoran rutin', nilai: `${rupiah(r.setoran_rutin)} / bulan` })
  return b
})

const dipilih = ref(null)
const dialog = ref(false)
function pilih(t) {
  dipilih.value = t
  dialog.value = true
}

async function salin() {
  await copy(rekening.value.no_rekening)
  toast.add({ severity: 'success', summary: 'Nomor rekening disalin', life: 2500 })
}
</script>

<template>
  <div>
    <RouterLink
      :to="{ name: 'beranda' }"
      class="mb-4 inline-flex items-center gap-2 text-label-md text-muted hover:text-primary"
    >
      <i class="pi pi-arrow-left text-[12px]" aria-hidden="true" /> Kembali ke beranda
    </RouterLink>

    <LoadingSkeleton v-if="status === 'memuat'" varian="teks" :jumlah="6" class="card p-6" />

    <div v-else-if="status === 'galat'" class="card">
      <EmptyState
        v-if="galat?.tipe === 'tidak-ditemukan'"
        ikon="pi pi-search"
        judul="Rekening tidak ditemukan"
        pesan="Rekening ini tidak tersedia atau bukan milik Anda."
      />
      <ErrorState v-else :pesan="galat?.message" @coba-lagi="muat" />
    </div>

    <template v-else-if="rekening">
      <header class="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div class="flex items-center gap-4">
          <span
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
            :class="produk.badge"
            aria-hidden="true"
          >
            <i :class="produk.ikon" class="text-lg" />
          </span>
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="text-headline-md text-ink">{{ rekening.nama_produk || produk.label }}</h1>
              <StatusBadge :label="st.label" :nada="st.nada" titik />
            </div>
            <div class="flex items-center gap-1 text-body-md text-muted">
              <span class="tnum">{{ formatRekening(rekening.no_rekening) }}</span>
              <button
                type="button"
                class="rounded p-1 hover:bg-hairline hover:text-primary"
                aria-label="Salin nomor rekening"
                @click="salin"
              >
                <i class="pi pi-copy text-[12px]" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
        <RouterLink
          :to="{ name: 'mutasi-rekening', params: { id: rekening.id } }"
          class="inline-flex h-11 items-center justify-center gap-2 rounded-field bg-primary px-5 text-label-md text-white transition-colors hover:bg-primary-hover"
        >
          <i class="pi pi-list" aria-hidden="true" /> Lihat semua mutasi
        </RouterLink>
      </header>

      <div class="grid gap-6 lg:grid-cols-3">
        <div class="flex flex-col gap-6 lg:col-span-2">
          <section
            class="relative overflow-hidden rounded-card bg-primary-container p-6 text-white shadow-hover sm:p-8"
          >
            <div
              class="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-primary/50 blur-3xl"
              aria-hidden="true"
            />
            <div class="relative flex items-start justify-between">
              <p class="text-label-sm uppercase text-on-primary-container">Saldo</p>
              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
                :aria-label="sembunyikan ? 'Tampilkan nominal' : 'Sembunyikan nominal'"
                :aria-pressed="sembunyikan"
                @click="sembunyikan = !sembunyikan"
              >
                <i :class="sembunyikan ? 'pi pi-eye-slash' : 'pi pi-eye'" aria-hidden="true" />
              </button>
            </div>
            <MoneyText
              :nilai="rekening.saldo"
              :sembunyikan="sembunyikan"
              class="relative mt-3 block text-[34px] leading-[42px] font-bold tracking-[-0.02em]"
            />
            <p v-if="saldoPer" class="relative mt-2 text-body-sm text-white/60">
              Saldo per <span class="tnum">{{ tanggal(saldoPer) }}, {{ jam(saldoPer) }}</span>
            </p>
            <div v-if="progres !== null" class="relative mt-6">
              <div class="mb-2 flex justify-between text-body-sm text-white/75">
                <span>Menuju jatuh tempo</span>
                <span class="tnum">{{
                  sisaHari > 0 ? `${sisaHari} hari lagi` : 'Jatuh tempo'
                }}</span>
              </div>
              <div
                class="h-1.5 overflow-hidden rounded-full bg-white/15"
                role="progressbar"
                :aria-valuenow="progres"
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <div class="h-full rounded-full bg-success" :style="{ width: `${progres}%` }" />
              </div>
            </div>
          </section>

          <section class="card p-5 sm:p-6" aria-labelledby="judul-trx">
            <div class="mb-2 flex items-center justify-between">
              <h2 id="judul-trx" class="text-headline-sm text-ink">5 transaksi terakhir</h2>
            </div>
            <EmptyState
              v-if="!transaksi.length"
              judul="Belum ada transaksi"
              pesan="Belum ada transaksi dalam 3 bulan terakhir."
            />
            <TransaksiItem
              v-for="t in transaksi"
              :key="t.id"
              :transaksi="t"
              :sembunyikan="sembunyikan"
              tampil-saldo
              @pilih="pilih"
            />
            <RouterLink
              :to="{ name: 'mutasi-rekening', params: { id: rekening.id } }"
              class="mt-4 flex h-11 items-center justify-center gap-2 rounded-field border border-outline text-label-md text-ink transition-colors hover:border-outline-strong hover:bg-canvas"
            >
              Lihat semua mutasi <i class="pi pi-arrow-right text-[12px]" aria-hidden="true" />
            </RouterLink>
          </section>
        </div>

        <section class="card h-fit p-5 sm:p-6" aria-labelledby="judul-info">
          <h2 id="judul-info" class="mb-4 text-title-md text-ink">Informasi rekening</h2>
          <dl class="divide-y divide-hairline">
            <div v-for="i in info" :key="i.label" class="flex justify-between gap-4 py-3">
              <dt class="text-body-md text-muted">{{ i.label }}</dt>
              <dd class="tnum text-right text-body-md text-ink">{{ i.nilai }}</dd>
            </div>
          </dl>
        </section>
      </div>
    </template>

    <TransaksiDetailDialog v-model:visible="dialog" :transaksi="dipilih" />
  </div>
</template>

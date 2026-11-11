<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import { useToast } from 'primevue/usetoast'
import Select from 'primevue/select'
import SelectButton from 'primevue/selectbutton'
import DatePicker from 'primevue/datepicker'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Message from 'primevue/message'
import PageHeader from '@/core/ui/PageHeader.vue'
import MoneyText from '@/core/ui/MoneyText.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import ErrorState from '@/core/ui/ErrorState.vue'
import LoadingSkeleton from '@/core/ui/LoadingSkeleton.vue'
import TransaksiItem from '@/core/ui/TransaksiItem.vue'
import TransaksiDetailDialog from '@/core/ui/TransaksiDetailDialog.vue'
import { formatRekening, jam, keISODate, keTanggal, tanggal } from '@/core/utils/format'
import { infoKategori } from '@/core/utils/transaksi'
import { ambilMutasi, PER_PAGE, unduhRekeningKoran } from '../api'
import { useMutasiStore } from '../store'
import {
  bacaFilter,
  keQuery,
  kelompokkanPerTanggal,
  labelRentang,
  PILIHAN_JENIS,
  PRESET_PERIODE,
  validasiRentang,
} from '../periode'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const store = useMutasiStore()
const desktop = useBreakpoints(breakpointsTailwind).greaterOrEqual('md')

/* ---------- filter (sumber kebenaran: URL) ---------- */
const filter = computed(() => bacaFilter(route.query))
const rekeningId = computed(() => {
  const dariUrl = route.params.id || route.query.rekening
  if (dariUrl && store.rekening.some((r) => String(r.id) === String(dariUrl)))
    return String(dariUrl)
  return store.rekening[0] ? String(store.rekening[0].id) : null
})
const rekening = computed(() => store.rekening.find((r) => String(r.id) === rekeningId.value))
const rekeningTidakValid = computed(() => {
  const dariUrl = route.params.id || route.query.rekening
  return (
    store.status === 'siap' &&
    dariUrl &&
    !store.rekening.some((r) => String(r.id) === String(dariUrl))
  )
})

const pilihanRekening = computed(() =>
  store.rekening.map((r) => ({
    value: String(r.id),
    label: `${r.nama_produk} · ${formatRekening(r.no_rekening)}`,
  })),
)

function terapkan(perubahan, { pakaiReplace = false } = {}) {
  const baru = { ...filter.value, ...perubahan }
  if (!('page' in perubahan)) baru.page = 1
  const lokasi =
    route.name === 'mutasi-rekening'
      ? {
          name: 'mutasi-rekening',
          params: { id: perubahan.rekening || rekeningId.value },
          query: keQuery({ ...baru, rekening: null }),
        }
      : {
          name: 'mutasi',
          query: keQuery({ ...baru, rekening: perubahan.rekening || route.query.rekening }),
        }
  return pakaiReplace ? router.replace(lokasi) : router.push(lokasi)
}

const pilihRekening = (id) => terapkan({ rekening: id })
const pilihJenis = (jenis) => jenis && terapkan({ jenis })

/* Periode */
const rentangKustom = ref(null)
const galatRentang = ref('')
const hariIni = new Date()
function pilihPeriode(periode) {
  if (!periode) return
  galatRentang.value = ''
  if (periode === 'kustom') {
    rentangKustom.value = [keTanggal(filter.value.dari), keTanggal(filter.value.sampai)]
    periodeTampil.value = 'kustom'
    return
  }
  terapkan({ periode })
}
const periodeTampil = ref(filter.value.periode)
watch(
  () => filter.value.periode,
  (p) => (periodeTampil.value = p),
)

function terapkanKustom() {
  const [dari, sampai] = rentangKustom.value || []
  const pesan = validasiRentang(dari, sampai || dari)
  if (pesan) {
    galatRentang.value = pesan
    return
  }
  galatRentang.value = ''
  terapkan({ periode: 'kustom', dari: keISODate(dari), sampai: keISODate(sampai || dari) })
}

/* ---------- data ---------- */
const items = ref([])
const meta = ref(null)
const ringkasan = ref(null)
const status = ref('awal') // awal | memuat | siap | galat
const galat = ref(null)
const memuatLagi = ref(false)
let permintaan = 0

async function muat({ tambah = false } = {}) {
  if (!rekeningId.value) return
  const id = ++permintaan
  const page = tambah ? (meta.value?.current_page || 1) + 1 : desktop.value ? filter.value.page : 1
  if (tambah) memuatLagi.value = true
  else status.value = 'memuat'
  galat.value = null
  try {
    const hasil = await ambilMutasi(rekeningId.value, { ...filter.value, page, perPage: PER_PAGE })
    if (id !== permintaan) return
    items.value = tambah ? [...items.value, ...hasil.data] : hasil.data
    meta.value = hasil.meta
    ringkasan.value = hasil.ringkasan
    status.value = 'siap'
  } catch (e) {
    if (id !== permintaan) return
    if (tambah) {
      toast.add({ severity: 'error', summary: 'Gagal memuat', detail: e.message, life: 4000 })
    } else {
      galat.value = e
      status.value = 'galat'
    }
  } finally {
    if (id === permintaan) memuatLagi.value = false
  }
}

onMounted(() => store.muatRekening())
watch(
  [
    rekeningId,
    () => filter.value.dari,
    () => filter.value.sampai,
    () => filter.value.jenis,
    () => filter.value.page,
    desktop,
  ],
  () => muat(),
  { immediate: true },
)

const baris = computed(() =>
  items.value.map((t) => ({ ...t, tanggal: keISODate(new Date(t.waktu)) })),
)
const grup = computed(() => kelompokkanPerTanggal(items.value))
const adaLagi = computed(() => meta.value && meta.value.current_page < meta.value.last_page)

function gantiHalaman(e) {
  terapkan({ page: e.page + 1 })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

/* ---------- detail & PDF ---------- */
const dipilih = ref(null)
const dialog = ref(false)
function pilih(t) {
  dipilih.value = t
  dialog.value = true
}

const mengunduh = ref(false)
async function unduhPdf() {
  if (!rekening.value) return
  mengunduh.value = true
  try {
    const blob = await unduhRekeningKoran(rekening.value.id, filter.value)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rekening-koran-${rekening.value.no_rekening}-${filter.value.dari}-${filter.value.sampai}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    toast.add({ severity: 'success', summary: 'Rekening koran diunduh', life: 3000 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Gagal mengunduh PDF', detail: e.message, life: 5000 })
  } finally {
    mengunduh.value = false
  }
}
</script>

<template>
  <div>
    <PageHeader eyebrow="Riwayat transaksi" judul="Mutasi rekening">
      <template #subjudul>
        <span class="tnum" data-testid="label-periode">{{
          labelRentang(filter.dari, filter.sampai)
        }}</span>
      </template>
      <Button
        label="Unduh PDF"
        icon="pi pi-download"
        severity="secondary"
        outlined
        :loading="mengunduh"
        :disabled="!rekening || status !== 'siap'"
        data-testid="unduh-pdf"
        @click="unduhPdf"
      />
    </PageHeader>

    <!-- Filter -->
    <section class="card mb-6 p-4 sm:p-5" aria-label="Filter mutasi">
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_auto]">
        <div class="flex flex-col gap-1.5">
          <label for="pilih-rekening" class="text-label-md text-ink">Rekening</label>
          <Select
            :model-value="rekeningId"
            input-id="pilih-rekening"
            :options="pilihanRekening"
            option-label="label"
            option-value="value"
            :loading="store.status === 'memuat'"
            placeholder="Pilih rekening"
            fluid
            data-testid="pilih-rekening"
            @update:model-value="pilihRekening"
          />
        </div>
        <div class="flex min-w-0 flex-col gap-1.5">
          <span id="label-periode" class="text-label-md text-ink">Periode</span>
          <div class="-mx-1 overflow-x-auto px-1 pb-1">
            <SelectButton
              :model-value="periodeTampil"
              :options="PRESET_PERIODE"
              option-label="label"
              option-value="value"
              :allow-empty="false"
              aria-labelledby="label-periode"
              class="whitespace-nowrap"
              data-testid="pilih-periode"
              @update:model-value="pilihPeriode"
            />
          </div>
        </div>
        <div class="flex flex-col gap-1.5">
          <span id="label-jenis" class="text-label-md text-ink">Jenis</span>
          <SelectButton
            :model-value="filter.jenis"
            :options="PILIHAN_JENIS"
            option-label="label"
            option-value="value"
            :allow-empty="false"
            aria-labelledby="label-jenis"
            data-testid="pilih-jenis"
            @update:model-value="pilihJenis"
          />
        </div>
      </div>

      <div
        v-if="periodeTampil === 'kustom'"
        class="mt-4 flex flex-col gap-3 border-t border-hairline pt-4 sm:flex-row sm:items-end"
      >
        <div class="flex flex-1 flex-col gap-1.5">
          <label for="rentang-kustom" class="text-label-md text-ink"
            >Rentang tanggal (maks. 3 bulan)</label
          >
          <DatePicker
            v-model="rentangKustom"
            input-id="rentang-kustom"
            selection-mode="range"
            :manual-input="false"
            date-format="dd/mm/yy"
            :max-date="hariIni"
            show-icon
            icon-display="input"
            fluid
          />
        </div>
        <Button label="Terapkan" icon="pi pi-check" @click="terapkanKustom" />
      </div>
      <Message v-if="galatRentang" severity="error" class="mt-3" :closable="false">{{
        galatRentang
      }}</Message>
    </section>

    <div v-if="store.status === 'galat'" class="card">
      <ErrorState :pesan="store.galat" @coba-lagi="store.muatRekening({ paksa: true })" />
    </div>
    <div v-else-if="store.status === 'siap' && !store.rekening.length" class="card">
      <EmptyState
        ikon="pi pi-wallet"
        judul="Belum ada rekening"
        pesan="Anda belum memiliki rekening untuk ditampilkan."
      />
    </div>

    <template v-else>
      <Message v-if="rekeningTidakValid" severity="warn" class="mb-4" :closable="false">
        Rekening pada alamat tidak ditemukan. Menampilkan rekening pertama Anda.
      </Message>

      <!-- Ringkasan periode -->
      <section
        class="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4"
        aria-label="Ringkasan periode"
        data-testid="ringkasan"
      >
        <div class="card p-4 sm:p-5">
          <p class="eyebrow mb-1">Saldo awal</p>
          <MoneyText
            v-if="ringkasan"
            :nilai="ringkasan.saldo_awal"
            class="text-title-md text-ink sm:text-headline-sm"
            data-testid="saldo-awal"
          />
          <span v-else class="text-subtle">—</span>
        </div>
        <div class="card p-4 sm:p-5">
          <p class="eyebrow mb-1 flex items-center gap-1">
            <i class="pi pi-arrow-down-left text-[10px] text-success-ink" aria-hidden="true" />
            Total masuk
          </p>
          <MoneyText
            v-if="ringkasan"
            :nilai="ringkasan.total_masuk"
            class="text-title-md text-success-ink sm:text-headline-sm"
            data-testid="total-masuk"
          />
          <span v-else class="text-subtle">—</span>
        </div>
        <div class="card p-4 sm:p-5">
          <p class="eyebrow mb-1 flex items-center gap-1">
            <i class="pi pi-arrow-up-right text-[10px] text-danger-ink" aria-hidden="true" /> Total
            keluar
          </p>
          <MoneyText
            v-if="ringkasan"
            :nilai="ringkasan.total_keluar"
            class="text-title-md text-danger-ink sm:text-headline-sm"
            data-testid="total-keluar"
          />
          <span v-else class="text-subtle">—</span>
        </div>
        <div class="card p-4 sm:p-5">
          <p class="eyebrow mb-1">Saldo akhir</p>
          <MoneyText
            v-if="ringkasan"
            :nilai="ringkasan.saldo_akhir"
            class="text-title-md text-ink sm:text-headline-sm"
            data-testid="saldo-akhir"
          />
          <span v-else class="text-subtle">—</span>
        </div>
      </section>

      <!-- Daftar transaksi -->
      <section class="card overflow-hidden" aria-label="Daftar transaksi">
        <div v-if="status === 'memuat' || status === 'awal'" class="p-5">
          <LoadingSkeleton :jumlah="6" />
        </div>
        <ErrorState v-else-if="status === 'galat'" :pesan="galat?.message" @coba-lagi="muat()" />
        <EmptyState
          v-else-if="!items.length"
          ikon="pi pi-calendar-times"
          judul="Tidak ada transaksi pada periode ini"
          pesan="Coba pilih periode atau jenis transaksi yang lain."
        />

        <!-- Desktop: tabel -->
        <DataTable
          v-else-if="desktop"
          :value="baris"
          lazy
          paginator
          :rows="PER_PAGE"
          :first="(meta.current_page - 1) * PER_PAGE"
          :total-records="meta.total"
          row-group-mode="subheader"
          group-rows-by="tanggal"
          data-key="id"
          row-hover
          class="tabel-mutasi"
          :pt="{ bodyRow: { class: 'cursor-pointer' } }"
          data-testid="tabel-mutasi"
          @page="gantiHalaman"
          @row-click="(e) => pilih(e.data)"
        >
          <template #groupheader="{ data }">
            <span class="text-label-sm uppercase text-muted">{{ tanggal(data.tanggal) }}</span>
          </template>
          <Column header="Waktu" class="w-24">
            <template #body="{ data }"
              ><span class="tnum text-muted">{{ jam(data.waktu) }}</span></template
            >
          </Column>
          <Column header="Keterangan">
            <template #body="{ data }">
              <div class="flex items-center gap-3">
                <span
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  :class="
                    data.jenis === 'masuk'
                      ? 'bg-success-soft text-success-ink'
                      : 'bg-danger-soft text-danger-ink'
                  "
                  aria-hidden="true"
                >
                  <i :class="infoKategori(data.kategori).ikon" class="text-[12px]" />
                </span>
                <div>
                  <div class="text-title-md text-ink">{{ data.keterangan }}</div>
                  <div class="tnum text-body-sm text-subtle">{{ data.no_referensi }}</div>
                </div>
              </div>
            </template>
          </Column>
          <Column header="Nominal" header-class="[&>div]:justify-end" body-class="text-right">
            <template #body="{ data }"
              ><MoneyText :nilai="data.nominal" :arah="data.jenis" class="text-title-md"
            /></template>
          </Column>
          <Column header="Saldo" header-class="[&>div]:justify-end" body-class="text-right">
            <template #body="{ data }"
              ><MoneyText :nilai="data.saldo_setelah" class="text-muted"
            /></template>
          </Column>
        </DataTable>

        <!-- HP: kartu per tanggal -->
        <div v-else data-testid="daftar-mutasi">
          <div v-for="g in grup" :key="g.tanggal">
            <h3 class="sticky top-16 z-10 bg-canvas px-4 py-2 text-label-sm uppercase text-muted">
              {{ g.label }}
            </h3>
            <div class="px-4">
              <TransaksiItem
                v-for="t in g.items"
                :key="t.id"
                :transaksi="t"
                :tampil-tanggal="false"
                tampil-saldo
                @pilih="pilih"
              />
            </div>
          </div>
          <div class="border-t border-hairline p-4 text-center">
            <Button
              v-if="adaLagi"
              label="Muat lebih banyak"
              icon="pi pi-angle-down"
              severity="secondary"
              outlined
              class="w-full"
              :loading="memuatLagi"
              @click="muat({ tambah: true })"
            />
            <p v-else class="text-body-sm text-muted">
              Menampilkan semua {{ meta?.total }} transaksi pada periode ini.
            </p>
          </div>
        </div>
      </section>
    </template>

    <TransaksiDetailDialog v-model:visible="dialog" :transaksi="dipilih" />
  </div>
</template>

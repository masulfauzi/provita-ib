<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import Button from 'primevue/button'
import MoneyText from '@/core/ui/MoneyText.vue'
import EmptyState from '@/core/ui/EmptyState.vue'
import ErrorState from '@/core/ui/ErrorState.vue'
import LoadingSkeleton from '@/core/ui/LoadingSkeleton.vue'
import TransaksiItem from '@/core/ui/TransaksiItem.vue'
import TransaksiDetailDialog from '@/core/ui/TransaksiDetailDialog.vue'
import { useAuthStore } from '@/core/stores/auth'
import { jam, keSen, tanggal, tanggalPanjang } from '@/core/utils/format'
import { infoProduk } from '@/core/utils/transaksi'
import RekeningCard from '../components/RekeningCard.vue'
import { useRekeningStore, useSembunyikanSaldo } from '../store'

const auth = useAuthStore()
const store = useRekeningStore()
const sembunyikan = useSembunyikanSaldo()

const dipilih = ref(null)
const dialog = ref(false)
function pilih(t) {
  dipilih.value = t
  dialog.value = true
}

onMounted(async () => {
  await store.muat()
  if (store.status === 'siap') store.muatTerakhir()
})

const memuatUlang = ref(false)
async function muatUlang() {
  memuatUlang.value = true
  await store.muatUlang()
  memuatUlang.value = false
}

const rekeningAktif = computed(() => store.daftar.filter((r) => r.status !== 'ditutup'))
const rincian = computed(() => {
  const per = {}
  for (const r of rekeningAktif.value) {
    per[r.produk] = (per[r.produk] || 0) + keSen(r.saldo)
  }
  return Object.entries(per).map(([produk, sen]) => ({
    produk,
    label: infoProduk(produk).label,
    nilai: (sen / 100).toFixed(2),
  }))
})

const sapaanWaktu = computed(() => {
  const j = new Date().getHours()
  if (j < 11) return 'Selamat pagi'
  if (j < 15) return 'Selamat siang'
  if (j < 18) return 'Selamat sore'
  return 'Selamat malam'
})
</script>

<template>
  <div>
    <header class="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
      <div>
        <p class="mb-1 text-label-sm uppercase text-primary">{{ sapaanWaktu }}</p>
        <h1
          class="text-[26px] leading-[34px] font-bold tracking-[-0.015em] text-ink md:text-headline-lg"
          data-testid="sapaan"
        >
          Halo, {{ auth.namaPanggilan }}
        </h1>
        <p class="mt-1 flex flex-wrap items-center gap-x-2 text-body-md text-muted">
          <span v-if="auth.user?.kelas">{{ auth.user.kelas }}</span>
          <span v-if="auth.user?.kelas" aria-hidden="true">•</span>
          <span>{{ tanggalPanjang(new Date(), { hari: true }) }}</span>
        </p>
      </div>
      <div class="flex items-center gap-2 text-body-sm text-muted">
        <span v-if="store.saldoPer">
          Saldo per
          <span class="tnum text-ink"
            >{{ tanggal(store.saldoPer) }}, {{ jam(store.saldoPer) }}</span
          >
        </span>
        <Button
          icon="pi pi-refresh"
          severity="secondary"
          text
          rounded
          aria-label="Muat ulang saldo"
          :loading="memuatUlang"
          @click="muatUlang"
        />
      </div>
    </header>

    <LoadingSkeleton
      v-if="store.status === 'memuat' || store.status === 'awal'"
      varian="kartu"
      :jumlah="3"
    />

    <div v-else-if="store.status === 'galat'" class="card">
      <ErrorState :pesan="store.galat" :memuat="memuatUlang" @coba-lagi="muatUlang" />
    </div>

    <div v-else-if="!rekeningAktif.length" class="card">
      <EmptyState
        ikon="pi pi-wallet"
        judul="Belum ada rekening aktif"
        pesan="Anda belum memiliki rekening aktif. Kunjungi Ruang Bank Mini untuk membuka rekening."
      />
    </div>

    <template v-else>
      <!-- Kartu total saldo -->
      <section
        class="relative mb-8 overflow-hidden rounded-card bg-primary-container p-6 text-white shadow-hover sm:p-8"
        aria-labelledby="judul-total"
      >
        <div
          class="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-primary/50 blur-3xl"
          aria-hidden="true"
        />
        <div class="relative flex items-start justify-between gap-4">
          <div>
            <p
              class="mb-1 flex items-center gap-2 text-label-sm uppercase text-on-primary-container"
            >
              <span class="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
              <span id="judul-total">Total saldo</span>
            </p>
            <p class="text-body-md text-white/70">{{ rekeningAktif.length }} rekening aktif</p>
          </div>
          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
            :aria-label="sembunyikan ? 'Tampilkan nominal' : 'Sembunyikan nominal'"
            :aria-pressed="sembunyikan"
            data-testid="toggle-saldo"
            @click="sembunyikan = !sembunyikan"
          >
            <i :class="sembunyikan ? 'pi pi-eye-slash' : 'pi pi-eye'" aria-hidden="true" />
          </button>
        </div>
        <MoneyText
          :nilai="store.totalSaldo"
          :sembunyikan="sembunyikan"
          class="relative mt-6 block text-[34px] leading-[42px] font-bold tracking-[-0.02em] sm:text-[44px] sm:leading-[52px]"
          data-testid="total-saldo"
        />
        <dl class="relative mt-6 grid gap-3 rounded-xl bg-white/5 p-4 sm:grid-cols-3">
          <div v-for="r in rincian" :key="r.produk">
            <dt class="text-label-sm uppercase text-white/60">{{ r.label }}</dt>
            <dd class="mt-0.5 text-title-md">
              <MoneyText :nilai="r.nilai" :sembunyikan="sembunyikan" />
            </dd>
          </div>
        </dl>
      </section>

      <!-- Daftar rekening -->
      <section class="mb-8" aria-labelledby="judul-rekening">
        <div class="mb-4 flex items-end justify-between">
          <div>
            <h2 id="judul-rekening" class="text-headline-sm text-ink">Rekening saya</h2>
            <p class="text-body-sm text-muted">Ketuk kartu untuk melihat detail rekening.</p>
          </div>
        </div>
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <RekeningCard
            v-for="r in store.daftar"
            :key="r.id"
            :rekening="r"
            :sembunyikan="sembunyikan"
          />
        </div>
      </section>

      <!-- Transaksi terakhir -->
      <section class="card p-5 sm:p-6" aria-labelledby="judul-terakhir">
        <div class="mb-2 flex items-center justify-between gap-4">
          <div>
            <h2 id="judul-terakhir" class="text-headline-sm text-ink">Transaksi terakhir</h2>
            <p class="text-body-sm text-muted">5 transaksi terbaru dari semua rekening</p>
          </div>
          <RouterLink
            :to="{ name: 'mutasi' }"
            class="shrink-0 text-label-md text-primary hover:underline"
          >
            Lihat mutasi <i class="pi pi-angle-right text-[11px]" aria-hidden="true" />
          </RouterLink>
        </div>
        <LoadingSkeleton
          v-if="store.statusTerakhir === 'memuat' || store.statusTerakhir === 'awal'"
          :jumlah="5"
        />
        <ErrorState
          v-else-if="store.statusTerakhir === 'galat'"
          @coba-lagi="store.muatTerakhir({ paksa: true })"
        />
        <EmptyState
          v-else-if="!store.terakhir.length"
          judul="Belum ada transaksi"
          pesan="Belum ada transaksi dalam 3 bulan terakhir."
        />
        <div v-else>
          <TransaksiItem
            v-for="t in store.terakhir"
            :key="t.id"
            :transaksi="t"
            :sembunyikan="sembunyikan"
            :keterangan2="t.rekening?.nama_produk"
            @pilih="pilih"
          />
        </div>
      </section>
    </template>

    <TransaksiDetailDialog v-model:visible="dialog" :transaksi="dipilih" />
  </div>
</template>

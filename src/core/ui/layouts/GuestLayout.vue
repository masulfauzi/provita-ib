<script setup>
import AppLogo from '@/core/ui/AppLogo.vue'

const poin = [
  { ikon: 'pi pi-wallet', teks: 'Cek saldo Tabungan Reguler, Berjangka, dan Deposito' },
  { ikon: 'pi pi-list', teks: 'Lihat mutasi dan unduh rekening koran' },
  { ikon: 'pi pi-shield', teks: 'Sesi terenkripsi & keluar otomatis saat tidak aktif' },
]
</script>

<template>
  <div class="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
    <!-- Panel merek (desktop) -->
    <section
      class="relative hidden overflow-hidden bg-linear-to-br from-primary via-primary-hover to-primary-container p-12 text-white lg:flex lg:flex-col lg:justify-between"
      aria-hidden="true"
    >
      <div
        class="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-aksen/25 blur-3xl"
      />
      <div
        class="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-aksen/30 blur-3xl"
      />
      <AppLogo terang class="relative" />
      <div class="relative max-w-md">
        <p class="mb-3 text-label-sm uppercase text-on-primary-container">
          Internet Banking Nasabah
        </p>
        <h2 class="mb-8 text-display text-white">Saldo dan mutasi rekening Anda, di mana saja.</h2>
        <ul class="space-y-4">
          <li
            v-for="p in poin"
            :key="p.teks"
            class="flex items-center gap-3 text-body-lg text-white/85"
          >
            <span class="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
              <i :class="p.ikon" />
            </span>
            {{ p.teks }}
          </li>
        </ul>
      </div>
      <p class="relative text-body-sm text-white/60">© Bank Mini SMKN 2 Semarang</p>
    </section>

    <!-- Konten (kartu login) -->
    <main
      class="flex flex-col bg-linear-to-b from-primary-soft to-canvas items-center justify-center px-4 py-10 sm:px-8"
    >
      <AppLogo class="mb-8 lg:hidden" />
      <div class="w-full max-w-md">
        <slot />
      </div>
    </main>
  </div>
</template>

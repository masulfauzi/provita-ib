<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import Menu from 'primevue/menu'
import AppLogo from '@/core/ui/AppLogo.vue'
import AutoLogoutDialog from '@/core/ui/AutoLogoutDialog.vue'
import { useAuthStore } from '@/core/stores/auth'
import { useKeluar } from '@/core/composables/useKeluar'

const auth = useAuthStore()
const route = useRoute()
const { keluar } = useKeluar()

const navigasi = [
  {
    label: 'Beranda',
    ikon: 'pi pi-home',
    to: { name: 'beranda' },
    cocok: ['beranda', 'rekening-detail'],
  },
  {
    label: 'Mutasi',
    ikon: 'pi pi-list',
    to: { name: 'mutasi' },
    cocok: ['mutasi', 'mutasi-rekening'],
  },
  { label: 'Profil', ikon: 'pi pi-user', to: { name: 'profil' }, cocok: ['profil'] },
]
const aktif = (item) => item.cocok.includes(route.name)

const inisial = computed(() =>
  (auth.user?.nama || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase(),
)

const menu = ref()
const itemMenu = [
  { label: 'Profil & keamanan', icon: 'pi pi-user', route: { name: 'profil' } },
  { separator: true },
  { label: 'Keluar', icon: 'pi pi-sign-out', command: () => keluar('keluar') },
]
</script>

<template>
  <div class="min-h-dvh bg-canvas">
    <a
      href="#konten"
      class="sr-only z-[60] rounded-field bg-primary px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
    >
      Lewati ke konten
    </a>

    <!-- Sidebar: penuh di desktop (≥1024), rail ikon di tablet (768–1023) -->
    <aside
      class="fixed inset-y-0 left-0 z-40 hidden flex-col justify-between bg-card py-6 shadow-[0_1px_8px_rgba(0,0,0,0.04)] md:flex md:w-[72px] lg:w-64"
      aria-label="Navigasi utama"
    >
      <div class="flex flex-col">
        <div class="mb-8 px-4 lg:px-6">
          <AppLogo class="hidden lg:flex" />
          <AppLogo class="lg:hidden" :dengan-teks="false" />
        </div>
        <p class="mb-2 hidden px-7 eyebrow lg:block">Menu utama</p>
        <nav class="flex flex-col gap-1.5 px-3">
          <RouterLink
            v-for="item in navigasi"
            :key="item.label"
            :to="item.to"
            class="flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 transition-all md:justify-center lg:justify-start"
            :class="
              aktif(item)
                ? 'bg-primary text-on-primary shadow-card font-semibold'
                : 'text-muted hover:bg-primary-soft hover:text-ink'
            "
            :aria-current="aktif(item) ? 'page' : undefined"
            :title="item.label"
          >
            <i :class="item.ikon" class="text-[18px]" aria-hidden="true" />
            <span class="text-body-md md:sr-only lg:not-sr-only">{{ item.label }}</span>
          </RouterLink>
        </nav>
      </div>

      <div class="flex flex-col gap-3 px-3">
        <div
          class="hidden rounded-xl border border-primary-soft-strong bg-primary-soft p-4 lg:block"
        >
          <div class="mb-1 flex items-center gap-2 text-label-md text-primary-hover">
            <i class="pi pi-shield" aria-hidden="true" />
            Sesi aman
          </div>
          <p class="text-body-sm text-muted">
            Anda akan keluar otomatis setelah 10 menit tidak ada aktivitas.
          </p>
        </div>
        <div class="hidden rounded-xl bg-canvas p-4 lg:block">
          <div class="mb-1 flex items-center gap-2 text-label-md text-ink">
            <i class="pi pi-building-columns" aria-hidden="true" />
            Ruang Bank Mini
          </div>
          <p class="text-body-sm text-muted">
            Butuh bantuan? Datang ke Ruang Bank Mini SMKN 2 Semarang pada jam sekolah.
          </p>
        </div>
        <button
          type="button"
          class="flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-muted transition-colors hover:bg-danger-soft hover:text-danger-ink md:justify-center lg:justify-start"
          title="Keluar"
          @click="keluar('keluar')"
        >
          <i class="pi pi-sign-out text-[18px]" aria-hidden="true" />
          <span class="text-body-md md:sr-only lg:not-sr-only">Keluar</span>
        </button>
      </div>
    </aside>

    <div class="md:ml-[72px] lg:ml-64">
      <!-- Header -->
      <header
        class="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-outline/70 bg-card/90 px-4 backdrop-blur md:px-8"
      >
        <AppLogo class="md:hidden" :dengan-teks="false" />
        <div
          class="hidden items-center gap-2 rounded-full bg-primary-soft px-3 py-1.5 text-label-sm uppercase text-primary-hover sm:flex"
        >
          <i class="pi pi-lock text-[11px]" aria-hidden="true" />
          Koneksi terenkripsi
        </div>
        <button
          type="button"
          class="ml-auto flex items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-canvas"
          aria-haspopup="true"
          aria-controls="menu-profil"
          @click="menu.toggle($event)"
        >
          <span class="hidden flex-col items-end sm:flex">
            <span class="text-title-md leading-tight text-ink">{{ auth.user?.nama }}</span>
            <span class="text-body-sm text-primary">{{ auth.user?.kelas || 'Nasabah' }}</span>
          </span>
          <span
            class="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-label-md text-on-primary ring-2 ring-primary-soft-strong"
            aria-hidden="true"
          >
            {{ inisial }}
          </span>
          <span class="sr-only">Buka menu profil</span>
          <i class="pi pi-angle-down text-muted" aria-hidden="true" />
        </button>
        <Menu id="menu-profil" ref="menu" :model="itemMenu" popup>
          <template #item="{ item, props }">
            <RouterLink v-if="item.route" v-slot="{ href, navigate }" :to="item.route" custom>
              <a :href="href" v-bind="props.action" @click="navigate">
                <span :class="item.icon" />
                <span>{{ item.label }}</span>
              </a>
            </RouterLink>
            <a v-else v-bind="props.action">
              <span :class="item.icon" />
              <span>{{ item.label }}</span>
            </a>
          </template>
        </Menu>
      </header>

      <main
        id="konten"
        class="mx-auto w-full max-w-[1440px] px-4 pt-6 pb-28 md:px-8 md:pt-8 md:pb-12"
      >
        <slot />
      </main>
    </div>

    <!-- Bottom navigation (HP) -->
    <nav
      class="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-outline bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Navigasi utama"
    >
      <RouterLink
        v-for="item in navigasi"
        :key="item.label"
        :to="item.to"
        class="flex flex-col items-center gap-1 py-2.5 text-label-md"
        :class="aktif(item) ? 'text-primary' : 'text-muted'"
        :aria-current="aktif(item) ? 'page' : undefined"
      >
        <span
          class="flex h-8 w-14 items-center justify-center rounded-full transition-colors"
          :class="aktif(item) ? 'bg-primary-soft-strong' : ''"
        >
          <i :class="item.ikon" class="text-[18px]" aria-hidden="true" />
        </span>
        {{ item.label }}
      </RouterLink>
    </nav>

    <AutoLogoutDialog />
  </div>
</template>

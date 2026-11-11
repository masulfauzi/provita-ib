<script setup>
import { computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import PageHeader from '@/core/ui/PageHeader.vue'
import ErrorState from '@/core/ui/ErrorState.vue'
import LoadingSkeleton from '@/core/ui/LoadingSkeleton.vue'
import StatusBadge from '@/core/ui/StatusBadge.vue'
import PasswordForm from '@/core/ui/forms/PasswordForm.vue'
import { useAuthStore } from '@/core/stores/auth'
import { useKeluar } from '@/core/composables/useKeluar'
import { jam, tanggal, tanggalPanjang } from '@/core/utils/format'
import { useProfilStore } from '../store'

const auth = useAuthStore()
const store = useProfilStore()
const toast = useToast()
const { keluar, sedangKeluar } = useKeluar()

onMounted(() => store.muat())

const p = computed(() => store.data || {})
const inisial = computed(() =>
  (auth.user?.nama || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase(),
)
const labelJenis = { siswa: 'Siswa', guru: 'Guru', karyawan: 'Karyawan' }
const labelHubungan = { ayah: 'Ayah', ibu: 'Ibu', wali: 'Wali' }

const alamat = computed(() => {
  const d = p.value
  if (!d.alamat_jalan) return '-'
  return [
    d.alamat_jalan,
    d.rt || d.rw ? `RT ${d.rt || '-'} / RW ${d.rw || '-'}` : null,
    d.kelurahan,
    d.kecamatan,
    [d.kota, d.kode_pos].filter(Boolean).join(' '),
  ]
    .filter(Boolean)
    .join(', ')
})

const kolom = computed(() => [
  {
    label: 'Tempat, tanggal lahir',
    nilai: p.value.tempat_lahir
      ? `${p.value.tempat_lahir}, ${tanggalPanjang(p.value.tanggal_lahir)}`
      : '-',
  },
  {
    label: 'Jenis kelamin',
    nilai: { L: 'Laki-laki', P: 'Perempuan' }[p.value.jenis_kelamin] || '-',
  },
  { label: 'No. HP / WhatsApp', nilai: p.value.no_hp || '-', tnum: true },
  { label: 'Email', nilai: p.value.email || '-' },
  { label: 'Alamat', nilai: alamat.value, lebar: true },
])

function passwordDiganti() {
  toast.add({ severity: 'success', summary: 'Password berhasil diganti', life: 4000 })
}
</script>

<template>
  <div>
    <PageHeader
      eyebrow="Akun saya"
      judul="Profil & keamanan"
      subjudul="Lihat data pribadi Anda, ganti password, dan pantau aktivitas login."
    >
      <Button
        label="Keluar"
        icon="pi pi-sign-out"
        severity="danger"
        outlined
        :loading="sedangKeluar"
        @click="keluar('keluar')"
      />
    </PageHeader>

    <div class="grid gap-6 lg:grid-cols-3">
      <div class="flex flex-col gap-6 lg:col-span-2">
        <!-- Identitas -->
        <section class="card p-5 sm:p-6" aria-labelledby="judul-profil">
          <div class="mb-6 flex flex-wrap items-center gap-4">
            <span
              class="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-headline-sm text-white"
              aria-hidden="true"
            >
              {{ inisial }}
            </span>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <h2 id="judul-profil" class="text-headline-sm text-ink">{{ auth.user?.nama }}</h2>
                <StatusBadge label="Terverifikasi" nada="sukses" titik />
              </div>
              <p class="text-body-md text-muted">
                {{ labelJenis[auth.user?.jenis_nasabah] || 'Nasabah' }}
                <template v-if="auth.user?.kelas"> · {{ auth.user.kelas }}</template>
                · NIS <span class="tnum">{{ auth.user?.nis }}</span>
              </p>
            </div>
          </div>

          <LoadingSkeleton
            v-if="store.status === 'memuat' || store.status === 'awal'"
            varian="teks"
            :jumlah="5"
          />
          <ErrorState
            v-else-if="store.status === 'galat'"
            :pesan="store.galat"
            @coba-lagi="store.muat({ paksa: true })"
          />
          <template v-else>
            <dl class="grid gap-3 sm:grid-cols-2">
              <div
                v-for="k in kolom"
                :key="k.label"
                class="rounded-xl bg-canvas p-4"
                :class="{ 'sm:col-span-2': k.lebar }"
              >
                <dt class="eyebrow mb-1">{{ k.label }}</dt>
                <dd class="text-body-lg text-ink" :class="{ tnum: k.tnum }">{{ k.nilai }}</dd>
              </div>
            </dl>
            <div
              v-if="p.wali_nama"
              class="mt-3 flex items-center gap-4 rounded-xl border border-primary-soft-strong bg-primary-soft p-4"
            >
              <span
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card text-primary"
                aria-hidden="true"
              >
                <i class="pi pi-users" />
              </span>
              <div class="min-w-0">
                <p class="eyebrow">Orang tua / wali</p>
                <p class="text-title-md text-ink">
                  {{ p.wali_nama }}
                  <span class="text-body-md font-normal text-muted"
                    >({{ labelHubungan[p.wali_hubungan] || '-' }})</span
                  >
                </p>
                <p class="tnum text-body-md text-muted">{{ p.wali_hp }}</p>
              </div>
            </div>
            <p class="mt-4 flex items-center gap-2 text-body-sm text-muted">
              <i class="pi pi-info-circle" aria-hidden="true" />
              Untuk mengubah data pribadi, hubungi petugas di Ruang Bank Mini.
            </p>
          </template>
        </section>

        <!-- Riwayat login -->
        <section class="card p-5 sm:p-6" aria-labelledby="judul-login">
          <div class="mb-4 flex items-start gap-3">
            <span
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary"
              aria-hidden="true"
            >
              <i class="pi pi-history" />
            </span>
            <div>
              <h2 id="judul-login" class="text-title-md text-ink">Login terakhir</h2>
              <p class="text-body-sm text-muted">
                Bila ada aktivitas yang tidak Anda kenali, segera ganti password.
              </p>
            </div>
          </div>
          <LoadingSkeleton v-if="store.status !== 'siap'" :jumlah="3" />
          <p v-else-if="!p.riwayat_login?.length" class="text-body-md text-muted">
            Riwayat login belum tersedia.
          </p>
          <ul v-else class="flex flex-col gap-3">
            <li
              v-for="(l, i) in p.riwayat_login.slice(0, 5)"
              :key="l.waktu"
              class="flex items-center gap-4 rounded-xl bg-canvas p-4"
            >
              <span
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card text-muted"
                aria-hidden="true"
              >
                <i
                  :class="
                    l.perangkat?.includes('HP') || l.perangkat?.includes('Android')
                      ? 'pi pi-mobile'
                      : 'pi pi-desktop'
                  "
                />
              </span>
              <div class="min-w-0 flex-1">
                <p class="flex flex-wrap items-center gap-2 text-title-md text-ink">
                  {{ l.perangkat || 'Perangkat tidak dikenal' }}
                  <StatusBadge v-if="i === 0" label="Sesi ini" nada="utama" />
                </p>
                <p class="tnum text-body-sm text-muted">
                  {{ tanggal(l.waktu) }}, {{ jam(l.waktu)
                  }}<template v-if="l.ip"> · IP {{ l.ip }}</template>
                </p>
              </div>
            </li>
          </ul>
        </section>
      </div>

      <!-- Keamanan -->
      <div class="flex flex-col gap-6">
        <section class="card p-5 sm:p-6" aria-labelledby="judul-password">
          <div class="mb-5 flex items-start gap-3">
            <span
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary"
              aria-hidden="true"
            >
              <i class="pi pi-key" />
            </span>
            <div>
              <h2 id="judul-password" class="text-title-md text-ink">Ganti password</h2>
              <p class="text-body-sm text-muted">
                Gunakan password yang tidak dipakai di layanan lain.
              </p>
            </div>
          </div>
          <PasswordForm label-kirim="Simpan password" @berhasil="passwordDiganti" />
        </section>

        <section class="rounded-card border-l-[3px] border-primary bg-primary-soft p-5">
          <p class="mb-1 flex items-center gap-2 text-title-md text-primary-hover">
            <i class="pi pi-shield" aria-hidden="true" /> Tips keamanan
          </p>
          <ul class="list-disc space-y-1 pl-5 text-body-sm text-muted">
            <li>Jangan bagikan password kepada siapa pun, termasuk petugas.</li>
            <li>Selalu keluar setelah memakai komputer bersama.</li>
            <li>Sesi berakhir otomatis setelah 10 menit tidak aktif.</li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>

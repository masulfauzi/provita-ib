<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { useDebounceFn, useEventListener } from '@vueuse/core'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import DatePicker from 'primevue/datepicker'
import RadioButton from 'primevue/radiobutton'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import Message from 'primevue/message'
import FormField from '@/core/ui/forms/FormField.vue'
import { useAuthStore } from '@/core/stores/auth'
import { keISODate, keTanggal } from '@/core/utils/format'
import { buatSchemaDataPribadi, NILAI_AWAL } from '../schema'
import { simpanDataPribadi } from '../api'

const KUNCI_DRAF = 'ib:draf-data-pribadi'

const auth = useAuthStore()
const router = useRouter()
const toast = useToast()

const jenisNasabah = computed(() => auth.user?.jenis_nasabah || 'siswa')
const wajibWali = computed(() => jenisNasabah.value === 'siswa')
const labelJenis = { siswa: 'Siswa', guru: 'Guru', karyawan: 'Karyawan' }

const {
  defineField,
  handleSubmit,
  errors,
  values,
  setValues,
  setErrors,
  isSubmitting,
  submitCount,
} = useForm({
  validationSchema: toTypedSchema(buatSchemaDataPribadi(jenisNasabah.value)),
  initialValues: { ...NILAI_AWAL },
})

const f = Object.fromEntries(Object.keys(NILAI_AWAL).map((k) => [k, defineField(k)]))
const [tempatLahir] = f.tempat_lahir
const [tanggalLahir] = f.tanggal_lahir
const [jenisKelamin] = f.jenis_kelamin
const [alamatJalan] = f.alamat_jalan
const [rt] = f.rt
const [rw] = f.rw
const [kelurahan] = f.kelurahan
const [kecamatan] = f.kecamatan
const [kota] = f.kota
const [kodePos] = f.kode_pos
const [noHp] = f.no_hp
const [email] = f.email
const [waliNama] = f.wali_nama
const [waliHubungan] = f.wali_hubungan
const [waliHp] = f.wali_hp
const [persetujuan] = f.persetujuan

const pilihanHubungan = [
  { label: 'Ayah', value: 'ayah' },
  { label: 'Ibu', value: 'ibu' },
  { label: 'Wali', value: 'wali' },
]
const hariIni = new Date()
const pesanUmum = ref('')

/* ---- Draf di sessionStorage (hilang saat tab ditutup / logout) ---- */
onMounted(() => {
  try {
    const draf = JSON.parse(sessionStorage.getItem(KUNCI_DRAF) || 'null')
    if (draf) {
      setValues(
        {
          ...draf,
          tanggal_lahir: draf.tanggal_lahir ? keTanggal(draf.tanggal_lahir) : null,
          persetujuan: false,
        },
        false,
      )
    }
  } catch {
    /* draf rusak diabaikan */
  }
})
let terkirim = false
function simpanDrafSekarang(v) {
  if (terkirim) return
  try {
    const { persetujuan: _p, ...isi } = v
    sessionStorage.setItem(
      KUNCI_DRAF,
      JSON.stringify({
        ...isi,
        tanggal_lahir: isi.tanggal_lahir ? keISODate(isi.tanggal_lahir) : null,
      }),
    )
  } catch {
    /* diabaikan */
  }
}
const simpanDraf = useDebounceFn(simpanDrafSekarang, 400)
watch(values, (v) => simpanDraf({ ...v }), { deep: true })
// Simpan segera saat halaman di-refresh / ditutup (debounce mungkin belum jalan)
useEventListener(window, 'pagehide', () => simpanDrafSekarang({ ...values }))

const kirim = handleSubmit(
  async (v) => {
    pesanUmum.value = ''
    const payload = { ...v, tanggal_lahir: keISODate(v.tanggal_lahir), email: v.email || null }
    if (!wajibWali.value && !v.wali_nama) {
      payload.wali_nama = null
      payload.wali_hubungan = null
      payload.wali_hp = null
    }
    try {
      await simpanDataPribadi(payload)
      terkirim = true
      try {
        sessionStorage.removeItem(KUNCI_DRAF)
      } catch {
        /* diabaikan */
      }
      auth.tandaiProfilLengkap()
      toast.add({
        severity: 'success',
        summary: `Selamat datang, ${auth.namaPanggilan}!`,
        detail: 'Data pribadi Anda berhasil disimpan.',
        life: 5000,
      })
      await router.replace({ name: 'beranda' })
    } catch (e) {
      if (e.tipe === 'validasi') {
        setErrors(e.fieldErrors)
        pesanUmum.value = 'Beberapa isian belum sesuai. Periksa kembali kolom yang ditandai.'
      } else {
        pesanUmum.value = e.message
      }
    }
  },
  () => {
    pesanUmum.value = 'Beberapa isian belum sesuai. Periksa kembali kolom yang ditandai.'
    // fokus ke field pertama yang error
    requestAnimationFrame(() =>
      document.querySelector('[aria-invalid="true"], .p-invalid input')?.focus(),
    )
  },
)
</script>

<template>
  <form class="flex flex-col gap-6" novalidate @submit="kirim">
    <div>
      <h1 class="text-headline-md text-ink">Lengkapi data pribadi</h1>
      <p class="mt-1 text-body-md text-muted">
        Isi data berikut satu kali saja. Data digunakan Bank Mini untuk keperluan layanan rekening
        Anda.
      </p>
    </div>

    <Message
      v-if="pesanUmum && submitCount > 0"
      severity="error"
      :closable="false"
      data-testid="galat-form"
    >
      {{ pesanUmum }}
    </Message>

    <!-- A. Data dari Bank Mini -->
    <section class="card p-5 sm:p-6" aria-labelledby="judul-a">
      <div class="mb-4 flex items-center justify-between gap-3">
        <h2 id="judul-a" class="text-title-md text-ink">A. Data dari Bank Mini</h2>
        <span class="pill bg-hairline text-muted"
          ><i class="pi pi-lock text-[10px]" aria-hidden="true" /> Hanya baca</span
        >
      </div>
      <dl class="grid gap-3 sm:grid-cols-2">
        <div class="rounded-xl bg-canvas p-4">
          <dt class="eyebrow mb-1">Nama lengkap</dt>
          <dd class="text-body-lg text-ink">{{ auth.user?.nama }}</dd>
        </div>
        <div class="rounded-xl bg-canvas p-4">
          <dt class="eyebrow mb-1">NIS</dt>
          <dd class="tnum text-body-lg text-ink">{{ auth.user?.nis }}</dd>
        </div>
        <div class="rounded-xl bg-canvas p-4">
          <dt class="eyebrow mb-1">Kelas</dt>
          <dd class="text-body-lg text-ink">{{ auth.user?.kelas || '-' }}</dd>
        </div>
        <div class="rounded-xl bg-canvas p-4">
          <dt class="eyebrow mb-1">Jenis nasabah</dt>
          <dd class="text-body-lg text-ink" data-testid="jenis-nasabah">
            {{ labelJenis[jenisNasabah] }}
          </dd>
        </div>
      </dl>
      <p class="mt-3 flex items-center gap-2 text-body-sm text-muted">
        <i class="pi pi-info-circle" aria-hidden="true" />
        Bila ada data yang salah, hubungi petugas di Ruang Bank Mini.
      </p>
    </section>

    <!-- B. Data pribadi -->
    <section class="card p-5 sm:p-6" aria-labelledby="judul-b">
      <h2 id="judul-b" class="mb-4 text-title-md text-ink">B. Data pribadi</h2>
      <div class="grid gap-5 sm:grid-cols-2">
        <FormField id="tempat_lahir" label="Tempat lahir" :error="errors.tempat_lahir">
          <InputText
            id="tempat_lahir"
            v-model="tempatLahir"
            :invalid="!!errors.tempat_lahir"
            fluid
            autocomplete="off"
          />
        </FormField>
        <FormField id="tanggal_lahir" label="Tanggal lahir" :error="errors.tanggal_lahir">
          <DatePicker
            v-model="tanggalLahir"
            input-id="tanggal_lahir"
            date-format="dd/mm/yy"
            placeholder="hh/bb/tttt"
            :max-date="hariIni"
            show-icon
            icon-display="input"
            :invalid="!!errors.tanggal_lahir"
            fluid
          />
        </FormField>

        <fieldset class="sm:col-span-2">
          <legend class="mb-1.5 text-label-md text-ink">Jenis kelamin</legend>
          <div class="flex gap-6">
            <label class="flex items-center gap-2 text-body-md">
              <RadioButton
                v-model="jenisKelamin"
                input-id="jk-l"
                value="L"
                :invalid="!!errors.jenis_kelamin"
              />
              Laki-laki
            </label>
            <label class="flex items-center gap-2 text-body-md">
              <RadioButton
                v-model="jenisKelamin"
                input-id="jk-p"
                value="P"
                :invalid="!!errors.jenis_kelamin"
              />
              Perempuan
            </label>
          </div>
          <p v-if="errors.jenis_kelamin" class="mt-1.5 text-body-sm text-danger-ink" role="alert">
            {{ errors.jenis_kelamin }}
          </p>
        </fieldset>

        <FormField
          id="alamat_jalan"
          label="Alamat (jalan, nomor rumah)"
          :error="errors.alamat_jalan"
          class="sm:col-span-2"
        >
          <InputText
            id="alamat_jalan"
            v-model="alamatJalan"
            :invalid="!!errors.alamat_jalan"
            fluid
            autocomplete="street-address"
          />
        </FormField>
        <div class="grid grid-cols-2 gap-4">
          <FormField id="rt" label="RT" :error="errors.rt">
            <InputText
              id="rt"
              v-model="rt"
              inputmode="numeric"
              maxlength="3"
              :invalid="!!errors.rt"
              fluid
            />
          </FormField>
          <FormField id="rw" label="RW" :error="errors.rw">
            <InputText
              id="rw"
              v-model="rw"
              inputmode="numeric"
              maxlength="3"
              :invalid="!!errors.rw"
              fluid
            />
          </FormField>
        </div>
        <FormField id="kelurahan" label="Kelurahan / desa" :error="errors.kelurahan">
          <InputText id="kelurahan" v-model="kelurahan" :invalid="!!errors.kelurahan" fluid />
        </FormField>
        <FormField id="kecamatan" label="Kecamatan" :error="errors.kecamatan">
          <InputText id="kecamatan" v-model="kecamatan" :invalid="!!errors.kecamatan" fluid />
        </FormField>
        <FormField id="kota" label="Kota / kabupaten" :error="errors.kota">
          <InputText id="kota" v-model="kota" :invalid="!!errors.kota" fluid />
        </FormField>
        <FormField id="kode_pos" label="Kode pos" :error="errors.kode_pos">
          <InputText
            id="kode_pos"
            v-model="kodePos"
            inputmode="numeric"
            maxlength="5"
            :invalid="!!errors.kode_pos"
            fluid
            autocomplete="postal-code"
          />
        </FormField>
        <FormField
          id="no_hp"
          label="No. HP / WhatsApp"
          :error="errors.no_hp"
          hint="Contoh: 081234567890"
        >
          <InputText
            id="no_hp"
            v-model="noHp"
            inputmode="tel"
            maxlength="13"
            :invalid="!!errors.no_hp"
            fluid
            autocomplete="tel"
          />
        </FormField>
        <FormField
          id="email"
          label="Email"
          opsional
          :error="errors.email"
          hint="Untuk pemulihan password di kemudian hari."
          class="sm:col-span-2"
        >
          <InputText
            id="email"
            v-model="email"
            type="email"
            :invalid="!!errors.email"
            fluid
            autocomplete="email"
          />
        </FormField>
      </div>
    </section>

    <!-- C. Orang tua / wali -->
    <section class="card p-5 sm:p-6" aria-labelledby="judul-c" data-testid="bagian-wali">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 id="judul-c" class="text-title-md text-ink">C. Kontak orang tua / wali</h2>
        <span v-if="wajibWali" class="pill bg-primary-soft-strong text-primary-hover"
          >Wajib untuk siswa</span
        >
        <span v-else class="pill bg-hairline text-muted">Opsional</span>
      </div>
      <div class="grid gap-5 sm:grid-cols-2">
        <FormField
          id="wali_nama"
          label="Nama orang tua / wali"
          :opsional="!wajibWali"
          :error="errors.wali_nama"
          class="sm:col-span-2"
        >
          <InputText id="wali_nama" v-model="waliNama" :invalid="!!errors.wali_nama" fluid />
        </FormField>
        <FormField
          id="wali_hubungan"
          label="Hubungan"
          :opsional="!wajibWali"
          :error="errors.wali_hubungan"
        >
          <Select
            v-model="waliHubungan"
            input-id="wali_hubungan"
            :options="pilihanHubungan"
            option-label="label"
            option-value="value"
            placeholder="Pilih hubungan"
            :invalid="!!errors.wali_hubungan"
            fluid
          />
        </FormField>
        <FormField
          id="wali_hp"
          label="No. HP orang tua / wali"
          :opsional="!wajibWali"
          :error="errors.wali_hp"
        >
          <InputText
            id="wali_hp"
            v-model="waliHp"
            inputmode="tel"
            maxlength="13"
            :invalid="!!errors.wali_hp"
            fluid
          />
        </FormField>
      </div>
    </section>

    <!-- Persetujuan -->
    <section class="card border-l-[3px] border-l-primary p-5 sm:p-6">
      <label class="flex items-start gap-3 text-body-md text-ink">
        <Checkbox
          v-model="persetujuan"
          input-id="persetujuan"
          binary
          :invalid="!!errors.persetujuan"
          class="mt-0.5"
        />
        <span>
          Data yang saya isi benar, dan saya setuju data ini digunakan oleh Bank Mini SMKN 2
          Semarang untuk keperluan layanan rekening.
        </span>
      </label>
      <p v-if="errors.persetujuan" class="mt-2 text-body-sm text-danger-ink" role="alert">
        {{ errors.persetujuan }}
      </p>
    </section>

    <div class="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p class="text-body-sm text-muted">
        <i class="pi pi-save mr-1" aria-hidden="true" />Isian disimpan sementara di perangkat ini
        sampai berhasil dikirim.
      </p>
      <Button
        type="submit"
        label="Simpan & lanjut ke beranda"
        icon="pi pi-arrow-right"
        icon-pos="right"
        :loading="isSubmitting"
      />
    </div>
  </form>
</template>

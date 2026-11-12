<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { useDebounceFn, useEventListener, useNow } from '@vueuse/core'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import DatePicker from 'primevue/datepicker'
import RadioButton from 'primevue/radiobutton'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import Message from 'primevue/message'
import FormField from '@/core/ui/forms/FormField.vue'
import AturanPassword from '@/core/ui/forms/AturanPassword.vue'
import { keISODate, keTanggal, normalisasiHp } from '@/core/utils/format'
import { buatSchemaAktivasi, FIELD_RAHASIA, NILAI_AWAL } from '../schema'
import { kirimAktivasi } from '../api'
import { useAktivasiStore } from '../store'

const KUNCI_DRAF = 'ib:draf-aktivasi'

const router = useRouter()
const toast = useToast()
const store = useAktivasiStore()

const hasil = computed(() => store.hasil || {})
const wajibWali = computed(() => !!hasil.value.wajib_wali)
const labelJenis = { siswa: 'Siswa', guru: 'Guru', karyawan: 'Karyawan', lembaga: 'Lembaga' }
const terlarang = computed(() => [hasil.value.identitas, hasil.value.no_rekening])

/* ---- Batas waktu sesi aktivasi (15 menit sejak langkah 1) ---- */
const sekarang = useNow({ interval: 1000 })
const sisaDetik = computed(() =>
  Math.max(0, Math.floor((store.berlakuSampai - sekarang.value.getTime()) / 1000)),
)
const kedaluwarsa = computed(() => !!store.hasil && sisaDetik.value <= 0)
const sisaWaktu = computed(() => {
  const m = Math.floor(sisaDetik.value / 60)
  const d = sisaDetik.value % 60
  return `${m}:${String(d).padStart(2, '0')}`
})

function ulangiVerifikasi(pesan = '') {
  store.bersihkan(pesan)
  router.replace({ name: 'aktivasi' })
}

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
  validationSchema: toTypedSchema(
    buatSchemaAktivasi({ wajibWali: wajibWali.value, terlarang: terlarang.value }),
  ),
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
const [email] = f.email
const [waliNama] = f.wali_nama
const [waliHubungan] = f.wali_hubungan
const [waliHp] = f.wali_hp
const [noHp] = f.no_hp
const [noHpUlang] = f.no_hp_confirmation
const [password] = f.password
const [passwordUlang] = f.password_confirmation
const [persetujuan] = f.persetujuan

const konteksPassword = computed(() => ({
  terlarang: [...terlarang.value, normalisasiHp(noHp.value)],
}))

const pilihanHubungan = [
  { label: 'Ayah', value: 'ayah' },
  { label: 'Ibu', value: 'ibu' },
  { label: 'Wali', value: 'wali' },
]
const hariIni = new Date()
const pesanUmum = ref('')

/* ---- Draf di sessionStorage, tanpa password (hilang saat tab ditutup) ---- */
onMounted(() => {
  if (!store.hasil) {
    router.replace({ name: 'aktivasi' })
    return
  }
  try {
    const draf = JSON.parse(sessionStorage.getItem(KUNCI_DRAF) || 'null')
    if (draf) {
      setValues(
        {
          ...draf,
          tanggal_lahir: draf.tanggal_lahir ? keTanggal(draf.tanggal_lahir) : null,
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
  if (terkirim || !store.hasil) return
  try {
    const isi = Object.fromEntries(Object.entries(v).filter(([k]) => !FIELD_RAHASIA.includes(k)))
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
function hapusDraf() {
  try {
    sessionStorage.removeItem(KUNCI_DRAF)
  } catch {
    /* diabaikan */
  }
}
const simpanDraf = useDebounceFn(simpanDrafSekarang, 400)
watch(values, (v) => simpanDraf({ ...v }), { deep: true })
// Simpan segera saat halaman di-refresh / ditutup (debounce mungkin belum jalan)
useEventListener(window, 'pagehide', () => simpanDrafSekarang({ ...values }))

const PESAN_PERIKSA = 'Beberapa isian belum sesuai. Periksa kembali kolom yang ditandai.'

function fokusGalat() {
  requestAnimationFrame(() =>
    document.querySelector('[aria-invalid="true"], .p-invalid input')?.focus(),
  )
}

const kirim = handleSubmit(
  async (v) => {
    pesanUmum.value = ''
    const payload = {
      ...v,
      tanggal_lahir: keISODate(v.tanggal_lahir),
      email: v.email || null,
      no_hp: normalisasiHp(v.no_hp),
      no_hp_confirmation: normalisasiHp(v.no_hp_confirmation),
      wali_hp: v.wali_hp ? normalisasiHp(v.wali_hp) : null,
    }
    if (!wajibWali.value && !v.wali_nama) {
      payload.wali_nama = null
      payload.wali_hubungan = null
      payload.wali_hp = null
    }
    try {
      const { message, no_hp } = await kirimAktivasi(payload)
      terkirim = true
      hapusDraf()
      store.bersihkan()
      toast.add({
        severity: 'success',
        summary: 'Aktivasi berhasil',
        detail: message || 'Silakan masuk menggunakan No. HP dan password Anda.',
        life: 6000,
      })
      await router.replace({
        name: 'masuk',
        query: { alasan: 'aktivasi' },
        state: { noHp: no_hp || payload.no_hp },
      })
    } catch (e) {
      if (e.tipe === 'validasi') {
        setErrors(e.fieldErrors)
        pesanUmum.value = PESAN_PERIKSA
        fokusGalat()
      } else if (e.kode === 'VERIFIKASI_DIPERLUKAN') {
        ulangiVerifikasi(e.message)
      } else if (e.tipe === 'konflik') {
        terkirim = true
        hapusDraf()
        store.bersihkan()
        toast.add({ severity: 'info', summary: e.message, life: 6000 })
        await router.replace({ name: 'masuk' })
      } else {
        pesanUmum.value = e.message
      }
    }
  },
  () => {
    pesanUmum.value = PESAN_PERIKSA
    fokusGalat()
  },
)
</script>

<template>
  <form v-if="store.hasil" class="flex flex-col gap-6" novalidate @submit="kirim">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-headline-md text-ink">Data pribadi & akun</h1>
        <p class="mt-1 text-body-md text-muted">
          Lengkapi data berikut, lalu buat No. HP dan password untuk masuk Internet Banking.
        </p>
      </div>
      <span
        class="pill tnum"
        :class="sisaDetik <= 120 ? 'bg-danger-soft text-danger-ink' : 'bg-hairline text-muted'"
        data-testid="sisa-waktu"
        role="timer"
        aria-live="off"
      >
        <i class="pi pi-clock text-[11px]" aria-hidden="true" /> Sisa waktu {{ sisaWaktu }}
      </span>
    </div>

    <Message
      v-if="kedaluwarsa"
      severity="warn"
      :closable="false"
      data-testid="aktivasi-kedaluwarsa"
    >
      <div>Waktu aktivasi sudah habis (15 menit). Ulangi verifikasi untuk melanjutkan.</div>
      <Button label="Ulangi verifikasi" size="small" class="mt-3" @click="ulangiVerifikasi()" />
    </Message>

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
          <dd class="text-body-lg text-ink">{{ hasil.nama }}</dd>
        </div>
        <div class="rounded-xl bg-canvas p-4">
          <dt class="eyebrow mb-1">Jenis nasabah</dt>
          <dd class="text-body-lg text-ink" data-testid="jenis-nasabah">
            {{ labelJenis[hasil.jenis_nasabah] || '-' }}
            <template v-if="hasil.kelas"> · {{ hasil.kelas }}</template>
          </dd>
        </div>
        <div class="rounded-xl bg-canvas p-4">
          <dt class="eyebrow mb-1">NISN / No. nasabah</dt>
          <dd class="tnum text-body-lg text-ink">{{ hasil.identitas }}</dd>
        </div>
        <div class="rounded-xl bg-canvas p-4">
          <dt class="eyebrow mb-1">Nomor rekening</dt>
          <dd class="tnum text-body-lg text-ink">{{ hasil.no_rekening }}</dd>
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
        <FormField id="email" label="Email" opsional :error="errors.email" class="sm:col-span-2">
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
            type="tel"
            inputmode="tel"
            maxlength="20"
            :invalid="!!errors.wali_hp"
            fluid
          />
        </FormField>
      </div>
    </section>

    <!-- D. Akun Internet Banking -->
    <section class="card p-5 sm:p-6" aria-labelledby="judul-d">
      <h2 id="judul-d" class="mb-4 text-title-md text-ink">D. Akun Internet Banking</h2>
      <div
        class="mb-5 flex items-start gap-3 rounded-xl border-l-[3px] border-primary bg-primary-soft p-4"
        data-testid="info-id-login"
      >
        <i class="pi pi-mobile mt-0.5 text-primary" aria-hidden="true" />
        <p class="text-body-md text-ink">
          No. HP yang Anda isi akan menjadi <strong>ID login</strong> Internet Banking. Pastikan
          nomor aktif dan milik Anda sendiri.
        </p>
      </div>
      <div class="grid gap-5 sm:grid-cols-2">
        <FormField id="no_hp" label="No. HP" :error="errors.no_hp" hint="Contoh: 081234567890">
          <InputText
            id="no_hp"
            v-model="noHp"
            type="tel"
            inputmode="tel"
            maxlength="20"
            autocomplete="tel"
            :invalid="!!errors.no_hp"
            fluid
          />
        </FormField>
        <FormField id="no_hp_confirmation" label="Ulangi No. HP" :error="errors.no_hp_confirmation">
          <InputText
            id="no_hp_confirmation"
            v-model="noHpUlang"
            type="tel"
            inputmode="tel"
            maxlength="20"
            autocomplete="off"
            :invalid="!!errors.no_hp_confirmation"
            fluid
          />
        </FormField>
        <FormField id="password" label="Password" :error="errors.password">
          <Password
            v-model="password"
            input-id="password"
            :feedback="false"
            toggle-mask
            fluid
            autocomplete="new-password"
            :invalid="!!errors.password"
            :input-props="{ 'aria-describedby': 'aturan-password' }"
          />
        </FormField>
        <FormField
          id="password_confirmation"
          label="Ulangi password"
          :error="errors.password_confirmation"
        >
          <Password
            v-model="passwordUlang"
            input-id="password_confirmation"
            :feedback="false"
            toggle-mask
            fluid
            autocomplete="new-password"
            :invalid="!!errors.password_confirmation"
          />
        </FormField>
        <AturanPassword
          class="sm:col-span-2"
          :password="password || ''"
          :konteks="konteksPassword"
        />
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
        <i class="pi pi-save mr-1" aria-hidden="true" />Isian (kecuali password) disimpan sementara
        di perangkat ini sampai berhasil dikirim.
      </p>
      <Button
        type="submit"
        label="Aktivasi akun"
        icon="pi pi-check"
        icon-pos="right"
        :loading="isSubmitting"
        :disabled="kedaluwarsa"
      />
    </div>
  </form>
</template>

<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Message from 'primevue/message'
import FormField from '@/core/ui/forms/FormField.vue'
import { pesanBatas } from '@/core/http/errors'
import { useHitungMundur } from '@/core/composables/useHitungMundur'
import { schemaVerifikasi } from '../schema'
import { cekAktivasi } from '../api'
import { useAktivasiStore } from '../store'

const router = useRouter()
const store = useAktivasiStore()

const labelJenis = { siswa: 'Siswa', guru: 'Guru', karyawan: 'Karyawan', lembaga: 'Lembaga' }

const { defineField, handleSubmit, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(schemaVerifikasi),
  initialValues: { identitas: '', no_rekening: '' },
})
const [identitas, identitasAttrs] = defineField('identitas')
const [noRekening, noRekeningAttrs] = defineField('no_rekening')

const galat = ref(store.pesan)
const sisaPercobaan = ref(null)
const sudahAktivasi = ref('')
/** Hasil cek yang menunggu konfirmasi "Apakah ini Anda?". */
const konfirmasi = ref(null)
const { sisa: tungguDetik, mulai: mulaiTunggu } = useHitungMundur(() => (galat.value = ''))

const cek = handleSubmit(async (v) => {
  galat.value = ''
  sisaPercobaan.value = null
  sudahAktivasi.value = ''
  store.pesan = ''
  try {
    const data = await cekAktivasi(v)
    konfirmasi.value = { ...data, identitas: v.identitas, no_rekening: v.no_rekening }
  } catch (e) {
    if (e.tipe === 'konflik') {
      sudahAktivasi.value = e.message
    } else if (e.tipe === 'validasi') {
      galat.value = e.fieldErrors?.identitas || e.fieldErrors?.no_rekening || e.message
      sisaPercobaan.value = e.data?.sisa_percobaan ?? null
    } else if (e.tipe === 'batas') {
      galat.value = pesanBatas(e.retryAfter)
      mulaiTunggu(e.retryAfter || 60)
    } else {
      galat.value = e.message
    }
  }
})

function lanjut() {
  store.simpan(konfirmasi.value)
  router.push({ name: 'aktivasi-data' })
}

function bukanSaya() {
  konfirmasi.value = null
}
</script>

<template>
  <section class="card p-6 sm:p-8">
    <div class="mb-6 flex items-start gap-4">
      <div
        class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary"
      >
        <i class="pi pi-id-card text-xl" aria-hidden="true" />
      </div>
      <div>
        <h1 class="text-headline-sm text-ink">Aktivasi Internet Banking</h1>
        <p class="mt-1 text-body-md text-muted">
          Cocokkan identitas Anda dengan data Bank Mini. Aktivasi cukup dilakukan sekali.
        </p>
      </div>
    </div>

    <!-- Konfirmasi "Apakah ini Anda?" -->
    <div v-if="konfirmasi" data-testid="konfirmasi-identitas">
      <div class="rounded-xl border border-primary-soft-strong bg-primary-soft p-5">
        <p class="eyebrow mb-2">Apakah ini Anda?</p>
        <p class="text-headline-sm text-ink" data-testid="nama-konfirmasi">{{ konfirmasi.nama }}</p>
        <p class="mt-1 text-body-md text-muted">
          {{ labelJenis[konfirmasi.jenis_nasabah] || 'Nasabah' }}
          <template v-if="konfirmasi.kelas"> · {{ konfirmasi.kelas }}</template>
        </p>
      </div>
      <div class="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button label="Bukan saya" severity="secondary" outlined @click="bukanSaya" />
        <Button
          label="Ya, lanjutkan"
          icon="pi pi-arrow-right"
          icon-pos="right"
          data-testid="lanjut-aktivasi"
          @click="lanjut"
        />
      </div>
    </div>

    <template v-else>
      <Message
        v-if="sudahAktivasi"
        severity="info"
        class="mb-5"
        :closable="false"
        data-testid="sudah-aktivasi"
      >
        <div>{{ sudahAktivasi }}</div>
        <RouterLink
          :to="{ name: 'masuk' }"
          class="mt-2 inline-flex items-center gap-1 font-semibold text-primary hover:underline"
        >
          Ke halaman masuk <i class="pi pi-arrow-right text-[11px]" aria-hidden="true" />
        </RouterLink>
      </Message>

      <Message
        v-if="galat"
        severity="error"
        class="mb-5"
        :closable="false"
        data-testid="galat-verifikasi"
      >
        <div>{{ galat }}</div>
        <div v-if="sisaPercobaan !== null" class="mt-0.5 text-body-sm font-normal">
          Sisa percobaan: <strong class="tnum">{{ sisaPercobaan }}</strong> kali.
        </div>
        <div v-if="tungguDetik > 0" class="mt-0.5 text-body-sm font-normal">
          Coba lagi dalam <strong class="tnum">{{ tungguDetik }}</strong> detik.
        </div>
      </Message>

      <form class="flex flex-col gap-5" novalidate @submit="cek">
        <FormField
          id="identitas"
          label="NISN / No. Nasabah"
          :error="errors.identitas"
          hint="Siswa: NISN. Guru/karyawan/lembaga: No. nasabah dari teller (mis. NSB-000123)."
        >
          <InputText
            id="identitas"
            v-model="identitas"
            v-bind="identitasAttrs"
            autocomplete="off"
            maxlength="50"
            :invalid="!!errors.identitas"
            fluid
          />
        </FormField>
        <FormField
          id="no_rekening"
          label="Nomor rekening"
          :error="errors.no_rekening"
          hint="Salah satu nomor rekening Anda di Bank Mini (lihat buku tabungan)."
        >
          <InputText
            id="no_rekening"
            v-model="noRekening"
            v-bind="noRekeningAttrs"
            inputmode="numeric"
            autocomplete="off"
            maxlength="50"
            :invalid="!!errors.no_rekening"
            fluid
          />
        </FormField>
        <Button
          type="submit"
          label="Periksa data"
          icon="pi pi-search"
          :loading="isSubmitting"
          :disabled="tungguDetik > 0"
          class="w-full"
        />
      </form>
    </template>
  </section>
</template>

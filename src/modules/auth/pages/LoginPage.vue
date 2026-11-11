<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Dialog from 'primevue/dialog'
import FormField from '@/core/ui/forms/FormField.vue'
import { useAuthStore } from '@/core/stores/auth'
import { tujuanSesuaiStatus } from '@/core/router/guard'
import { pesanBatas, PESAN } from '@/core/http/errors'
import { schemaLogin } from '../schema'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const { defineField, handleSubmit, errors, isSubmitting } = useForm({
  validationSchema: toTypedSchema(schemaLogin),
  initialValues: { nis: '', password: '' },
})
const [nis, nisAttrs] = defineField('nis')
const [password, passwordAttrs] = defineField('password')

const galat = ref('')
const sisaPercobaan = ref(null)
const tungguDetik = ref(0)
const lupaPassword = ref(false)
let timer = null

const infoAlasan = computed(
  () =>
    ({
      sesi: { severity: 'warn', teks: PESAN.sesiBerakhir },
      'tidak-aktif': {
        severity: 'info',
        teks: 'Anda otomatis keluar karena tidak ada aktivitas selama 10 menit.',
      },
      keluar: { severity: 'success', teks: 'Anda telah keluar. Sampai jumpa lagi!' },
    })[route.query.alasan],
)

function mulaiTunggu(detik) {
  tungguDetik.value = detik
  clearInterval(timer)
  timer = setInterval(() => {
    tungguDetik.value -= 1
    if (tungguDetik.value <= 0) {
      clearInterval(timer)
      galat.value = ''
    }
  }, 1000)
}
onBeforeUnmount(() => clearInterval(timer))

const masuk = handleSubmit(async (v) => {
  galat.value = ''
  sisaPercobaan.value = null
  try {
    await auth.login(v)
    await router.replace(tujuanSesuaiStatus(auth, route.query.redirect))
  } catch (e) {
    if (e.tipe === 'validasi' || e.tipe === 'auth') {
      // Pesan umum: tidak membedakan NIS tidak ditemukan dan password salah.
      galat.value = 'NIS atau password salah.'
      sisaPercobaan.value = e.data?.sisa_percobaan ?? null
    } else if (e.tipe === 'batas') {
      galat.value = pesanBatas(e.retryAfter)
      mulaiTunggu(e.retryAfter || 60)
    } else {
      galat.value = e.message
    }
  }
})
</script>

<template>
  <div class="card p-6 sm:p-8">
    <div class="mb-6">
      <p class="mb-1 text-label-sm uppercase text-primary">Internet Banking Nasabah</p>
      <h1 class="text-headline-md text-ink">Masuk ke akun Anda</h1>
      <p class="mt-1 text-body-md text-muted">
        Gunakan NIS / No. Rekening dan password dari petugas Bank Mini.
      </p>
    </div>

    <Message
      v-if="infoAlasan && !galat"
      :severity="infoAlasan.severity"
      class="mb-5"
      :closable="false"
    >
      {{ infoAlasan.teks }}
    </Message>

    <Message v-if="galat" severity="error" class="mb-5" :closable="false" data-testid="galat-login">
      <div>{{ galat }}</div>
      <div v-if="sisaPercobaan !== null" class="mt-0.5 text-body-sm font-normal">
        Sisa percobaan: <strong class="tnum">{{ sisaPercobaan }}</strong> kali sebelum akun dikunci
        sementara.
      </div>
      <div v-if="tungguDetik > 0" class="mt-0.5 text-body-sm font-normal">
        Coba lagi dalam <strong class="tnum">{{ tungguDetik }}</strong> detik.
      </div>
    </Message>

    <form class="flex flex-col gap-5" novalidate @submit="masuk">
      <FormField id="nis" label="NIS / No. Rekening" :error="errors.nis">
        <InputText
          id="nis"
          v-model="nis"
          v-bind="nisAttrs"
          inputmode="numeric"
          autocomplete="username"
          placeholder="Contoh: 25041"
          :invalid="!!errors.nis"
          :aria-describedby="errors.nis ? 'nis-error' : undefined"
          fluid
        />
      </FormField>

      <FormField id="password" label="Password" :error="errors.password">
        <Password
          v-model="password"
          v-bind="passwordAttrs"
          input-id="password"
          :feedback="false"
          toggle-mask
          autocomplete="current-password"
          :invalid="!!errors.password"
          fluid
        />
      </FormField>

      <div class="-mt-2 flex justify-end">
        <button
          type="button"
          class="text-label-md text-primary hover:underline"
          @click="lupaPassword = true"
        >
          Lupa password?
        </button>
      </div>

      <Button
        type="submit"
        label="Masuk"
        icon="pi pi-sign-in"
        icon-pos="right"
        :loading="isSubmitting"
        :disabled="tungguDetik > 0"
        class="w-full"
      />
    </form>

    <div
      class="mt-6 flex items-start gap-3 rounded-xl border-l-[3px] border-primary bg-primary-soft p-4"
    >
      <i class="pi pi-shield mt-0.5 text-primary" aria-hidden="true" />
      <p class="text-body-sm text-muted">
        Jangan berikan password Anda kepada siapa pun, termasuk petugas Bank Mini. Pastikan alamat
        situs diawali
        <strong class="text-ink">https://ib.</strong>
      </p>
    </div>

    <Dialog
      v-model:visible="lupaPassword"
      modal
      header="Lupa password?"
      :draggable="false"
      class="w-[min(28rem,calc(100vw-2rem))]"
    >
      <div class="flex gap-4">
        <div
          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary"
        >
          <i class="pi pi-building-columns text-xl" aria-hidden="true" />
        </div>
        <div class="text-body-md text-ink">
          <p class="mb-2">
            Untuk mereset password, silakan datang ke
            <strong>Ruang Bank Mini SMKN 2 Semarang</strong> pada jam sekolah dengan membawa kartu
            pelajar / identitas.
          </p>
          <p class="text-muted">
            Petugas akan memberikan password sementara yang wajib Anda ganti saat masuk berikutnya.
          </p>
        </div>
      </div>
      <template #footer>
        <Button label="Mengerti" @click="lupaPassword = false" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import FormField from '@/core/ui/forms/FormField.vue'
import { useAuthStore } from '@/core/stores/auth'
import { normalisasiHp, POLA_HP } from '@/core/utils/format'

const terlihat = defineModel('visible', { type: Boolean, default: false })
const emit = defineEmits(['berhasil'])

const auth = useAuthStore()

const schema = toTypedSchema(
  z
    .object({
      password: z
        .string({ required_error: 'Password saat ini wajib diisi' })
        .min(1, 'Password saat ini wajib diisi'),
      no_hp: z
        .string({ required_error: 'No. HP baru wajib diisi' })
        .trim()
        .min(1, 'No. HP baru wajib diisi')
        .refine(
          (v) => POLA_HP.test(normalisasiHp(v)),
          'No. HP harus diawali 08 (atau +62) dan terdiri dari 10–13 digit',
        ),
      no_hp_confirmation: z
        .string({ required_error: 'Ulangi No. HP baru' })
        .trim()
        .min(1, 'Ulangi No. HP baru'),
    })
    .superRefine((v, ctx) => {
      const tambah = (path, message) =>
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message })
      if (normalisasiHp(v.no_hp) === auth.user?.no_hp) {
        tambah('no_hp', 'No. HP baru sama dengan No. HP sekarang')
      }
      if (normalisasiHp(v.no_hp) !== normalisasiHp(v.no_hp_confirmation)) {
        tambah('no_hp_confirmation', 'Ulangi No. HP tidak sama')
      }
    }),
)

const { defineField, handleSubmit, errors, setErrors, resetForm, isSubmitting } = useForm({
  validationSchema: schema,
  initialValues: { password: '', no_hp: '', no_hp_confirmation: '' },
})
const [password] = defineField('password')
const [noHp] = defineField('no_hp')
const [noHpUlang] = defineField('no_hp_confirmation')

const pesanUmum = ref('')

const kirim = handleSubmit(async (v) => {
  pesanUmum.value = ''
  try {
    const hasil = await auth.gantiNoHp(v)
    resetForm()
    terlihat.value = false
    emit('berhasil', hasil)
  } catch (e) {
    if (e.tipe === 'validasi') {
      setErrors(e.fieldErrors)
      if (!Object.keys(e.fieldErrors).length) pesanUmum.value = e.message
    } else {
      pesanUmum.value = e.message
    }
  }
})

function tutup() {
  resetForm()
  pesanUmum.value = ''
}
</script>

<template>
  <Dialog
    v-model:visible="terlihat"
    modal
    header="Ganti No. HP"
    :draggable="false"
    class="w-[min(30rem,calc(100vw-2rem))]"
    @hide="tutup"
  >
    <form id="form-ganti-hp" class="flex flex-col gap-5" novalidate @submit="kirim">
      <p class="text-body-md text-muted">
        No. HP sekarang:
        <strong class="tnum text-ink">{{ auth.user?.no_hp || '-' }}</strong
        >. Setelah diganti, gunakan No. HP baru untuk masuk berikutnya.
      </p>
      <Message v-if="pesanUmum" severity="error" :closable="false">{{ pesanUmum }}</Message>
      <FormField id="hp_baru" label="No. HP baru" :error="errors.no_hp">
        <InputText
          id="hp_baru"
          v-model="noHp"
          type="tel"
          inputmode="tel"
          maxlength="20"
          autocomplete="tel"
          placeholder="08xxxxxxxxxx"
          :invalid="!!errors.no_hp"
          fluid
        />
      </FormField>
      <FormField id="hp_baru_ulang" label="Ulangi No. HP baru" :error="errors.no_hp_confirmation">
        <InputText
          id="hp_baru_ulang"
          v-model="noHpUlang"
          type="tel"
          inputmode="tel"
          maxlength="20"
          autocomplete="off"
          :invalid="!!errors.no_hp_confirmation"
          fluid
        />
      </FormField>
      <FormField id="hp_password" label="Password saat ini" :error="errors.password">
        <Password
          v-model="password"
          input-id="hp_password"
          :feedback="false"
          toggle-mask
          fluid
          autocomplete="current-password"
          :invalid="!!errors.password"
        />
      </FormField>
    </form>
    <template #footer>
      <Button label="Batal" severity="secondary" text @click="terlihat = false" />
      <Button
        type="submit"
        form="form-ganti-hp"
        label="Simpan No. HP"
        icon="pi pi-check"
        :loading="isSubmitting"
      />
    </template>
  </Dialog>
</template>

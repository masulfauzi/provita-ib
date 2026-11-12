<script setup>
/**
 * Form ganti password (halaman Profil).
 */
import { ref } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import FormField from './FormField.vue'
import AturanPassword from './AturanPassword.vue'
import { useAuthStore } from '@/core/stores/auth'
import { galatPassword } from '@/core/utils/password'

defineProps({
  labelKirim: { type: String, default: 'Simpan password baru' },
})
const emit = defineEmits(['berhasil'])

const auth = useAuthStore()
const konteks = (lama) => ({
  lama,
  terlarang: [auth.user?.nis, auth.user?.no_hp, ...(auth.user?.nomor_rekening || [])],
})

const schema = toTypedSchema(
  z
    .object({
      password_lama: z
        .string({ required_error: 'Password saat ini wajib diisi' })
        .min(1, 'Password saat ini wajib diisi'),
      password: z
        .string({ required_error: 'Password baru wajib diisi' })
        .min(1, 'Password baru wajib diisi'),
      password_confirmation: z
        .string({ required_error: 'Ulangi password baru' })
        .min(1, 'Ulangi password baru'),
    })
    .superRefine((v, ctx) => {
      const galat = v.password && galatPassword(v.password, konteks(v.password_lama))
      if (galat) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['password'], message: galat })
      }
      if (v.password_confirmation && v.password !== v.password_confirmation) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['password_confirmation'],
          message: 'Ulangi password tidak sama dengan password baru',
        })
      }
    }),
)

const { defineField, handleSubmit, errors, setErrors, resetForm, isSubmitting } = useForm({
  validationSchema: schema,
  initialValues: { password_lama: '', password: '', password_confirmation: '' },
})

const [lama, lamaAttrs] = defineField('password_lama')
const [baru, baruAttrs] = defineField('password')
const [ulang, ulangAttrs] = defineField('password_confirmation')

const pesanUmum = ref('')

const kirim = handleSubmit(async (nilai) => {
  pesanUmum.value = ''
  try {
    await auth.gantiPassword(nilai)
    resetForm()
    emit('berhasil')
  } catch (e) {
    if (e.tipe === 'validasi') {
      setErrors(e.fieldErrors)
      if (!Object.keys(e.fieldErrors).length) pesanUmum.value = e.message
    } else {
      pesanUmum.value = e.message
    }
  }
})

defineExpose({ resetForm })
</script>

<template>
  <form class="flex flex-col gap-5" novalidate @submit="kirim">
    <Message v-if="pesanUmum" severity="error" :closable="false">{{ pesanUmum }}</Message>

    <FormField id="password_lama" label="Password saat ini" :error="errors.password_lama">
      <Password
        v-model="lama"
        v-bind="lamaAttrs"
        input-id="password_lama"
        :feedback="false"
        toggle-mask
        fluid
        autocomplete="current-password"
        :invalid="!!errors.password_lama"
        :input-props="{
          'aria-describedby': errors.password_lama ? 'password_lama-error' : undefined,
        }"
      />
    </FormField>

    <FormField id="password" label="Password baru" :error="errors.password">
      <Password
        v-model="baru"
        v-bind="baruAttrs"
        input-id="password"
        :feedback="false"
        toggle-mask
        fluid
        autocomplete="new-password"
        :invalid="!!errors.password"
        :input-props="{ 'aria-describedby': 'aturan-password' }"
      />
    </FormField>

    <AturanPassword :password="baru || ''" :konteks="konteks(lama || '')" />

    <FormField
      id="password_confirmation"
      label="Ulangi password baru"
      :error="errors.password_confirmation"
    >
      <Password
        v-model="ulang"
        v-bind="ulangAttrs"
        input-id="password_confirmation"
        :feedback="false"
        toggle-mask
        fluid
        autocomplete="new-password"
        :invalid="!!errors.password_confirmation"
      />
    </FormField>

    <Button
      type="submit"
      :label="labelKirim"
      icon="pi pi-lock"
      :loading="isSubmitting"
      class="w-full sm:w-auto sm:self-start"
    />
  </form>
</template>

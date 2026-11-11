<script setup>
/**
 * Form ganti password (dipakai di onboarding langkah 1 dan halaman Profil).
 */
import { computed, ref } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import FormField from './FormField.vue'
import { useAuthStore } from '@/core/stores/auth'
import { aturanPassword, kekuatanPassword } from '@/core/utils/password'

defineProps({
  labelKirim: { type: String, default: 'Simpan password baru' },
})
const emit = defineEmits(['berhasil'])

const auth = useAuthStore()
const konteks = (lama) => ({
  lama,
  nis: auth.user?.nis,
  noRekening: auth.user?.nomor_rekening || [],
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
      const gagal = aturanPassword(v.password, konteks(v.password_lama)).find((a) => !a.ok)
      if (v.password && gagal) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['password'],
          message: `Password baru: ${gagal.label.toLowerCase()}`,
        })
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

const aturan = computed(() => aturanPassword(baru.value || '', konteks(lama.value || '')))
const kekuatan = computed(() => kekuatanPassword(baru.value || ''))
const warnaKekuatan = ['bg-danger', 'bg-danger', 'bg-amber-500', 'bg-success', 'bg-success-ink']

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

    <div class="rounded-field border border-outline bg-canvas p-4">
      <div class="mb-3 flex items-center justify-between gap-3">
        <span class="eyebrow">Kekuatan password</span>
        <span class="text-label-md text-ink" data-testid="kekuatan-label">{{
          kekuatan.label || '—'
        }}</span>
      </div>
      <div class="mb-4 grid grid-cols-4 gap-1.5" aria-hidden="true">
        <span
          v-for="i in 4"
          :key="i"
          class="h-1.5 rounded-full transition-colors"
          :class="
            baru && i <= Math.max(kekuatan.skor, 1) ? warnaKekuatan[kekuatan.skor] : 'bg-outline'
          "
        />
      </div>
      <ul id="aturan-password" class="grid gap-2" aria-label="Aturan password baru">
        <li
          v-for="a in aturan"
          :key="a.kode"
          class="flex items-center gap-2 text-body-md"
          :class="a.ok ? 'text-success-ink' : 'text-muted'"
          :data-testid="`aturan-${a.kode}`"
          :data-ok="a.ok"
        >
          <i :class="a.ok ? 'pi pi-check-circle' : 'pi pi-circle'" aria-hidden="true" />
          <span>{{ a.label }}</span>
          <span class="sr-only">{{ a.ok ? '(terpenuhi)' : '(belum terpenuhi)' }}</span>
        </li>
      </ul>
    </div>

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

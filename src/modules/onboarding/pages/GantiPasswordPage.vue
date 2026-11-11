<script setup>
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import PasswordForm from '@/core/ui/forms/PasswordForm.vue'
import { useAuthStore } from '@/core/stores/auth'
import { tujuanSesuaiStatus } from '@/core/router/guard'

const router = useRouter()
const toast = useToast()
const auth = useAuthStore()

function berhasil() {
  toast.add({ severity: 'success', summary: 'Password berhasil diganti', life: 4000 })
  router.replace(tujuanSesuaiStatus(auth))
}
</script>

<template>
  <section class="card p-6 sm:p-8">
    <div class="mb-6 flex items-start gap-4">
      <div
        class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary"
      >
        <i class="pi pi-key text-xl" aria-hidden="true" />
      </div>
      <div>
        <h1 class="text-headline-sm text-ink">Ganti password</h1>
        <p class="mt-1 text-body-md text-muted">
          Demi keamanan, ganti password awal Anda sebelum melanjutkan.
        </p>
      </div>
    </div>
    <PasswordForm label-kirim="Ganti password & lanjutkan" @berhasil="berhasil" />
  </section>
</template>

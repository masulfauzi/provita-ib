import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import { createPinia, setActivePinia } from 'pinia'
import { resetPlugin } from '@/core/stores/reset'

/** Pinia yang sudah terpasang ke app (plugin Pinia baru aktif setelah dipasang). */
export function buatPinia() {
  const pinia = createPinia()
  pinia.use(resetPlugin)
  createApp({}).use(pinia)
  setActivePinia(pinia)
  return pinia
}

/** Plugin global untuk test komponen. */
export function siapkanGlobal() {
  const pinia = buatPinia()
  return { pinia, plugins: [pinia, [PrimeVue, { theme: 'none' }], ToastService] }
}

/** Tunggu validasi & promise async (VeeValidate) selesai. */
export async function tunggu(kali = 6) {
  const { flushPromises } = await import('@vue/test-utils')
  for (let i = 0; i < kali; i++) {
    await flushPromises()
    await new Promise((r) => setTimeout(r, 0))
  }
}

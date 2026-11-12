import '@fontsource/plus-jakarta-sans/400.css'
import '@fontsource/plus-jakarta-sans/500.css'
import '@fontsource/plus-jakarta-sans/600.css'
import '@fontsource/plus-jakarta-sans/700.css'
import 'primeicons/primeicons.css'
import '@/core/theme/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import Tooltip from 'primevue/tooltip'

import App from './App.vue'
import { ProvitaPreset } from '@/core/theme/preset'
import { localeId } from '@/core/theme/locale-id'
import { createAppRouter } from '@/core/router'
import { configureHttp } from '@/core/http/client'
import { resetPlugin } from '@/core/stores/reset'
import { useAuthStore } from '@/core/stores/auth'
import { RUTE } from '@/core/router/guard'

async function siapkanMock() {
  if (import.meta.env.VITE_USE_MOCK !== 'true') return
  const { mulaiMock } = await import('./mocks/browser')
  await mulaiMock()
}

async function bootstrap() {
  await siapkanMock()

  const app = createApp(App)
  const pinia = createPinia()
  pinia.use(resetPlugin)
  const router = createAppRouter(pinia)

  configureHttp({
    onUnauthorized() {
      const auth = useAuthStore(pinia)
      auth.bersihkanSesi()
      const sekarang = router.currentRoute.value
      if (sekarang.name !== RUTE.masuk) {
        router.replace({ name: RUTE.masuk, query: { alasan: 'sesi', redirect: sekarang.fullPath } })
      }
    },
  })

  app.use(pinia)
  app.use(router)
  app.use(PrimeVue, {
    theme: {
      preset: ProvitaPreset,
      options: {
        darkModeSelector: false,
        cssLayer: { name: 'primevue', order: 'theme, base, primevue, components, utilities' },
      },
    },
    locale: localeId,
  })
  app.use(ToastService)
  app.directive('tooltip', Tooltip)

  app.mount('#app')
}

bootstrap()

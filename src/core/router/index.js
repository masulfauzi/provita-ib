import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/core/stores/auth'
import { resolveGuard } from './guard'

/** Setiap modul mendaftarkan route-nya sendiri lewat `modules/<nama>/routes.js`. */
const modul = import.meta.glob('../../modules/*/routes.js', { eager: true, import: 'default' })
const routesModul = Object.values(modul).flat()

const APP_NAME = import.meta.env.VITE_APP_NAME || 'Bank Provita'

export const routes = [
  { path: '/', redirect: { name: 'beranda' } },
  ...routesModul,
  {
    path: '/pemeliharaan',
    name: 'pemeliharaan',
    component: () => import('@/core/ui/pages/MaintenancePage.vue'),
    meta: { bebas: true, layout: 'polos', judul: 'Sedang dalam pemeliharaan' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'tidak-ditemukan',
    component: () => import('@/core/ui/pages/NotFoundPage.vue'),
    meta: { bebas: true, layout: 'polos', judul: 'Halaman tidak ditemukan' },
  },
]

export function createAppRouter(pinia) {
  const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
    scrollBehavior(to, from, saved) {
      if (saved) return saved
      if (to.path === from.path) return false
      return { top: 0 }
    },
  })

  router.beforeEach(async (to) => {
    const auth = useAuthStore(pinia)
    if (!auth.dimuat) {
      try {
        await auth.fetchMe()
      } catch {
        // API tidak bisa dihubungi / 5xx saat aplikasi dibuka
        if (to.meta?.bebas) return true
        return { name: 'pemeliharaan', query: { kembali: to.fullPath } }
      }
    }
    return resolveGuard(to, {
      masuk: auth.masuk,
      wajibGantiPassword: auth.wajibGantiPassword,
      profilLengkap: auth.profilLengkap,
    })
  })

  router.afterEach((to) => {
    // Judul tab tidak boleh memuat data sensitif (nama, nomor rekening, saldo).
    document.title = to.meta?.judul ? `${to.meta.judul} · ${APP_NAME}` : APP_NAME
  })

  return router
}

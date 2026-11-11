export default [
  {
    path: '/ganti-password',
    name: 'ganti-password',
    component: () => import('./pages/GantiPasswordPage.vue'),
    meta: { layout: 'onboarding', langkah: 1, judul: 'Ganti password' },
  },
  {
    path: '/lengkapi-data',
    name: 'lengkapi-data',
    component: () => import('./pages/LengkapiDataPage.vue'),
    meta: { layout: 'onboarding', langkah: 2, judul: 'Lengkapi data pribadi' },
  },
]

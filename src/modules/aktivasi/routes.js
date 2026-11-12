export default [
  {
    path: '/aktivasi',
    name: 'aktivasi',
    component: () => import('./pages/VerifikasiPage.vue'),
    meta: { publik: true, layout: 'aktivasi', langkah: 1, judul: 'Aktivasi akun' },
  },
  {
    path: '/aktivasi/data',
    name: 'aktivasi-data',
    component: () => import('./pages/DataAktivasiPage.vue'),
    meta: { publik: true, layout: 'aktivasi', langkah: 2, judul: 'Aktivasi akun' },
  },
]

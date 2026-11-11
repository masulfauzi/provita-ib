export default [
  {
    path: '/mutasi',
    name: 'mutasi',
    component: () => import('./pages/MutasiPage.vue'),
    meta: { layout: 'app', judul: 'Mutasi rekening' },
  },
  {
    path: '/rekening/:id(\\d+)/mutasi',
    name: 'mutasi-rekening',
    component: () => import('./pages/MutasiPage.vue'),
    meta: { layout: 'app', judul: 'Mutasi rekening' },
  },
]

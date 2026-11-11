export default [
  {
    path: '/masuk',
    name: 'masuk',
    component: () => import('./pages/LoginPage.vue'),
    meta: { publik: true, layout: 'tamu', judul: 'Masuk' },
  },
]

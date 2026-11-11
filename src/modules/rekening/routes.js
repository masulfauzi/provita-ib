export default [
  {
    path: '/beranda',
    name: 'beranda',
    component: () => import('./pages/BerandaPage.vue'),
    meta: { layout: 'app', judul: 'Beranda' },
  },
  {
    path: '/rekening/:id(\\d+)',
    name: 'rekening-detail',
    component: () => import('./pages/RekeningDetailPage.vue'),
    meta: { layout: 'app', judul: 'Detail rekening' },
  },
]

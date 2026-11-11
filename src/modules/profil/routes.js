export default [
  {
    path: '/profil',
    name: 'profil',
    component: () => import('./pages/ProfilPage.vue'),
    meta: { layout: 'app', judul: 'Profil & keamanan' },
  },
]

# Bank Provita — Internet Banking Nasabah

Aplikasi web (Vue 3) untuk nasabah Bank Mini SMKN 2 Semarang: melihat **saldo** dan **mutasi** rekening dari browser di `ib.<domain>`.
Proyek ini **hanya frontend**. Data diambil dari API Laravel Bank Provita (`api.<domain>`) dengan Laravel Sanctum mode SPA (cookie).

Alur wajib nasabah:

```
Login ──► Ganti password ──► Lengkapi data pribadi ──► Beranda (saldo) ──► Mutasi
          (wajib, sekali)    (wajib, sekali)
```

Tahap ini hanya untuk melihat data. Belum ada transfer atau pembayaran.

## Tech stack

Vue 3 (`<script setup>`) + Vite · Vue Router · Pinia · PrimeVue 4 (Aura, preset Bank Provita) + Tailwind CSS 4 · VeeValidate + Zod · Axios · VueUse · MSW (mock API) · Vitest + Vue Test Utils · Playwright · ESLint + Oxlint + Prettier.

> PrimeVue dikunci di **v4 (lisensi MIT)**. PrimeVue v5 memakai lisensi PrimeUI yang membutuhkan license key.

Tampilan mengikuti design system di [`template/`](template/) ("Modern Financial Trust": sidebar, kartu putih hairline, Plus Jakarta Sans, angka tabular). Warnanya diganti ke palet Bank Provita: Deep Teal `#0F766E` / `#115E59`, aksen Emerald `#10B981`, radius 12 px.

## Setup

Butuh Node.js 22 LTS (lihat `.nvmrc`).

```bash
nvm use
npm install
npx playwright install chromium   # sekali saja, untuk test end-to-end
npm run dev                        # http://localhost:5173 (Mock API aktif)
```

| Perintah | Kegunaan |
| --- | --- |
| `npm run dev` | Dev server (mode `development`, Mock API aktif) |
| `npm run build` | Build produksi ke `dist/` (mode `production`, API sungguhan) |
| `npm run preview` | Menyajikan `dist/` di port 4173 |
| `npm run lint` | Oxlint + ESLint (`eslint-plugin-vue` recommended) |
| `npm run format` | Prettier |
| `npm run test:unit` | Vitest (watch); `test:unit:ci` untuk sekali jalan |
| `npm run test:e2e` | Playwright (desktop + HP 360 px) terhadap Mock API |

## Akun mock

Dipakai saat `VITE_USE_MOCK=true`. Setiap akun punya 3 rekening (Tabungan Reguler, Tabungan Berjangka, Deposito) dan sekitar 200 mutasi contoh yang dibuat relatif terhadap tanggal hari ini.

| NIS | Password | Kondisi |
| --- | --- | --- |
| `25039` | `rahasia123` | Nasabah baru: wajib ganti password |
| `25040` | `Provita2026` | Sudah ganti password, data pribadi belum lengkap |
| `25041` | `Provita2026` | Sudah lengkap, langsung ke beranda |

Untuk menguji tampilan error, loading, atau kosong, tambahkan `?mock=error`, `?mock=lambat`, atau `?mock=kosong` ke URL. Pilihan ini tersimpan selama sesi; `?mock=normal` mengembalikannya. Status mock (misalnya password yang sudah diganti) disimpan di `sessionStorage` dan direset saat logout.

## Berpindah dari mock ke API

Atur environment (`.env.development`, `.env.production`, atau `.env.local`):

```dotenv
VITE_API_URL=https://api.example.sch.id   # alamat API Laravel
VITE_USE_MOCK=false                       # true = MSW, false = API sungguhan
VITE_APP_NAME="Bank Provita"
```

Kode halaman tidak perlu diubah. Bila `VITE_USE_MOCK=false`, MSW tidak dimuat dan `mockServiceWorker.js` dibuang dari `dist/`.

Syarat di sisi Laravel agar autentikasi cookie Sanctum berjalan:

- `ib.<domain>` dan `api.<domain>` berada di domain induk yang sama.
- `SANCTUM_STATEFUL_DOMAINS=ib.<domain>` dan `SESSION_DOMAIN=.<domain>`.
- CORS: `supports_credentials = true` dengan `allowed_origins = ['https://ib.<domain>']`.
- Guard `nasabah` terpisah dari guard petugas.

Kontrak endpoint ada di bagian "Lampiran — Kontrak API" pada [issue.md](issue.md). Mock di `src/mocks/handlers.js` mengikuti kontrak itu dan bisa dipakai sebagai acuan bentuk respons. Ringkasannya:

- `GET /nasabah/me` → `{ data: { id, nis, nama, nama_panggilan, kelas, jenis_nasabah, nomor_rekening[], wajib_ganti_password, profil_lengkap } }`
- `POST /nasabah/login`: bila gagal mengembalikan `422` `{ message, errors, sisa_percobaan }`; bila kena rate limit `429` dengan header `Retry-After`.
- `GET /nasabah/rekening/{id}/mutasi` → `{ data[], meta: { current_page, per_page, total, last_page }, ringkasan: { saldo_awal, total_masuk, total_keluar, saldo_akhir } }`
- Selama onboarding belum selesai, API mengembalikan `403` dengan `{ "kode": "WAJIB_GANTI_PASSWORD" | "WAJIB_LENGKAPI_DATA" }`. Frontend lalu mengarahkan nasabah ke langkah yang sesuai.
- Nominal dikirim sebagai string desimal (`"1250000.00"`). Frontend menghitung dalam satuan sen (integer).

## Struktur modul

```
src/
├── main.js / App.vue        # bootstrap, pilih layout dari route.meta.layout
├── core/                    # semua yang dipakai bersama
│   ├── http/                # axios (withCredentials, XSRF), interceptor error → pesan Indonesia
│   ├── router/              # router + guard alur wajib (guard.js = fungsi murni, diuji)
│   ├── stores/              # auth store, plugin reset Pinia (logout)
│   ├── composables/         # useAutoLogout (10 menit), useKeluar
│   ├── ui/                  # layout, MoneyText, DateText, EmptyState, ErrorState, PasswordForm, …
│   ├── utils/               # rupiah(), tanggal(), samarkanRekening(), terbilang(), aturan password
│   └── theme/               # token Tailwind, preset PrimeVue, locale Indonesia
├── modules/
│   ├── auth/                # /masuk
│   ├── onboarding/          # /ganti-password, /lengkapi-data
│   ├── rekening/            # /beranda, /rekening/:id
│   ├── mutasi/              # /mutasi, /rekening/:id/mutasi
│   └── profil/              # /profil
│       └── (tiap modul) pages/ components/ api.js store.js routes.js
└── mocks/                   # handler MSW + data contoh
```

Aturan modul:

- Modul **tidak** meng-import isi modul lain. Kode yang dipakai lebih dari satu modul ditaruh di `core/`. Contohnya `PasswordForm` (onboarding & profil) dan `TransaksiItem` (beranda & mutasi).
- Setiap modul mendaftarkan route-nya sendiri lewat `routes.js`. File ini dikumpulkan otomatis oleh `core/router/index.js` (`import.meta.glob`).
- `route.meta` yang dikenali: `layout` (`app` | `tamu` | `onboarding` | `polos`), `judul` (judul tab), `publik` (halaman tamu), `bebas` (selalu boleh dibuka), dan `langkah` (stepper onboarding).

### Menambah modul baru

1. Buat `src/modules/<nama>/` berisi `pages/`, `components/`, `api.js`, `store.js`, dan `routes.js`.
2. Di `routes.js`, ekspor array route default dengan `meta: { layout: 'app', judul: '…' }`. Route langsung terdaftar tanpa perlu mengubah router.
3. Panggil API lewat `http` dari `@/core/http/client`. Error sudah dinormalisasi menjadi `ApiError` (`tipe`, `message`, `fieldErrors`).
4. Bila perlu menu, tambahkan item navigasi di `src/core/ui/layouts/AppLayout.vue`.
5. Tambahkan handler mock di `src/mocks/handlers.js`, lalu test di `src/modules/<nama>/__tests__/`.

## Keamanan

- Sesi hanya memakai cookie HttpOnly Sanctum. Password, token, dan data rekening tidak disimpan di `localStorage`; satu-satunya isi `localStorage` adalah preferensi tampilan "sembunyikan saldo".
- Status login dan onboarding diambil dari `GET /nasabah/me` setiap kali aplikasi dibuka.
- Guard di frontend hanya untuk kenyamanan. Pembatasan yang sebenarnya **wajib** ditegakkan API.
- Auto-logout terjadi setelah 10 menit tanpa aktivitas, dengan peringatan hitung mundur 60 detik sebelumnya.
- Logout menghapus semua state Pinia dan `sessionStorage`, termasuk draf form.
- Build produksi membuang `console.*` dan `debugger`. Judul tab tidak memuat nama, nomor rekening, atau saldo.
- Parameter redirect setelah login hanya menerima path internal, sehingga tidak bisa dipakai untuk open redirect.

## Deploy

1. Isi `.env.production` (`VITE_API_URL`, `VITE_USE_MOCK=false`), lalu jalankan `npm ci && npm run build`.
2. Salin `dist/` ke server, misalnya ke `/var/www/bank-provita-ib/dist`.
3. Pakai konfigurasi Nginx di [`deploy/nginx.conf`](deploy/nginx.conf). Isinya: HTTPS, fallback SPA (`try_files $uri /index.html`), dan header keamanan (CSP, `X-Frame-Options: DENY`, `Referrer-Policy`, HSTS). Ganti `example.sch.id` dengan domain sekolah dan sesuaikan `connect-src` dengan alamat API.
4. Pasang sertifikat dengan `certbot --nginx -d ib.<domain>`.

## CI

GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) berjalan setiap push ke `main` dan setiap PR, dengan urutan: `npm ci` → `npm run lint` → `npm run test:unit:ci` → `npm run build` → Playwright. Playwright di CI berjalan pada build mode `e2e` (mock aktif) yang disajikan `vite preview`.

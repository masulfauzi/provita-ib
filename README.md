# Bank Provita — Internet Banking Nasabah

Aplikasi web (Vue 3) untuk nasabah Bank Mini SMKN 2 Semarang: melihat **saldo** dan **mutasi** rekening dari browser di `ib.<domain>`.
Proyek ini **hanya frontend**. Data diambil dari API Laravel Bank Provita (`api.<domain>`) dengan Laravel Sanctum mode SPA (cookie).

Alur nasabah:

```
Aktivasi 1 ──► Aktivasi 2 ─────────────────────────► Login ──► Beranda (saldo) ──► Mutasi
(NISN / No. nasabah  (data pribadi, No. HP,           (No. HP +
 + nomor rekening)    password; sekali)                password)
```

- Akun tidak dibuat teller. Nasabah mengaktivasi sendiri di `/aktivasi`, lalu masuk dengan **No. HP** yang didaftarkan (bukan NIS).
- Aktivasi tidak otomatis login. Setelah berhasil, halaman masuk terbuka dengan No. HP sudah terisi.
- Lupa password atau ganti nomor (tanpa akses akun): teller menekan **Reset akun IB**, lalu nasabah aktivasi ulang. No. HP dan password bisa diganti sendiri di menu **Profil**.

Tahap ini hanya untuk melihat data. Belum ada transfer atau pembayaran.

## Tech stack

Vue 3 (`<script setup>`) + Vite · Vue Router · Pinia · PrimeVue 4 (Aura, preset Bank Provita) + Tailwind CSS 4 · VeeValidate + Zod · Axios · VueUse · MSW (mock API) · Vitest + Vue Test Utils · Playwright · ESLint + Oxlint + Prettier.

> PrimeVue dikunci di **v4 (lisensi MIT)**. PrimeVue v5 memakai lisensi PrimeUI yang membutuhkan license key.

Tampilan mengikuti design system di [`template/`](template/) ("Modern Financial Trust": sidebar, kartu putih hairline, Plus Jakarta Sans, angka tabular). Warnanya diganti ke palet Bank Provita: Biru Laut `#0369A1` / Laut Dalam `#082F49`, aksen Biru Langit `#38BDF8`, radius 12 px.

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
| `npm run dev:api` | Dev server memakai API Laravel sungguhan lewat proxy (mode `api`) |
| `npm run build` | Build produksi ke `dist/` (mode `production`, API sungguhan) |
| `npm run preview` | Menyajikan `dist/` di port 4173 |
| `npm run lint` | Oxlint + ESLint (`eslint-plugin-vue` recommended) |
| `npm run format` | Prettier |
| `npm run test:unit` | Vitest (watch); `test:unit:ci` untuk sekali jalan |
| `npm run test:e2e` | Playwright (desktop + HP 360 px) terhadap Mock API |

## Akun mock

Dipakai saat `VITE_USE_MOCK=true`. Setiap nasabah punya 3 rekening (Tabungan Reguler, Tabungan Berjangka, Deposito) dan sekitar 200 mutasi contoh yang dibuat relatif terhadap tanggal hari ini.

| Nasabah | Login (No. HP / password) | Aktivasi (identitas + rekening) |
| --- | --- | --- |
| Andi Pratama (siswa) | belum aktivasi | NISN `0090025039` + rekening `1100125039` |
| Dewi Kartika (guru) | belum aktivasi | No. nasabah `NSB-000004` (atau `4`) + rekening `1100419004` |
| Siti Nurhaliza (siswa) | `081234567891` / `Provita2026` | sudah aktivasi (409) |
| Rizky Ramadhan (siswa) | `081234567890` / `Provita2026` | sudah aktivasi (409) |

Untuk menguji tampilan error, loading, atau kosong, tambahkan `?mock=error`, `?mock=lambat`, atau `?mock=kosong` ke URL. Pilihan ini tersimpan selama sesi; `?mock=normal` mengembalikannya. Status mock (akun hasil aktivasi, password atau No. HP yang diganti) disimpan di `sessionStorage` dan direset saat logout.

## Memakai API Laravel (provita-web)

Dokumentasi API (OpenAPI/Swagger) tersedia di `http://127.0.0.1:8000/docs/api` saat `provita-web` berjalan.

### Development lokal

```bash
# di provita-web
php artisan migrate                 # termasuk migration IbNasabah (akun_nasabah, login_nasabah)
php artisan serve                   # http://127.0.0.1:8000

# di provita-ib
npm run dev:api                     # http://localhost:5173
```

`npm run dev:api` memakai `.env.api`. Dev server Vite meneruskan `/api/*` dan `/sanctum/*` ke `VITE_PROXY_TARGET` (default `http://127.0.0.1:8000`). Akibatnya browser hanya melihat satu origin (`localhost:5173`): CORS tidak diperlukan, dan cookie sesi `provita_ib_session` serta `XSRF-TOKEN` tetap first-party.

`.env` di provita-web harus memuat:

```dotenv
SANCTUM_STATEFUL_DOMAINS=localhost:5173,localhost:8000,127.0.0.1:8000,localhost,127.0.0.1
IB_URL=http://localhost:5173
```

Akun IB dibuat nasabah sendiri lewat aktivasi (NISN untuk siswa, No. nasabah untuk guru/karyawan/lembaga, ditambah salah satu nomor rekening). Dengan `APP_ENV=local`, `IbNasabahSeeder` membuat nasabah contoh: NIS 25039 belum aktivasi (NISN `0090025039` + rekening `25039`), serta akun aktif `081234567891` dan `081234567890` (password `Provita2026`). Seeder melewati NIS yang sudah dipakai nasabah lain. Untuk mengulang aktivasi, pakai tombol **Reset akun IB** di halaman detail nasabah pada panel.

### Variabel environment

```dotenv
VITE_API_URL=https://api.example.sch.id   # origin API; kosong = same-origin (proxy dev)
VITE_API_PREFIX=/api/v1                   # prefix endpoint nasabah
VITE_USE_MOCK=false                       # true = MSW, false = API sungguhan
VITE_PROXY_TARGET=http://127.0.0.1:8000   # hanya untuk npm run dev:api
```

Endpoint nasabah dipanggil di `${VITE_API_URL}${VITE_API_PREFIX}/nasabah/...`, sedangkan CSRF cookie diambil dari `${VITE_API_URL}/sanctum/csrf-cookie` (tanpa prefix). Kode halaman tidak perlu diubah saat berpindah dari mock ke API. Bila `VITE_USE_MOCK=false`, MSW tidak dimuat dan `mockServiceWorker.js` dibuang dari `dist/`.

### Produksi

- `ib.<domain>` dan `api.<domain>` berada di domain induk yang sama.
- Di Laravel: `SANCTUM_STATEFUL_DOMAINS=ib.<domain>`, `IB_URL=https://ib.<domain>`, `IB_SESSION_DOMAIN=.<domain>`.
- Bila origin tidak terdaftar sebagai stateful, API menjawab `419` saat aktivasi dan login. Frontend menampilkan "Tidak dapat membuat sesi…" (bukan "No. HP atau password salah").
- Aktivasi langkah 2 harus dikirim dalam sesi (cookie) yang sama dengan langkah 1, maksimal 15 menit. Bila kedaluwarsa, API menjawab `403 VERIFIKASI_DIPERLUKAN` dan frontend kembali ke langkah 1.

Bentuk respons API sama dengan mock di `src/mocks/handlers.js`. ID rekening berupa UUID. Field `suku_bunga`, `jatuh_tempo`, `jangka_bulan`, `setoran_rutin`, `kelas`, dan `loket` boleh `null`; frontend menyembunyikan baris yang kosong.

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
│   ├── auth/                # /masuk (No. HP + password)
│   ├── aktivasi/            # /aktivasi (verifikasi), /aktivasi/data (data pribadi, No. HP, password)
│   ├── rekening/            # /beranda, /rekening/:id
│   ├── mutasi/              # /mutasi, /rekening/:id/mutasi
│   └── profil/              # /profil (ganti No. HP, ganti password)
│       └── (tiap modul) pages/ components/ api.js store.js routes.js
└── mocks/                   # handler MSW + data contoh
```

Aturan modul:

- Modul **tidak** meng-import isi modul lain. Kode yang dipakai lebih dari satu modul ditaruh di `core/`. Contohnya `AturanPassword` (aktivasi & profil) dan `TransaksiItem` (beranda & mutasi).
- Setiap modul mendaftarkan route-nya sendiri lewat `routes.js`. File ini dikumpulkan otomatis oleh `core/router/index.js` (`import.meta.glob`).
- `route.meta` yang dikenali: `layout` (`app` | `tamu` | `aktivasi` | `polos`), `judul` (judul tab), `publik` (halaman tamu; yang sudah login dialihkan ke beranda), `bebas` (selalu boleh dibuka), dan `langkah` (stepper aktivasi).

### Menambah modul baru

1. Buat `src/modules/<nama>/` berisi `pages/`, `components/`, `api.js`, `store.js`, dan `routes.js`.
2. Di `routes.js`, ekspor array route default dengan `meta: { layout: 'app', judul: '…' }`. Route langsung terdaftar tanpa perlu mengubah router.
3. Panggil API lewat `http` dari `@/core/http/client`. Error sudah dinormalisasi menjadi `ApiError` (`tipe`, `message`, `fieldErrors`).
4. Bila perlu menu, tambahkan item navigasi di `src/core/ui/layouts/AppLayout.vue`.
5. Tambahkan handler mock di `src/mocks/handlers.js`, lalu test di `src/modules/<nama>/__tests__/`.

## Keamanan

- Sesi hanya memakai cookie HttpOnly Sanctum. Password, token, dan data rekening tidak disimpan di `localStorage`; satu-satunya isi `localStorage` adalah preferensi tampilan "sembunyikan saldo".
- Status login diambil dari `GET /nasabah/me` setiap kali aplikasi dibuka.
- Draf form aktivasi disimpan di `sessionStorage` tanpa password, dan dihapus setelah aktivasi berhasil.
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

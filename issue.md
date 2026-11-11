# Issue — Proyek BARU: Internet Banking Nasabah Bank Provita (Vue.js)

Untuk repo baru (usulan nama: `bank-provita-ib`). Buat issue berurutan (1 → 8) agar nomornya #1–#8 sesuai rujukan di dalam teks.

Proyek ini **hanya frontend**. Data diambil dari API Laravel Bank Provita (`api.<domain>`). Kebutuhan API dicantumkan di **Lampiran — Kontrak API** sebagai acuan; pekerjaannya dicatat sebagai issue terpisah di repo Laravel.

---

## Issue 1 — [Epic] Internet Banking Nasabah Bank Provita (Vue.js)

### Tujuan

Nasabah Bank Mini SMKN 2 Semarang bisa melihat saldo dan mutasi rekeningnya dari browser, di mana saja, lewat alamat `ib.<domain>`. Aplikasi ini terpisah sepenuhnya dari panel teller.

### Alur wajib nasabah

```
Login ──► Ganti password ──► Lengkapi data pribadi ──► Beranda (saldo) ──► Mutasi
          (wajib, sekali)    (wajib, sekali)
```

1. **Login** dengan NIS / No. Rekening + password awal yang diberikan petugas Bank Mini.
2. **Ganti password**: wajib pada login pertama, atau bila password direset petugas. Selama belum diganti, nasabah tidak bisa membuka halaman lain.
3. **Lengkapi data pribadi**: wajib sekali setelah ganti password. Selama belum lengkap, nasabah tidak bisa membuka halaman lain.
4. **Beranda**: daftar semua rekening milik nasabah (Tabungan Reguler, Tabungan Berjangka, Deposito) beserta saldonya.
5. **Mutasi**: riwayat transaksi per rekening.

Tahap ini **hanya melihat**: tidak ada transfer atau pembayaran.

### Tech stack

| Bagian | Pilihan |
| --- | --- |
| Framework | Vue 3 (`<script setup>`, Composition API) + Vite |
| Bahasa | JavaScript (TypeScript opsional, putuskan di #2) |
| Routing | Vue Router |
| State | Pinia |
| UI | PrimeVue + Tailwind CSS (sama dengan panel Laravel) |
| Form & validasi | VeeValidate + Zod |
| HTTP | Axios |
| Utilitas | VueUse |
| Mock API | MSW (Mock Service Worker) |
| Test | Vitest + Vue Test Utils, Playwright (end-to-end) |
| Kualitas kode | ESLint + Prettier |

### Struktur modular

```
src/
├── main.js
├── App.vue
├── core/
│   ├── http/          # axios, CSRF Sanctum, penanganan error
│   ├── router/        # router + guard alur wajib
│   ├── stores/        # auth store (user, status onboarding)
│   ├── ui/            # komponen bersama: AppLayout, MoneyText, DateText, EmptyState, …
│   ├── utils/         # rupiah(), tanggal(), terbilang()
│   └── theme/         # token warna & font Bank Provita
├── modules/
│   ├── auth/          # login, logout
│   ├── onboarding/    # ganti password, lengkapi data pribadi
│   ├── rekening/      # beranda saldo, detail rekening
│   ├── mutasi/        # riwayat transaksi
│   └── profil/        # lihat profil, ganti password lagi
│       └── (tiap modul) pages/ components/ api.js store.js routes.js
└── mocks/             # handler MSW + data contoh
```

Aturan: modul tidak saling import isi modul lain; yang dipakai bersama ditaruh di `core/`. Setiap modul mendaftarkan route-nya sendiri lewat `routes.js`.

### Sub-issue

- [ ] #2 Inisialisasi proyek, tema, dan layout
- [ ] #3 Core: HTTP client, autentikasi Sanctum, router guard, dan mock API
- [ ] #4 Login dan ganti password wajib
- [ ] #5 Lengkapi data pribadi
- [ ] #6 Beranda: daftar rekening dan saldo
- [ ] #7 Mutasi rekening
- [ ] #8 Keamanan, kualitas, CI, dan deploy

### Definition of done

- Alur login → ganti password → lengkapi data → beranda → mutasi berjalan penuh dengan mock API, dan juga dengan API Laravel bila sudah tersedia.
- Nasabah yang belum ganti password atau belum melengkapi data tidak bisa membuka beranda/mutasi, baik lewat menu maupun dengan mengetik URL langsung.
- Tampilan rapi di HP (lebar 360 px) dan desktop.
- README berisi setup, struktur modul, dan cara berpindah dari mock ke API.

---

## Issue 2 — Inisialisasi proyek, tema, dan layout

Bagian dari #1.

### Tugas

- [ ] `npm create vue@latest bank-provita-ib` dengan Vue Router, Pinia, Vitest, Playwright, ESLint, Prettier. Putuskan TypeScript ya/tidak, lalu konsisten.
- [ ] Node LTS dicatat di `.nvmrc`.
- [ ] Pasang `primevue`, `@primevue/themes`, `primeicons`, `tailwindcss` + `@tailwindcss/vite`, `axios`, `vee-validate`, `@vee-validate/zod`, `zod`, `@vueuse/core`, `msw`.
- [ ] Konfigurasi environment `.env.development` / `.env.production`: `VITE_API_URL`, `VITE_USE_MOCK` (`true`/`false`), `VITE_APP_NAME`.
- [ ] Tema Bank Provita, sama dengan aplikasi mobile: warna utama Deep Teal `#0F766E` / `#115E59`, aksen Emerald `#10B981`, font **Plus Jakarta Sans** (di-bundle, bukan dari CDN), radius 12 px. Preset PrimeVue (Aura) disesuaikan dengan token ini.
- [ ] Locale PrimeVue bahasa Indonesia (nama hari/bulan, teks tombol).
- [ ] Layout:
    - `GuestLayout`: halaman login (logo, nama Bank Mini, kartu login di tengah).
    - `OnboardingLayout`: ganti password & lengkapi data, dengan indikator langkah (1. Ganti Password → 2. Data Pribadi) dan tombol Keluar.
    - `AppLayout`: header (logo, nama nasabah, menu profil), navigasi Beranda / Mutasi / Profil, dan bottom navigation di layar HP.
- [ ] Komponen dasar di `core/ui`: `MoneyText` (format `Rp 1.250.000`, angka tabular), `DateText`, `PageHeader`, `EmptyState`, `ErrorState` (tombol Coba lagi), `LoadingSkeleton`.
- [ ] Helper `core/utils/format.js`: `rupiah()`, `tanggal()` ("Hari ini", "Kemarin", "12 Okt 2026"), `samarkanRekening()` (`25039` → `•••039`).
- [ ] Halaman 404 dan halaman "Sedang dalam pemeliharaan".

### Kriteria selesai

- `npm run dev` menampilkan halaman login dengan tema Bank Provita.
- `npm run build` berhasil tanpa peringatan.

---

## Issue 3 — Core: HTTP client, autentikasi Sanctum, router guard, dan mock API

Bagian dari #1.

### Autentikasi

Memakai **Laravel Sanctum mode SPA (cookie)**, bukan token di `localStorage`, karena token di `localStorage` bisa dicuri lewat celah XSS. `ib.<domain>` dan `api.<domain>` berada di domain induk yang sama.

### Tugas

- [ ] `core/http/client.js`: instance axios dengan `baseURL = VITE_API_URL`, `withCredentials: true`, `withXSRFToken: true`, header `Accept: application/json`.
- [ ] Sebelum login, panggil `GET /sanctum/csrf-cookie`.
- [ ] Interceptor error → pesan berbahasa Indonesia:
    - `401` → hapus state, arahkan ke login ("Sesi Anda berakhir, silakan masuk kembali").
    - `403` dengan kode `WAJIB_GANTI_PASSWORD` / `WAJIB_LENGKAPI_DATA` → arahkan ke langkah onboarding yang sesuai.
    - `419` → ambil ulang CSRF cookie lalu ulangi permintaan sekali.
    - `422` → kembalikan error per field untuk form.
    - `429` → "Terlalu banyak percobaan, coba lagi dalam X menit".
    - `5xx` / jaringan → `ErrorState`.
- [ ] `core/stores/auth.js` (Pinia): `user`, `wajibGantiPassword`, `profilLengkap`, `fetchMe()`, `login()`, `logout()`.
- [ ] **Router guard** (berurutan):
    1. Route publik (`/masuk`) → bila sudah login, alihkan ke tujuan sesuai status.
    2. Belum login → `/masuk?redirect=…`.
    3. `wajibGantiPassword` → hanya boleh `/ganti-password` (dan Keluar).
    4. `!profilLengkap` → hanya boleh `/lengkapi-data` (dan Keluar).
    5. Selain itu → boleh semua halaman; `/ganti-password` & `/lengkapi-data` dialihkan ke beranda.
- [ ] Status diambil dari `GET /nasabah/me` setiap aplikasi dibuka (bukan disimpan di `localStorage`).
- [ ] Catatan: guard di frontend hanya untuk kenyamanan. Pembatasan sebenarnya **wajib** ada di API (lihat Lampiran).
- [ ] **Mock API (MSW)** aktif bila `VITE_USE_MOCK=true`: semua endpoint di Lampiran, dengan data contoh nasabah yang punya 3 rekening (Reguler, Berjangka, Deposito) dan ±200 mutasi. Akun contoh:
    - `25039` / `rahasia123` → nasabah baru (wajib ganti password).
    - `25040` / `Provita2026` → sudah ganti password, data belum lengkap.
    - `25041` / `Provita2026` → sudah lengkap.
- [ ] Skenario mock bisa dipicu lewat query `?mock=error|lambat|kosong` untuk menguji tampilan error, loading, dan kosong.

### Kriteria selesai

- Unit test guard untuk kelima kondisi di atas.
- Mengubah `VITE_USE_MOCK=false` membuat aplikasi memanggil API sungguhan tanpa mengubah kode halaman.

---

## Issue 4 — Login dan ganti password wajib

Bagian dari #1. Bergantung pada #3.

### Halaman `/masuk` (modul `auth`)

- [ ] Field **NIS / No. Rekening** dan **Password** (tombol tampilkan/sembunyikan).
- [ ] Validasi: keduanya wajib; NIS hanya angka.
- [ ] Pesan gagal umum: "NIS atau password salah". Jangan bedakan "NIS tidak ditemukan" dan "password salah".
- [ ] Tampilkan sisa percobaan / waktu tunggu bila API mengembalikan `429`.
- [ ] Tautan "Lupa password?" → info: datang ke Ruang Bank Mini untuk reset password (reset mandiri lewat email/WA dikerjakan nanti).
- [ ] Setelah login, arahkan sesuai status (guard #3).

### Halaman `/ganti-password` (modul `onboarding`, langkah 1)

- [ ] Penjelasan singkat: "Demi keamanan, ganti password awal Anda sebelum melanjutkan."
- [ ] Field: Password saat ini, Password baru, Ulangi password baru.
- [ ] Aturan password baru, ditampilkan sebagai checklist yang tercentang saat terpenuhi:
    - minimal 8 karakter;
    - mengandung huruf dan angka;
    - tidak sama dengan password lama;
    - tidak sama dengan NIS / nomor rekening.
- [ ] Indikator kekuatan password.
- [ ] Setelah berhasil: toast "Password berhasil diganti", status `wajibGantiPassword = false`, lanjut ke `/lengkapi-data` (atau beranda bila data sudah lengkap).
- [ ] Tombol **Keluar** tetap tersedia.

### Kriteria selesai

- Test komponen: validasi tiap aturan password, dan pengalihan setelah sukses.
- Test end-to-end (Playwright, mock): akun `25039` login → dipaksa ke ganti password → tidak bisa membuka `/beranda` lewat URL.

---

## Issue 5 — Lengkapi data pribadi

Bagian dari #1. Bergantung pada #3 dan #4.

### Halaman `/lengkapi-data` (modul `onboarding`, langkah 2)

Form dibagi 3 bagian dalam satu halaman, atau stepper bila terlalu panjang di HP.

**A. Data dari Bank Mini** (hanya baca; bila salah, hubungi petugas)
- [ ] Nama lengkap, NIS, kelas, jenis nasabah (siswa / guru / karyawan).

**B. Data pribadi**
- [ ] Tempat lahir, tanggal lahir (DatePicker, format Indonesia).
- [ ] Jenis kelamin.
- [ ] Alamat: jalan, RT/RW, kelurahan, kecamatan, kota/kabupaten, kode pos. Untuk tahap ini cukup input teks; pilihan wilayah bertingkat bisa menyusul.
- [ ] No. HP / WhatsApp (format `08…`, 10–13 digit).
- [ ] Email (opsional, untuk pemulihan password nanti).

**C. Kontak orang tua / wali** (wajib bila jenis nasabah = siswa)
- [ ] Nama orang tua / wali, hubungan (ayah, ibu, wali), No. HP orang tua / wali.

**Persetujuan**
- [ ] Centang wajib: "Data yang saya isi benar, dan saya setuju data ini digunakan oleh Bank Mini SMKN 2 Semarang untuk keperluan layanan rekening."

**Perilaku**
- [ ] Validasi dengan Zod; pesan error per field dalam bahasa Indonesia; error `422` dari API ditampilkan di field yang sesuai.
- [ ] Draf form disimpan sementara di `sessionStorage` agar tidak hilang saat halaman ter-refresh, lalu dihapus setelah berhasil disimpan.
- [ ] Setelah berhasil: status `profilLengkap = true` → beranda, dengan sambutan "Selamat datang, {nama}".
- [ ] Data yang dikumpulkan hanya yang tercantum di atas. **Tidak** meminta NIK, foto KTP/KK, atau data sensitif lain tanpa keputusan sekolah.

### Kriteria selesai

- Test komponen: field wali wajib untuk siswa dan tidak wajib untuk guru/karyawan; format No. HP.
- Test end-to-end (mock): akun `25040` login → dipaksa ke lengkapi data → setelah simpan masuk beranda.

---

## Issue 6 — Beranda: daftar rekening dan saldo

Bagian dari #1. Bergantung pada #3.

### Halaman `/beranda` (modul `rekening`)

- [ ] Sapaan: "Halo, {nama panggilan}" + kelas.
- [ ] Kartu **total saldo** semua rekening, dengan tombol mata untuk menyembunyikan/menampilkan nominal. Pilihan diingat di `localStorage`; default tersembunyi di HP.
- [ ] Daftar **kartu rekening**, satu per rekening:
    - nama produk (Tabungan Reguler / Tabungan Berjangka / Deposito) + badge warna per produk;
    - nomor rekening (bisa disalin);
    - saldo;
    - status (Aktif, Jatuh tempo, Ditutup);
    - deposito/berjangka: tanggal jatuh tempo + sisa hari.
- [ ] Klik kartu → **detail rekening** `/rekening/:id`: info produk, tanggal buka, suku bunga, jatuh tempo, setoran rutin (berjangka), 5 transaksi terakhir, tombol "Lihat semua mutasi".
- [ ] Kartu "Transaksi terakhir" lintas rekening (5 item) di beranda.
- [ ] Info "Saldo per {tanggal jam}" + tombol muat ulang.
- [ ] Kondisi loading (skeleton), error, dan nasabah tanpa rekening aktif.

### Kriteria selesai

- Nominal tampil benar untuk saldo 0, ratusan juta, dan saat disembunyikan (`Rp ••••••`).
- Tampilan kartu tetap rapi di lebar 360 px.

---

## Issue 7 — Mutasi rekening

Bagian dari #1. Bergantung pada #3 dan #6.

### Halaman `/mutasi` dan `/rekening/:id/mutasi` (modul `mutasi`)

- [ ] Pilih rekening (dropdown); default rekening pertama atau dari URL.
- [ ] Filter periode: Hari ini, 7 hari, 30 hari, Bulan ini, Bulan lalu, atau rentang tanggal sendiri (maksimal 3 bulan per tampilan).
- [ ] Filter jenis: Semua / Masuk / Keluar.
- [ ] Ringkasan periode: saldo awal, total masuk, total keluar, saldo akhir.
- [ ] Daftar transaksi dikelompokkan per tanggal: keterangan (Setoran tunai, Penarikan tunai, Bunga, Biaya administrasi, Pindah buku, …), waktu, nominal (`+Rp` hijau / `−Rp` merah), saldo setelah transaksi.
- [ ] Desktop: tampilan tabel (PrimeVue DataTable). HP: tampilan daftar kartu.
- [ ] Paginasi dari server (`page`, `per_page` 25) atau "Muat lebih banyak" di HP.
- [ ] Klik transaksi → dialog detail: no. referensi, tanggal & jam, jenis, nominal, saldo setelahnya, petugas/loket (bila API menyediakan).
- [ ] Tombol **Unduh PDF** (rekening koran periode terpilih) → memanggil endpoint PDF dari API, bukan dibuat di browser.
- [ ] Filter tersimpan di query URL agar bisa di-refresh atau dibagikan ke diri sendiri.
- [ ] Kondisi kosong: "Tidak ada transaksi pada periode ini".

### Kriteria selesai

- Total masuk/keluar di ringkasan sama dengan jumlah baris (uji dengan data mock).
- Test end-to-end (mock): ganti rekening, ganti periode, unduh PDF.

---

## Issue 8 — Keamanan, kualitas, CI, dan deploy

Bagian dari #1.

### Keamanan
- [ ] Tidak menyimpan password, token, atau data rekening di `localStorage`; sesi hanya lewat cookie HttpOnly dari Sanctum.
- [ ] **Auto-logout** setelah 10 menit tanpa aktivitas, dengan peringatan hitung mundur 60 detik sebelumnya (`useIdle` dari VueUse) → `POST /nasabah/logout`.
- [ ] Logout menghapus semua state Pinia & `sessionStorage`.
- [ ] Tidak menampilkan data sensitif di judul tab atau log console di build produksi.
- [ ] Header keamanan di server web: `Content-Security-Policy`, `X-Frame-Options: DENY`, `Referrer-Policy`, HSTS.
- [ ] Halaman profil `/profil`: lihat data pribadi, ganti password (form yang sama dengan #4), daftar login terakhir (bila API menyediakan), Keluar.

### Kualitas
- [ ] ESLint + Prettier wajib; `eslint-plugin-vue` aturan `recommended`.
- [ ] Unit test `core/utils`, store, guard; test komponen untuk form; Playwright untuk alur utama (#4, #5, #7).
- [ ] Aksesibilitas dasar: label pada semua input, fokus terlihat, kontras warna memadai.

### CI & deploy
- [ ] GitHub Actions setiap push/PR: `npm ci`, `npm run lint`, `npm run test:unit`, `npm run build`, Playwright dengan mock.
- [ ] Build statis (`dist/`) disajikan Nginx di `ib.<domain>` dengan fallback SPA (`try_files $uri /index.html`) dan HTTPS.
- [ ] `README.md`: setup, akun mock, struktur modul, cara menambah modul baru, cara deploy.

### Kriteria selesai

- CI hijau di `main`.
- Diam 10 menit → otomatis keluar dan kembali ke halaman login.

---

## Lampiran — Kontrak API yang dibutuhkan (dikerjakan di repo Laravel)

Semua di `api.<domain>`, autentikasi Sanctum SPA (cookie), guard **`nasabah`** yang terpisah dari guard petugas.

| Method & endpoint | Kegunaan | Catatan |
| --- | --- | --- |
| `GET /sanctum/csrf-cookie` | Ambil cookie CSRF | Bawaan Sanctum |
| `POST /nasabah/login` | Login `{nis, password}` | Rate limit 5×/menit per NIS + IP |
| `POST /nasabah/logout` | Keluar | |
| `GET /nasabah/me` | Data nasabah + `wajib_ganti_password`, `profil_lengkap` | Dipanggil setiap aplikasi dibuka |
| `PUT /nasabah/password` | Ganti password `{password_lama, password, password_confirmation}` | Set `wajib_ganti_password = false`, keluarkan sesi lain |
| `GET /nasabah/profil` | Data pribadi | |
| `PUT /nasabah/profil` | Simpan data pribadi | Set `profil_lengkap = true` |
| `GET /nasabah/rekening` | Daftar rekening milik nasabah + saldo | Hanya rekening miliknya |
| `GET /nasabah/rekening/{id}` | Detail rekening | 404 bila bukan miliknya |
| `GET /nasabah/rekening/{id}/mutasi?dari=&sampai=&jenis=&page=` | Mutasi + ringkasan periode | Maks. rentang 3 bulan |
| `GET /nasabah/rekening/{id}/mutasi.pdf?dari=&sampai=` | Rekening koran PDF | |

Aturan yang wajib ditegakkan di API (bukan hanya di frontend):
- Selama `wajib_ganti_password = true`, semua endpoint selain `me`, `password`, dan `logout` mengembalikan `403` dengan `{"kode": "WAJIB_GANTI_PASSWORD"}`.
- Selama `profil_lengkap = false`, semua endpoint selain `me`, `profil`, `password`, dan `logout` mengembalikan `403` dengan `{"kode": "WAJIB_LENGKAPI_DATA"}`.
- Reset password oleh petugas di panel teller mengembalikan `wajib_ganti_password = true`.
- Nominal dikirim sebagai string desimal (`"1250000.00"`) atau integer rupiah, tidak sebagai float.
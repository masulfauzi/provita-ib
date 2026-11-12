# Issue — API Internet Banking Nasabah (repo Laravel `provita-web`)

Issue ini untuk repo Laravel Bank Provita. Buat secara berurutan (1 → 8). Di dalam teks, issue lain dirujuk dengan "Issue N"; setelah issue dibuat di GitHub, ganti rujukan itu dengan nomor sebenarnya (`#..`).

Frontend yang memakai API ini sudah selesai dibuat di repo `provita-ib` (Vue 3). Bentuk respons yang diharapkan sudah dipakai di sana dan ditiru oleh mock di `provita-ib/src/mocks/handlers.js`. Mock itu bisa dijadikan acuan, dan **Lampiran — Kontrak API** di akhir dokumen ini adalah sumber kebenarannya.

---

## Issue 1 — [Epic] API Internet Banking Nasabah

### Tujuan

Nasabah bisa masuk ke `ib.<domain>` dan melihat saldo serta mutasi rekeningnya sendiri. Tahap ini **hanya baca**: tidak ada transfer atau pembayaran.

### Alur wajib nasabah

```
Login ──► Ganti password ──► Lengkapi data pribadi ──► Beranda (saldo) ──► Mutasi
          (wajib, sekali)    (wajib, sekali)
```

Aturan alur ini **wajib ditegakkan di API**. Guard di frontend hanya untuk kenyamanan dan bisa dilewati.

### Keputusan arsitektur

| Hal | Keputusan |
| --- | --- |
| Lokasi kode | Endpoint nasabah ditaruh di modul yang sudah ada (`Nasabah`, `Rekening`, `Transaksi`) lewat `routes/api.php` modul, ditambah modul baru `IbNasabah` untuk auth & profil (lihat Issue 2). |
| Prefix | Semua endpoint di bawah `api/v1/nasabah/...` (mengikuti `apiPrefix` di `bootstrap/app.php`). |
| Autentikasi | Laravel Sanctum **mode SPA (cookie sesi)**, bukan token. Token di `localStorage` bisa dicuri lewat XSS. |
| Guard | Guard baru `nasabah` (session driver), terpisah total dari guard petugas (`web` / `users`). Login nasabah tidak boleh bisa membuka panel teller, dan sebaliknya. |
| Domain | `ib.<domain>` (frontend) dan `api.<domain>` (Laravel) berada di domain induk yang sama. |
| ID | UUID, sesuai tabel yang sudah ada. |
| Nominal | Dikirim sebagai string desimal 2 digit (`"1250000.00"`), tidak pernah float. |

### Sub-issue

- [ ] Issue 2 — Akun login nasabah, guard `nasabah`, konfigurasi Sanctum SPA lintas subdomain
- [ ] Issue 3 — Login, logout, `me`, rate limit, riwayat login, reset password oleh petugas
- [ ] Issue 4 — Middleware onboarding (403 berkode) dan ganti password
- [ ] Issue 5 — Profil nasabah: lihat & lengkapi data pribadi
- [ ] Issue 6 — Rekening nasabah: daftar & detail
- [ ] Issue 7 — Mutasi rekening + ringkasan periode + PDF rekening koran
- [ ] Issue 8 — Keamanan, test, dan dokumentasi API

### Definition of done

- Semua endpoint di Lampiran tersedia dan lolos feature test (Pest).
- Frontend `provita-ib` berjalan penuh dengan `VITE_USE_MOCK=false` terhadap API ini, tanpa mengubah kode halaman.
- Nasabah tidak bisa membaca data nasabah lain dengan cara apa pun (ID ditebak, parameter diubah).
- Selama belum ganti password / belum melengkapi data, endpoint data menolak dengan 403 berkode.

---

## Issue 2 — Akun login nasabah, guard `nasabah`, konfigurasi Sanctum SPA

Bagian dari Issue 1.

### Data

Tabel `nasabah` saat ini belum punya kolom autentikasi. Pisahkan kredensial ke tabel sendiri agar data master nasabah tidak tercampur dengan data login:

- [ ] Migration `akun_nasabah` (modul `IbNasabah`):

| Kolom | Tipe | Catatan |
| --- | --- | --- |
| `id` | uuid PK | |
| `nasabah_id` | uuid FK `nasabah`, unique | satu nasabah satu akun |
| `password` | string | hash bcrypt/argon |
| `wajib_ganti_password` | boolean, default `true` | |
| `profil_lengkap_at` | timestamp nullable | `profil_lengkap = profil_lengkap_at !== null` |
| `password_diganti_at` | timestamp nullable | |
| `remember_token` | string nullable | |
| `is_active` | boolean, default `true` | akun bisa dinonaktifkan tanpa menghapus nasabah |
| timestamps | | |

- [ ] Model `AkunNasabah extends Authenticatable` (relasi `belongsTo Nasabah`).
- [ ] Nasabah dengan `nasabah.is_active = false` atau `akun_nasabah.is_active = false` tidak bisa login.
- [ ] Command `php artisan ib:buat-akun {--semua} {--nasabah=}`: membuat akun untuk nasabah yang belum punya, dengan password awal acak 8 karakter, lalu mengekspor daftar NIS + password awal ke Excel (memakai `maatwebsite/excel` yang sudah ada) untuk dibagikan petugas. Password awal **tidak** disimpan dalam bentuk teks.
- [ ] Seeder untuk lingkungan lokal: 3 akun contoh yang sama dengan mock frontend (`25039`/`rahasia123` wajib ganti password; `25040`/`Provita2026` belum lengkap; `25041`/`Provita2026` lengkap).

### Guard & Sanctum

- [ ] `config/auth.php`: guard `nasabah` (driver `session`, provider `akun_nasabah`).
- [ ] Route nasabah memakai middleware `auth:sanctum` dengan `config('sanctum.guard') = ['nasabah']` khusus untuk grup route ini, atau middleware `auth:nasabah` di dalam grup `EnsureFrontendRequestsAreStateful`. Pastikan sesi petugas **tidak** dianggap login sebagai nasabah.
- [ ] `.env`:
    - `SANCTUM_STATEFUL_DOMAINS=ib.<domain>` (lokal: `localhost:5173`)
    - `SESSION_DOMAIN=.<domain>`
    - `SESSION_SECURE_COOKIE=true`, `SESSION_SAME_SITE=lax`
- [ ] `config/cors.php`: `paths` mencakup `api/*` dan `sanctum/csrf-cookie`; `allowed_origins = [env('IB_URL')]`; `supports_credentials = true`.
- [ ] `GET /sanctum/csrf-cookie` tetap di root (bukan di bawah `api/v1`).

### Kriteria selesai

- Feature test: akun nasabah login lalu mengakses route petugas → ditolak; user petugas mengakses `/api/v1/nasabah/me` → 401.
- Command `ib:buat-akun` menghasilkan file Excel dan akun yang bisa dipakai login.

---

## Issue 3 — Login, logout, `me`, rate limit, riwayat login

Bagian dari Issue 1. Bergantung pada Issue 2.

### `POST /api/v1/nasabah/login`

- [ ] Body `{ nis, password }`. Field `nis` menerima **NIS, nomor nasabah (`nasabah.nomor`), atau nomor rekening (`rekening.nomor`)**, karena di layar tertulis "NIS / No. Rekening".
- [ ] Gagal (identitas tidak ada **atau** password salah): `422`, dengan pesan yang sama untuk kedua kasus:

```json
{ "message": "NIS atau password salah.", "errors": { "nis": ["NIS atau password salah."] }, "sisa_percobaan": 3 }
```

- [ ] Rate limit **5 kali gagal per menit per kombinasi NIS + IP** (`RateLimiter`). Bila terlampaui: `429` dengan header `Retry-After` (detik) dan body `{ "message": "...", "retry_after": 45 }`.
- [ ] Sukses: regenerasi sesi, catat ke riwayat login, balas `200` dengan `{ "data": <objek me> }`.
- [ ] Catat login & logout ke `spatie/laravel-activitylog` (log `nasabah`), tanpa mencatat password.

### `POST /api/v1/nasabah/logout`

- [ ] Invalidate sesi + regenerate token CSRF, lalu balas `204`.

### `GET /api/v1/nasabah/me`

- [ ] Dipanggil frontend setiap aplikasi dibuka. Belum login: `401`.
- [ ] Respons (lihat Lampiran untuk definisi field):

```json
{ "data": {
  "id": "uuid-nasabah", "nis": "25041", "nama": "Rizky Ramadhan", "nama_panggilan": "Rizky",
  "kelas": "XII TJKT 3", "jenis_nasabah": "siswa",
  "nomor_rekening": ["1100325041", "1200325041"],
  "wajib_ganti_password": false, "profil_lengkap": true,
  "login_terakhir": "2026-11-09T11:41:00+07:00"
} }
```

- `nama_panggilan`: kata pertama `nama`, kecuali kelak ada kolom khusus.
- `nomor_rekening`: nomor semua rekening milik nasabah. Frontend memakainya untuk aturan "password tidak boleh sama dengan nomor rekening".
- `login_terakhir`: waktu login **sebelum** sesi ini (boleh `null`).

### Riwayat login

- [ ] Tabel `login_nasabah`: `id`, `akun_nasabah_id`, `waktu`, `ip`, `user_agent`, `perangkat` (ringkas dari user agent, mis. `Chrome · Android`), `berhasil` (boolean).
- [ ] Simpan 50 entri terakhir per akun (bersihkan lewat scheduler mingguan).

### Reset password oleh petugas (panel teller)

- [ ] Di halaman detail nasabah (modul `Nasabah`), tambahkan tombol **Reset password IB** dengan permission `nasabah.reset_password_ib` (deklarasikan di `module.json`, untuk peran `teller`).
- [ ] Reset membuat password sementara acak, menampilkannya **sekali** ke petugas (atau mencetak slip), set `wajib_ganti_password = true`, dan **mengeluarkan semua sesi** nasabah tersebut.
- [ ] Catat aksi ini di activity log (siapa petugasnya, untuk nasabah mana).

### Kriteria selesai

- Test: login dengan NIS, nomor nasabah, dan nomor rekening berhasil; pesan gagal sama untuk NIS tak dikenal dan password salah; percobaan ke-6 dalam satu menit → 429 + `Retry-After`.
- Test: setelah reset oleh petugas, sesi lama nasabah → 401 dan login berikutnya `wajib_ganti_password = true`.

---

## Issue 4 — Middleware onboarding (403 berkode) dan ganti password

Bagian dari Issue 1. Bergantung pada Issue 3.

### Middleware `ib.onboarding`

Dipasang di semua route nasabah yang butuh login, dengan pengecualian:

| Kondisi akun | Endpoint yang tetap boleh | Endpoint lain mengembalikan |
| --- | --- | --- |
| `wajib_ganti_password = true` | `me`, `password`, `logout` | `403 { "message": "...", "kode": "WAJIB_GANTI_PASSWORD" }` |
| `profil_lengkap = false` | `me`, `profil` (GET & PUT), `password`, `logout` | `403 { "message": "...", "kode": "WAJIB_LENGKAPI_DATA" }` |

- [ ] Kode `WAJIB_GANTI_PASSWORD` diperiksa lebih dulu daripada `WAJIB_LENGKAPI_DATA`.
- [ ] Middleware memakai alias, mis. `->middleware('ib.onboarding:password,profil')` untuk menyebut endpoint yang dikecualikan.

### `PUT /api/v1/nasabah/password`

- [ ] Body `{ password_lama, password, password_confirmation }`.
- [ ] Validasi (pesan bahasa Indonesia, `422` per field):
    - `password_lama` harus cocok → `"Password saat ini salah."`
    - `password`: minimal 8 karakter; mengandung huruf **dan** angka; tidak sama dengan password lama; tidak sama dengan NIS, nomor nasabah, maupun nomor rekening milik nasabah.
    - `password_confirmation` harus sama.
- [ ] Sukses: simpan hash, set `wajib_ganti_password = false`, `password_diganti_at = now()`, **keluarkan sesi lain** (`Auth::logoutOtherDevices` atau hapus sesi lain dari tabel `sessions`), lalu balas `200 { "message": "Password berhasil diganti." }`.
- [ ] Rate limit 10 per menit per akun.

### Kriteria selesai

- Test tiap baris tabel middleware di atas (endpoint yang boleh vs yang ditolak, beserta `kode`).
- Test tiap aturan password, dan test bahwa sesi lain keluar setelah ganti password.

---

## Issue 5 — Profil nasabah: lihat & lengkapi data pribadi

Bagian dari Issue 1. Bergantung pada Issue 4.

### Data

Tabel `nasabah` sekarang menyimpan `alamat` sebagai satu teks dan hanya punya `nama_orang_tua`. Frontend membutuhkan alamat terstruktur dan kontak wali.

- [ ] Migration menambah kolom ke `nasabah` (semua nullable agar data lama aman):
  `alamat_jalan`, `rt` (3), `rw` (3), `kelurahan`, `kecamatan`, `kota`, `kode_pos` (5), `wali_hubungan` (`ayah|ibu|wali`), `wali_hp` (20).
  Kolom `nama_orang_tua` dipakai sebagai `wali_nama`.
- [ ] Kolom `alamat` lama tetap ada. Saat nasabah menyimpan profil, isi `alamat` dengan gabungan alamat terstruktur supaya halaman panel teller dan cetakan lama tetap benar.
- [ ] Form ubah nasabah di panel teller ikut menampilkan kolom baru (boleh di issue terpisah bila besar).

### `GET /api/v1/nasabah/profil`

- [ ] Respons (lihat Lampiran). Sertakan `riwayat_login` (maks. 10 terbaru dari Issue 3).

### `PUT /api/v1/nasabah/profil`

- [ ] Field yang **boleh** diubah nasabah: `tempat_lahir`, `tanggal_lahir`, `jenis_kelamin`, `alamat_jalan`, `rt`, `rw`, `kelurahan`, `kecamatan`, `kota`, `kode_pos`, `no_hp`, `email`, `wali_nama`, `wali_hubungan`, `wali_hp`, `persetujuan`.
- [ ] Field yang **tidak boleh** diubah lewat API ini: `nama`, `nis`, `kelas`, `jenis`. Abaikan bila dikirim (gunakan `$request->only(...)`).
- [ ] Aturan validasi (pesan bahasa Indonesia):

| Field | Aturan |
| --- | --- |
| `tempat_lahir`, `alamat_jalan`, `kelurahan`, `kecamatan`, `kota` | wajib, string, maks. 100–255 |
| `tanggal_lahir` | wajib, `date_format:Y-m-d`, sebelum hari ini |
| `jenis_kelamin` | wajib, `in:L,P` |
| `rt`, `rw` | wajib, 1–3 digit |
| `kode_pos` | wajib, 5 digit |
| `no_hp`, `wali_hp` | `regex:/^08\d{8,11}$/` (10–13 digit, diawali 08) |
| `email` | opsional, `email` |
| `wali_nama`, `wali_hubungan`, `wali_hp` | **wajib bila `nasabah.jenis = siswa`**, opsional untuk lainnya |
| `persetujuan` | wajib, `accepted` |

- [ ] Sukses: simpan, set `akun_nasabah.profil_lengkap_at = now()`, catat ke activity log (nilai lama/baru), balas `200 { "data": <profil> }`.
- [ ] Data yang dikumpulkan **hanya** yang tercantum di atas. **Tidak** meminta NIK, foto KTP/KK, atau data sensitif lain tanpa keputusan sekolah.

### Kriteria selesai

- Test: siswa tanpa data wali → 422 di `wali_nama`/`wali_hubungan`/`wali_hp`; guru tanpa data wali → 200.
- Test: format No. HP salah → 422; `nama`/`kelas` yang dikirim tidak ikut berubah.
- Test: setelah PUT sukses, endpoint rekening tidak lagi 403.

---

## Issue 6 — Rekening nasabah: daftar & detail

Bagian dari Issue 1. Bergantung pada Issue 4.

### `GET /api/v1/nasabah/rekening`

- [ ] Hanya rekening milik nasabah yang login (`rekening.nasabah_id = auth nasabah`). Rekening yang sudah ditutup ikut ditampilkan dengan `status = ditutup`.
- [ ] Respons `{ data: Rekening[], meta: { saldo_per } }`, dengan `saldo_per` = waktu server saat data diambil (ISO 8601).

### `GET /api/v1/nasabah/rekening/{id}`

- [ ] `{id}` berupa UUID. Rekening yang tidak ada **atau** bukan milik nasabah → `404` (bukan 403, agar keberadaan rekening orang lain tidak bocor).

### Pemetaan data ke objek `Rekening`

| Field API | Sumber |
| --- | --- |
| `id` | `rekening.id` |
| `no_rekening` | `rekening.nomor` |
| `produk` | dari `jenis_rekening.kode` → salah satu `reguler` / `berjangka` / `deposito`. Simpan pemetaan di config (mis. `config/ib.php` → `produk`), jangan hard-code di controller. |
| `nama_produk` | `jenis_rekening.nama` |
| `saldo` | `rekening.saldo` (string 2 desimal) |
| `status` | `aktif` / `jatuh_tempo` / `ditutup` (petakan dari `rekening.status`; `jatuh_tempo` bila tanggal jatuh tempo sudah lewat dan rekening belum dicairkan) |
| `tanggal_buka` | `rekening.tanggal_buka` (`Y-m-d`) |
| `suku_bunga` | persen per tahun sebagai string (`"3.50"`), dari pengaturan bunga produk; `null` bila belum ada |
| `jatuh_tempo`, `jangka_bulan`, `setoran_rutin` | untuk berjangka/deposito; `null` untuk reguler atau bila datanya belum tersedia di modul Produk/Bunga |

- [ ] Gunakan `JsonResource` (`RekeningNasabahResource`) agar bentuk respons konsisten dan kolom internal (mis. `nasabah_id`, `saldo_awal`) tidak bocor.
- [ ] Eager load `jenis_rekening` agar tidak terjadi N+1.

### Kriteria selesai

- Test: nasabah A tidak bisa melihat rekening nasabah B (daftar tidak memuat; detail → 404).
- Test: saldo dikirim sebagai string `"0.00"`, `"350000000.00"`.

---

## Issue 7 — Mutasi rekening + ringkasan periode + PDF rekening koran

Bagian dari Issue 1. Bergantung pada Issue 6.

### `GET /api/v1/nasabah/rekening/{id}/mutasi`

Query:

| Parameter | Aturan |
| --- | --- |
| `dari`, `sampai` | `Y-m-d`, opsional. Default `sampai` = hari ini, `dari` = `sampai` − 3 bulan. |
| `jenis` | opsional: `masuk` / `keluar` (tanpa parameter = semua) |
| `page` | default 1 |
| `per_page` | default 25, maks. 100 |

- [ ] Validasi: `dari ≤ sampai`; rentang maks. **3 bulan** → `422 { errors: { dari: ["Rentang tanggal maksimal 3 bulan."] } }`.
- [ ] Kepemilikan rekening sama dengan Issue 6 (bukan milik → 404).
- [ ] Hanya transaksi milik rekening itu (`transaksi.rekening_id = {id}`). Transaksi kas (`rekening_id` null) tidak pernah ikut.
- [ ] Urutan: terbaru dulu (`tanggal desc, urut desc`).
- [ ] **Ringkasan** dihitung untuk seluruh periode, tidak terpengaruh filter `jenis` maupun paginasi:
    - `saldo_awal` = `saldo_sesudah` transaksi terakhir **sebelum** `dari`, atau `rekening.saldo_awal` bila tidak ada.
    - `total_masuk` = jumlah `nominal` dengan `mutasi > 0`; `total_keluar` = jumlah `nominal` dengan `mutasi < 0`.
    - `saldo_akhir` = `saldo_awal + total_masuk − total_keluar`, dan harus sama dengan `saldo_sesudah` transaksi terakhir dalam periode (bila ada).
    - Hitung di database (`SUM`), bukan di PHP setelah paginasi.

### Pemetaan data ke objek `Transaksi`

| Field API | Sumber |
| --- | --- |
| `id` | `transaksi.id` |
| `no_referensi` | `transaksi.nomor` (fallback: 8 karakter awal `id`) |
| `waktu` | `transaksi.tanggal` + jam dari `created_at`, ISO 8601 dengan zona waktu (`+07:00`) |
| `jenis` | `masuk` bila `mutasi > 0`, `keluar` bila `mutasi < 0` |
| `kategori` | dari `transaksi.jenis`: `setor` → `setoran_tunai`, `tarik` → `penarikan_tunai`, `biaya` → `biaya_admin`, bunga → `bunga`, pindah buku → `pindah_buku`, `penutupan` → `penutupan`, `pembalik` → `koreksi` |
| `keterangan` | `transaksi.keterangan`, atau label kategori bila kosong (mis. "Setoran tunai") |
| `nominal` | `transaksi.nominal` (selalu positif, string 2 desimal) |
| `saldo_setelah` | `transaksi.saldo_sesudah` |
| `petugas` | nama `users` dari `transaksi.user_id`; `"Sistem"` bila dibuat scheduler; `null` bila tidak diketahui |
| `loket` | `null` untuk sekarang (belum ada datanya) |

- [ ] Respons `{ data, meta: { current_page, per_page, total, last_page }, ringkasan }` (lihat Lampiran).
- [ ] Index yang sudah ada `['rekening_id', 'tanggal']` dipakai. Cek query plan untuk rekening dengan lebih dari 2.000 transaksi.

### `GET /api/v1/nasabah/rekening/{id}/mutasi.pdf`

- [ ] Query `dari`, `sampai` dengan aturan yang sama. **Tidak** ada filter `jenis` dan **tidak** dipaginasi (semua transaksi dalam periode).
- [ ] PDF rekening koran: kop Bank Mini SMKN 2 Semarang, nama & nomor rekening, periode, tabel (tanggal, keterangan, masuk, keluar, saldo), ringkasan, dan waktu cetak. Pakai view Blade + `barryvdh/laravel-dompdf` (atau library PDF yang sudah dipakai laporan bila ada).
- [ ] Header: `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="rekening-koran-{nomor}-{dari}-{sampai}.pdf"`, `Cache-Control: no-store`.
- [ ] Rate limit 10 per menit per akun.
- [ ] Error mengikuti format JSON biasa (frontend membaca body error walaupun meminta blob).

### Kriteria selesai

- Test: total masuk/keluar di ringkasan sama dengan jumlah baris pada periode yang sama; `saldo_akhir` sama dengan `saldo_sesudah` baris terakhir.
- Test: rentang 3 bulan + 1 hari → 422; filter `jenis=keluar` hanya mengembalikan `mutasi < 0`, sementara ringkasan tetap sama.
- Test: PDF untuk rekening milik sendiri → 200 `application/pdf`; untuk rekening orang lain → 404.

---

## Issue 8 — Keamanan, test, dan dokumentasi API

Bagian dari Issue 1.

### Keamanan

- [ ] Semua route nasabah melewati `auth` guard `nasabah` + `ib.onboarding`. Tambahkan test "route inventory" yang gagal bila ada route `api/v1/nasabah/*` baru tanpa middleware tersebut.
- [ ] Throttle global untuk grup nasabah: 60 request per menit per akun.
- [ ] Respons error tidak membocorkan stack trace (`APP_DEBUG=false` di produksi) dan tidak membedakan "tidak ada" dengan "bukan milik Anda" (selalu 404).
- [ ] Sesi nasabah: `SESSION_LIFETIME` 15 menit (frontend sudah melakukan auto-logout setelah 10 menit diam); cookie `HttpOnly`, `Secure`, `SameSite=Lax`.
- [ ] Activity log mencatat login, logout, ganti password, simpan profil, reset password oleh petugas, dan unduh PDF.
- [ ] Header keamanan di server `api.<domain>`: `X-Content-Type-Options: nosniff`, `Referrer-Policy`, HSTS.

### Test (Pest)

- [ ] Feature test untuk setiap endpoint di Lampiran, termasuk kasus 401, 403 berkode, 404 kepemilikan, 422, dan 429.
- [ ] Factory `AkunNasabah` dengan state `wajibGantiPassword()`, `profilBelumLengkap()`, dan `lengkap()`.

### Dokumentasi

- [ ] `docs/api-nasabah.md`: daftar endpoint, contoh request/response, kode error, dan konfigurasi `.env` (Sanctum, CORS, session domain).
- [ ] README: cara menjalankan bersama frontend `provita-ib` secara lokal (`SANCTUM_STATEFUL_DOMAINS=localhost:5173`, `VITE_API_URL=http://localhost:8000`, `VITE_USE_MOCK=false`).

### Kriteria selesai

- CI hijau.
- Uji manual end-to-end: frontend `provita-ib` dengan `VITE_USE_MOCK=false` menjalankan alur login → ganti password → lengkapi data → beranda → mutasi → unduh PDF.

---

## Lampiran — Kontrak API

Semua endpoint berada di `https://api.<domain>/api/v1`, kecuali CSRF cookie yang berada di root. Header permintaan dari frontend: `Accept: application/json`, `X-Requested-With: XMLHttpRequest`, `X-XSRF-TOKEN` (otomatis dari cookie `XSRF-TOKEN`).

| # | Method & endpoint | Kegunaan | Boleh saat onboarding? |
| --- | --- | --- | --- |
| 1 | `GET /sanctum/csrf-cookie` | Ambil cookie CSRF (bawaan Sanctum) | — |
| 2 | `POST /nasabah/login` | Login `{ nis, password }` | — (publik) |
| 3 | `POST /nasabah/logout` | Keluar | ya |
| 4 | `GET /nasabah/me` | Data nasabah + status onboarding | ya |
| 5 | `PUT /nasabah/password` | Ganti password | ya |
| 6 | `GET /nasabah/profil` | Data pribadi + riwayat login | hanya setelah ganti password |
| 7 | `PUT /nasabah/profil` | Simpan data pribadi | hanya setelah ganti password |
| 8 | `GET /nasabah/rekening` | Daftar rekening + saldo | tidak |
| 9 | `GET /nasabah/rekening/{id}` | Detail rekening | tidak |
| 10 | `GET /nasabah/rekening/{id}/mutasi` | Mutasi + ringkasan periode | tidak |
| 11 | `GET /nasabah/rekening/{id}/mutasi.pdf` | PDF rekening koran | tidak |

### Kode status yang ditangani frontend

| Status | Arti | Perilaku frontend |
| --- | --- | --- |
| `401` | Belum login / sesi habis | Kosongkan state, arahkan ke `/masuk` ("Sesi Anda berakhir") |
| `403` + `kode` | `WAJIB_GANTI_PASSWORD` / `WAJIB_LENGKAPI_DATA` | Arahkan ke langkah onboarding yang sesuai |
| `404` | Data tidak ada / bukan milik nasabah | "Data tidak ditemukan" |
| `419` | CSRF kedaluwarsa | Ambil ulang CSRF cookie, ulangi permintaan sekali |
| `422` | Validasi; `errors` format Laravel `{ field: [pesan] }` | Pesan ditampilkan di field yang sesuai |
| `429` | Rate limit; header `Retry-After` (detik) | "Terlalu banyak percobaan, coba lagi dalam X menit" |
| `5xx` | Gangguan server | Tampilan error + tombol "Coba lagi" |

### Objek

**Me** (`GET /nasabah/me`, `POST /nasabah/login`)

```json
{
  "id": "uuid",
  "nis": "25041",
  "nama": "Rizky Ramadhan",
  "nama_panggilan": "Rizky",
  "kelas": "XII TJKT 3",
  "jenis_nasabah": "siswa | guru | karyawan | lembaga",
  "nomor_rekening": ["1100325041"],
  "wajib_ganti_password": false,
  "profil_lengkap": true,
  "login_terakhir": "2026-11-09T11:41:00+07:00"
}
```

**Profil** (`GET/PUT /nasabah/profil`)

```json
{
  "nama": "Rizky Ramadhan", "nis": "25041", "kelas": "XII TJKT 3", "jenis_nasabah": "siswa",
  "tempat_lahir": "Semarang", "tanggal_lahir": "2008-03-14", "jenis_kelamin": "L",
  "alamat_jalan": "Jl. Sidodadi Barat No. 8", "rt": "003", "rw": "005",
  "kelurahan": "Karangkidul", "kecamatan": "Semarang Tengah", "kota": "Kota Semarang", "kode_pos": "50136",
  "no_hp": "081234567890", "email": "rizky@example.com",
  "wali_nama": "Slamet Riyadi", "wali_hubungan": "ayah", "wali_hp": "081298765432",
  "riwayat_login": [
    { "waktu": "2026-11-11T18:41:00+07:00", "perangkat": "Chrome · Android", "ip": "10.10.2.15" }
  ]
}
```

Body `PUT` berisi field yang boleh diubah (lihat Issue 5) ditambah `"persetujuan": true`. Field `riwayat_login` hanya ada di `GET`.

**Rekening** (`GET /nasabah/rekening`, `GET /nasabah/rekening/{id}`)

```json
{
  "data": {
    "id": "uuid",
    "no_rekening": "1200325041",
    "produk": "reguler | berjangka | deposito",
    "nama_produk": "Tabungan Berjangka",
    "saldo": "455286.00",
    "status": "aktif | jatuh_tempo | ditutup",
    "tanggal_buka": "2026-03-11",
    "suku_bunga": "3.50",
    "jatuh_tempo": "2027-03-11",
    "jangka_bulan": 12,
    "setoran_rutin": "50000.00"
  },
  "meta": { "saldo_per": "2026-11-11T18:41:00+07:00" }
}
```

Untuk daftar rekening, `data` berupa array. Field `suku_bunga`, `jatuh_tempo`, `jangka_bulan`, dan `setoran_rutin` boleh `null`.

**Mutasi** (`GET /nasabah/rekening/{id}/mutasi`)

```json
{
  "data": [
    {
      "id": "uuid",
      "no_referensi": "TRX202611110186",
      "waktu": "2026-11-11T12:56:00+07:00",
      "jenis": "masuk | keluar",
      "kategori": "setoran_tunai | penarikan_tunai | bunga | biaya_admin | pindah_buku | penutupan | koreksi",
      "keterangan": "Setoran tunai",
      "nominal": "200000.00",
      "saldo_setelah": "2562770.00",
      "petugas": "Dewi Lestari",
      "loket": null
    }
  ],
  "meta": { "current_page": 1, "per_page": 25, "total": 23, "last_page": 1 },
  "ringkasan": {
    "saldo_awal": "1842085.00",
    "total_masuk": "1396685.00",
    "total_keluar": "676000.00",
    "saldo_akhir": "2562770.00"
  }
}
```

### Aturan yang wajib ditegakkan di API (bukan hanya di frontend)

- Selama `wajib_ganti_password = true`, semua endpoint selain `me`, `password`, dan `logout` → `403 { "kode": "WAJIB_GANTI_PASSWORD" }`.
- Selama `profil_lengkap = false`, semua endpoint selain `me`, `profil`, `password`, dan `logout` → `403 { "kode": "WAJIB_LENGKAPI_DATA" }`.
- Reset password oleh petugas di panel teller mengembalikan `wajib_ganti_password = true` dan mengeluarkan semua sesi nasabah itu.
- Nasabah hanya bisa mengakses rekening dan transaksi miliknya sendiri; selain itu → 404.
- Nominal dikirim sebagai string desimal (`"1250000.00"`), tidak sebagai float.

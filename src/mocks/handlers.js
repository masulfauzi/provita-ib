/**
 * Handler MSW untuk semua endpoint di Lampiran Kontrak API.
 * Aturan API (aktivasi 2 langkah dengan sesi 15 menit, 409 SUDAH_AKTIVASI, 403 VERIFIKASI_DIPERLUKAN,
 * login No. HP, rate limit, batas rentang mutasi 3 bulan) ditiru agar perilaku frontend sama seperti
 * dengan API asli.
 *
 * Skenario uji tampilan: tambahkan `?mock=error|lambat|kosong` di URL (`?mock=normal` untuk kembali).
 */
import { delay, http, HttpResponse } from 'msw'
import {
  AKUN_CONTOH,
  dariIso,
  dataRekening,
  hariIni,
  iso,
  rp,
  tambahBulan,
  tanpaMutasi,
} from './data'
import { buatPdf } from './pdf'
import { normalisasiHp } from '@/core/utils/format'

const KUNCI_DB = 'ib-mock:db:v2'
const KUNCI_SKENARIO = 'ib-mock:skenario'

/* ---------- penyimpanan state mock (sessionStorage, khusus mode mock) ---------- */

function riwayatContoh() {
  return [
    {
      waktu: new Date(Date.now() - 86400000 * 2).toISOString(),
      perangkat: 'Chrome · Android',
      ip: '10.10.2.15',
    },
    {
      waktu: new Date(Date.now() - 86400000 * 6).toISOString(),
      perangkat: 'Firefox · Windows',
      ip: '10.10.1.33',
    },
  ]
}

/** `akun[nis]` = null bila nasabah belum aktivasi. */
function dbAwal() {
  const akun = {}
  for (const a of AKUN_CONTOH) {
    akun[a.nis] = a.no_hp
      ? { no_hp: a.no_hp, password: a.password, profil: a.profil, riwayat_login: riwayatContoh() }
      : null
  }
  return { akun, sesi: null, gagal: {}, aktivasi: null }
}

let memori = null
function bacaDb() {
  try {
    const s = sessionStorage.getItem(KUNCI_DB)
    if (s) return JSON.parse(s)
  } catch {
    /* sessionStorage tidak tersedia */
  }
  return memori || dbAwal()
}
function simpanDb(db) {
  memori = db
  try {
    sessionStorage.setItem(KUNCI_DB, JSON.stringify(db))
  } catch {
    /* diabaikan */
  }
}

export function resetDbMock() {
  memori = null
  try {
    sessionStorage.removeItem(KUNCI_DB)
  } catch {
    /* diabaikan */
  }
}

/* ---------- skenario ---------- */

export function skenario() {
  try {
    const dariUrl = new URLSearchParams(window.location.search).get('mock')
    if (dariUrl) {
      if (dariUrl === 'normal') sessionStorage.removeItem(KUNCI_SKENARIO)
      else sessionStorage.setItem(KUNCI_SKENARIO, dariUrl)
    }
    return sessionStorage.getItem(KUNCI_SKENARIO) || 'normal'
  } catch {
    return 'normal'
  }
}

/** Terapkan skenario untuk endpoint data. Mengembalikan Response bila harus gagal. */
async function terapkanSkenario() {
  const s = skenario()
  if (s === 'lambat') await delay(2500)
  else await delay(250)
  if (s === 'error') {
    return HttpResponse.json({ message: 'Server Error (mock)' }, { status: 500 })
  }
  return null
}

/* ---------- helper ---------- */

const json = (body, status = 200, headers) => HttpResponse.json(body, { status, headers })
const tidakTerautentikasi = () => json({ message: 'Unauthenticated.' }, 401)
const validasi = (errors, message) =>
  json({ message: message || Object.values(errors)[0][0], errors }, 422)

function akunAsli(nis) {
  return AKUN_CONTOH.find((a) => a.nis === nis)
}

/** Cek sesi login. */
function cekSesi() {
  const db = bacaDb()
  if (!db.sesi || !db.akun[db.sesi]) return { gagal: tidakTerautentikasi() }
  return { db, nis: db.sesi, st: db.akun[db.sesi], akun: akunAsli(db.sesi) }
}

const identitasTampil = (akun) => (akun.jenis_nasabah === 'siswa' ? akun.nis : akun.nomor)

function dataMe(akun, st) {
  return {
    id: akun.id,
    nis: identitasTampil(akun),
    nama: akun.nama,
    nama_panggilan: akun.nama_panggilan,
    kelas: akun.kelas,
    jenis_nasabah: akun.jenis_nasabah,
    nomor_rekening: dataRekening(akun).map((r) => r.no_rekening),
    no_hp: st.no_hp,
    login_terakhir: st.riwayat_login[1]?.waktu ?? null,
  }
}

/** Identitas yang tidak boleh dipakai sebagai password. */
function identitasTerlarang(akun, noHp) {
  return [
    akun.nis,
    akun.nisn,
    akun.nomor,
    akun.nomor?.replace(/^NSB-/, ''),
    noHp,
    ...dataRekening(akun).map((r) => r.no_rekening),
  ].filter(Boolean)
}

function nisDariHp(db, noHp) {
  return Object.keys(db.akun).find((nis) => db.akun[nis]?.no_hp === noHp)
}

const SUDAH_AKTIVASI = {
  message:
    'Akun sudah diaktivasi. Silakan masuk dengan No. HP dan password. Lupa password atau ganti No. HP? Hubungi teller.',
  kode: 'SUDAH_AKTIVASI',
}

function rekeningMilik(akun, id) {
  return dataRekening(akun).find((r) => String(r.id) === String(id))
}

/** Validasi rentang tanggal mutasi; kembalikan {dari, sampai} atau Response 422. */
function bacaRentang(url) {
  const pDari = url.searchParams.get('dari')
  const pSampai = url.searchParams.get('sampai')
  const pola = /^\d{4}-\d{2}-\d{2}$/
  if ((pDari && !pola.test(pDari)) || (pSampai && !pola.test(pSampai))) {
    return { gagal: validasi({ dari: ['Format tanggal tidak valid.'] }) }
  }
  const sampai = pSampai ? dariIso(pSampai) : hariIni()
  const dari = pDari ? dariIso(pDari) : tambahBulan(sampai, -3)
  if (dari > sampai)
    return { gagal: validasi({ dari: ['Tanggal awal harus sebelum tanggal akhir.'] }) }
  if (dari < tambahBulan(sampai, -3)) {
    return { gagal: validasi({ dari: ['Rentang tanggal maksimal 3 bulan.'] }) }
  }
  return { dari, sampai }
}

function sen(s) {
  return Math.round(Number(s) * 100)
}

export function mutasiPeriode(rek, dari, sampai) {
  const awal = iso(dari)
  const akhir = iso(sampai)
  const urut = rek.mutasi // urut naik berdasarkan waktu
  let saldoAwal = sen(rek.saldo_awal)
  const dalam = []
  for (const t of urut) {
    const tgl = iso(new Date(t.waktu))
    if (tgl < awal) saldoAwal = sen(t.saldo_setelah)
    else if (tgl <= akhir) dalam.push(t)
  }
  const masuk = dalam.filter((t) => t.jenis === 'masuk').reduce((a, t) => a + sen(t.nominal), 0)
  const keluar = dalam.filter((t) => t.jenis === 'keluar').reduce((a, t) => a + sen(t.nominal), 0)
  return {
    items: dalam,
    ringkasan: {
      saldo_awal: rp(saldoAwal / 100),
      total_masuk: rp(masuk / 100),
      total_keluar: rp(keluar / 100),
      saldo_akhir: rp((saldoAwal + masuk - keluar) / 100),
      jumlah_masuk: dalam.filter((t) => t.jenis === 'masuk').length,
      jumlah_keluar: dalam.filter((t) => t.jenis === 'keluar').length,
    },
  }
}

function aturanPasswordServer(baru, { lama, terlarang }) {
  if (!baru || baru.length < 8) return 'Password minimal 8 karakter.'
  if (!/[A-Za-z]/.test(baru) || !/\d/.test(baru))
    return 'Password harus mengandung huruf dan angka.'
  if (lama !== undefined && baru === lama)
    return 'Password baru tidak boleh sama dengan password lama.'
  if (terlarang.map((t) => t.toLowerCase()).includes(baru.toLowerCase()))
    return 'Password tidak boleh sama dengan NIS/NISN, No. HP, atau nomor rekening.'
  return null
}

const POLA_HP = /^08\d{8,11}$/

/** Validasi field data pribadi (ProfilInput). */
function validasiProfil(b, jenis) {
  const wajib = {
    tempat_lahir: 'Tempat lahir',
    tanggal_lahir: 'Tanggal lahir',
    jenis_kelamin: 'Jenis kelamin',
    alamat_jalan: 'Alamat',
    rt: 'RT',
    rw: 'RW',
    kelurahan: 'Kelurahan',
    kecamatan: 'Kecamatan',
    kota: 'Kota/kabupaten',
    kode_pos: 'Kode pos',
  }
  if (jenis === 'siswa') {
    Object.assign(wajib, {
      wali_nama: 'Nama orang tua/wali',
      wali_hubungan: 'Hubungan',
      wali_hp: 'No. HP orang tua/wali',
    })
  }
  const errors = {}
  for (const [k, label] of Object.entries(wajib)) {
    if (!b[k] || !String(b[k]).trim()) errors[k] = [`${label} wajib diisi.`]
  }
  if (b.kode_pos && !/^\d{5}$/.test(b.kode_pos)) errors.kode_pos = ['Kode pos berisi 5 angka.']
  if (b.wali_hp && !POLA_HP.test(normalisasiHp(b.wali_hp)))
    errors.wali_hp = ['Format No. HP tidak valid.']
  if (b.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(b.email))
    errors.email = ['Format email tidak valid.']
  return errors
}

const FIELD_PROFIL = [
  'tempat_lahir',
  'tanggal_lahir',
  'jenis_kelamin',
  'alamat_jalan',
  'rt',
  'rw',
  'kelurahan',
  'kecamatan',
  'kota',
  'kode_pos',
  'email',
  'wali_nama',
  'wali_hubungan',
  'wali_hp',
]
const ambilProfil = (b) => Object.fromEntries(FIELD_PROFIL.map((k) => [k, b[k] ?? null]))

const BATAS_GAGAL = 5
const JENDELA_MS = 60_000

/**
 * Batas 5 gagal per menit per kunci.
 * Mengembalikan { gagal: Response 429 } atau { catatGagal() → sisa_percobaan, berhasil() }.
 */
function cekBatas(db, kunci, pesan) {
  const sekarang = Date.now()
  const daftar = (db.gagal[kunci] || []).filter((t) => sekarang - t < JENDELA_MS)
  if (daftar.length >= BATAS_GAGAL) {
    const tunggu = Math.ceil((JENDELA_MS - (sekarang - daftar[0])) / 1000)
    return {
      gagal: json({ message: pesan, retry_after: tunggu }, 429, { 'Retry-After': String(tunggu) }),
    }
  }
  return {
    catatGagal() {
      daftar.push(sekarang)
      db.gagal[kunci] = daftar
      simpanDb(db)
      return Math.max(0, BATAS_GAGAL - daftar.length)
    },
    berhasil() {
      delete db.gagal[kunci]
    },
  }
}

/* ---------- handler ---------- */

export const handlers = [
  http.get('*/sanctum/csrf-cookie', () => new HttpResponse(null, { status: 204 })),

  http.post('*/nasabah/aktivasi/cek', async ({ request }) => {
    await delay(400)
    const b = (await request.json().catch(() => ({}))) || {}
    const identitas = String(b.identitas || '')
      .trim()
      .toUpperCase()
    const noRek = String(b.no_rekening || '').replace(/[\s.-]/g, '')
    if (!identitas || !noRek) {
      const errors = {}
      if (!identitas) errors.identitas = ['NISN/No. nasabah wajib diisi.']
      if (!noRek) errors.no_rekening = ['Nomor rekening wajib diisi.']
      return validasi(errors)
    }
    const db = bacaDb()
    const r = cekBatas(db, `aktivasi:${identitas}`, 'Terlalu banyak percobaan aktivasi.')
    if (r.gagal) return r.gagal

    const nomor = identitas.startsWith('NSB-') ? identitas : `NSB-${identitas.padStart(6, '0')}`
    const akun = AKUN_CONTOH.find((a) =>
      a.jenis_nasabah === 'siswa' ? a.nisn === identitas : a.nomor === nomor,
    )
    const cocok = akun && dataRekening(akun).some((rek) => rek.no_rekening === noRek)
    if (!cocok) {
      const pesan = 'NISN/No. nasabah atau nomor rekening tidak cocok.'
      return json(
        { message: pesan, errors: { identitas: [pesan] }, sisa_percobaan: r.catatGagal() },
        422,
      )
    }
    r.berhasil()
    if (db.akun[akun.nis]) return json(SUDAH_AKTIVASI, 409)

    const berlaku = new Date(Date.now() + 15 * 60_000)
    db.aktivasi = { nis: akun.nis, berlaku: berlaku.getTime() }
    simpanDb(db)
    return json({
      data: {
        nama: akun.nama,
        kelas: akun.kelas,
        jenis_nasabah: akun.jenis_nasabah,
        wajib_wali: akun.jenis_nasabah === 'siswa',
        berlaku_sampai: berlaku.toISOString(),
      },
    })
  }),

  http.post('*/nasabah/aktivasi', async ({ request }) => {
    await delay(500)
    const db = bacaDb()
    const sesi = db.aktivasi
    if (!sesi || sesi.berlaku < Date.now()) {
      return json(
        {
          message:
            'Sesi aktivasi tidak ditemukan atau sudah kedaluwarsa. Ulangi verifikasi NISN/No. nasabah dan nomor rekening.',
          kode: 'VERIFIKASI_DIPERLUKAN',
        },
        403,
      )
    }
    if (db.akun[sesi.nis]) return json(SUDAH_AKTIVASI, 409)
    const akun = akunAsli(sesi.nis)
    const b = (await request.json().catch(() => ({}))) || {}
    const errors = validasiProfil(b, akun.jenis_nasabah)
    const hp = normalisasiHp(b.no_hp)
    if (!hp) errors.no_hp = ['No. HP wajib diisi.']
    else if (!POLA_HP.test(hp)) errors.no_hp = ['Format No. HP tidak valid.']
    else if (nisDariHp(db, hp)) errors.no_hp = ['No. HP sudah dipakai akun lain.']
    else if (hp !== normalisasiHp(b.no_hp_confirmation))
      errors.no_hp_confirmation = ['Konfirmasi No. HP tidak sama.']
    const salah = aturanPasswordServer(b.password, { terlarang: identitasTerlarang(akun, hp) })
    if (salah) errors.password = [salah]
    else if (b.password !== b.password_confirmation)
      errors.password_confirmation = ['Konfirmasi password tidak sama.']
    if (b.persetujuan !== true) errors.persetujuan = ['Persetujuan wajib dicentang.']
    if (Object.keys(errors).length) return validasi(errors)

    db.akun[sesi.nis] = {
      no_hp: hp,
      password: b.password,
      profil: ambilProfil(b),
      riwayat_login: [],
    }
    db.aktivasi = null
    simpanDb(db)
    return json(
      {
        message: 'Aktivasi berhasil. Silakan masuk menggunakan No. HP dan password Anda.',
        data: { no_hp: hp },
      },
      201,
    )
  }),

  http.post('*/nasabah/login', async ({ request }) => {
    await delay(400)
    const b = (await request.json().catch(() => ({}))) || {}
    const hp = normalisasiHp(b.no_hp)
    const db = bacaDb()
    const r = cekBatas(db, `login:${hp}`, 'Terlalu banyak percobaan.')
    if (r.gagal) return r.gagal

    const nis = nisDariHp(db, hp)
    const st = nis && db.akun[nis]
    if (!st || st.password !== b.password) {
      return json(
        {
          message: 'No. HP atau password salah.',
          errors: { no_hp: ['No. HP atau password salah.'] },
          sisa_percobaan: r.catatGagal(),
        },
        422,
      )
    }

    r.berhasil()
    db.sesi = nis
    st.riwayat_login.unshift({
      waktu: new Date().toISOString(),
      perangkat: navigator.userAgent.includes('Mobile') ? 'Peramban · HP' : 'Peramban · Komputer',
      ip: '127.0.0.1',
    })
    st.riwayat_login = st.riwayat_login.slice(0, 10)
    simpanDb(db)
    return json({ data: dataMe(akunAsli(nis), st) })
  }),

  http.post('*/nasabah/logout', () => {
    const db = bacaDb()
    db.sesi = null
    simpanDb(db)
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('*/nasabah/me', async () => {
    await delay(150)
    const c = cekSesi()
    if (c.gagal) return c.gagal
    return json({ data: dataMe(c.akun, c.st) })
  }),

  http.put('*/nasabah/password', async ({ request }) => {
    await delay(400)
    const c = cekSesi()
    if (c.gagal) return c.gagal
    const body = (await request.json().catch(() => ({}))) || {}
    if (body.password_lama !== c.st.password) {
      return validasi({ password_lama: ['Password saat ini salah.'] })
    }
    const salah = aturanPasswordServer(body.password, {
      lama: body.password_lama,
      terlarang: identitasTerlarang(c.akun, c.st.no_hp),
    })
    if (salah) return validasi({ password: [salah] })
    if (body.password !== body.password_confirmation) {
      return validasi({ password_confirmation: ['Konfirmasi password tidak sama.'] })
    }
    c.st.password = body.password
    simpanDb(c.db)
    return json({ message: 'Password berhasil diganti.' })
  }),

  http.put('*/nasabah/no-hp', async ({ request }) => {
    await delay(400)
    const c = cekSesi()
    if (c.gagal) return c.gagal
    const b = (await request.json().catch(() => ({}))) || {}
    if (b.password !== c.st.password) return validasi({ password: ['Password saat ini salah.'] })
    const hp = normalisasiHp(b.no_hp)
    if (!POLA_HP.test(hp)) return validasi({ no_hp: ['Format No. HP tidak valid.'] })
    if (hp === c.st.no_hp) return validasi({ no_hp: ['No. HP baru sama dengan No. HP sekarang.'] })
    if (nisDariHp(c.db, hp)) return validasi({ no_hp: ['No. HP sudah dipakai akun lain.'] })
    if (hp !== normalisasiHp(b.no_hp_confirmation))
      return validasi({ no_hp_confirmation: ['Konfirmasi No. HP tidak sama.'] })
    c.st.no_hp = hp
    simpanDb(c.db)
    return json({
      message: 'No. HP berhasil diganti. Gunakan No. HP baru untuk masuk berikutnya.',
      data: { no_hp: hp },
    })
  }),

  http.get('*/nasabah/profil', async () => {
    const c = cekSesi()
    if (c.gagal) return c.gagal
    const s = await terapkanSkenario()
    if (s) return s
    return json({
      data: {
        nama: c.akun.nama,
        nis: identitasTampil(c.akun),
        kelas: c.akun.kelas,
        jenis_nasabah: c.akun.jenis_nasabah,
        ...c.st.profil,
        no_hp: c.st.no_hp,
        riwayat_login: c.st.riwayat_login,
      },
    })
  }),

  http.put('*/nasabah/profil', async ({ request }) => {
    await delay(500)
    const c = cekSesi()
    if (c.gagal) return c.gagal
    const b = (await request.json().catch(() => ({}))) || {}
    const errors = validasiProfil(b, c.akun.jenis_nasabah)
    if (Object.keys(errors).length) return validasi(errors, 'Data yang diberikan tidak valid.')
    c.st.profil = ambilProfil(b)
    simpanDb(c.db)
    return json({ data: { ...c.st.profil, no_hp: c.st.no_hp } })
  }),

  http.get('*/nasabah/rekening', async () => {
    const c = cekSesi()
    if (c.gagal) return c.gagal
    const s = await terapkanSkenario()
    if (s) return s
    const data = skenario() === 'kosong' ? [] : dataRekening(c.akun).map(tanpaMutasi)
    return json({ data, meta: { saldo_per: new Date().toISOString() } })
  }),

  http.get('*/nasabah/rekening/:id/mutasi.pdf', async ({ params, request }) => {
    const c = cekSesi()
    if (c.gagal) return c.gagal
    const s = await terapkanSkenario()
    if (s) return s
    const rek = rekeningMilik(c.akun, params.id)
    if (!rek) return json({ message: 'Rekening tidak ditemukan.' }, 404)
    const r = bacaRentang(new URL(request.url))
    if (r.gagal) return r.gagal
    const { items, ringkasan } = mutasiPeriode(rek, r.dari, r.sampai)
    const baris = [
      'BANK MINI PROVITA - SMKN 2 SEMARANG',
      'REKENING KORAN (DATA CONTOH / MOCK)',
      '',
      `Nama       : ${c.akun.nama}`,
      `Rekening   : ${rek.no_rekening} (${rek.nama_produk})`,
      `Periode    : ${iso(r.dari)} s.d. ${iso(r.sampai)}`,
      `Saldo awal : ${ringkasan.saldo_awal}`,
      '',
      'TANGGAL           KETERANGAN                     MASUK        KELUAR        SALDO',
      ...items.map((t) => {
        const w = new Date(t.waktu)
        const tgl = `${iso(w)} ${String(w.getHours()).padStart(2, '0')}:${String(w.getMinutes()).padStart(2, '0')}`
        const masuk = t.jenis === 'masuk' ? t.nominal : ''
        const keluar = t.jenis === 'keluar' ? t.nominal : ''
        return `${tgl.padEnd(18)}${t.keterangan.slice(0, 30).padEnd(31)}${masuk.padStart(12)} ${keluar.padStart(12)} ${t.saldo_setelah.padStart(12)}`
      }),
      '',
      `Total masuk  : ${ringkasan.total_masuk}`,
      `Total keluar : ${ringkasan.total_keluar}`,
      `Saldo akhir  : ${ringkasan.saldo_akhir}`,
    ]
    return new HttpResponse(buatPdf(baris), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="rekening-koran-${rek.no_rekening}.pdf"`,
      },
    })
  }),

  http.get('*/nasabah/rekening/:id/mutasi', async ({ params, request }) => {
    const c = cekSesi()
    if (c.gagal) return c.gagal
    const s = await terapkanSkenario()
    if (s) return s
    const rek = rekeningMilik(c.akun, params.id)
    if (!rek) return json({ message: 'Rekening tidak ditemukan.' }, 404)
    const url = new URL(request.url)
    const r = bacaRentang(url)
    if (r.gagal) return r.gagal

    const { items, ringkasan } = mutasiPeriode(
      skenario() === 'kosong' ? { ...rek, mutasi: [] } : rek,
      r.dari,
      r.sampai,
    )
    const jenis = url.searchParams.get('jenis')
    const tersaring = (
      jenis === 'masuk' || jenis === 'keluar' ? items.filter((t) => t.jenis === jenis) : items
    )
      .slice()
      .reverse()
    const perPage = Math.min(100, Math.max(1, Number(url.searchParams.get('per_page')) || 25))
    const total = tersaring.length
    const lastPage = Math.max(1, Math.ceil(total / perPage))
    const page = Math.min(lastPage, Math.max(1, Number(url.searchParams.get('page')) || 1))
    return json({
      data: tersaring.slice((page - 1) * perPage, page * perPage),
      meta: {
        current_page: page,
        per_page: perPage,
        total,
        last_page: lastPage,
        dari: iso(r.dari),
        sampai: iso(r.sampai),
      },
      ringkasan,
    })
  }),

  http.get('*/nasabah/rekening/:id', async ({ params }) => {
    const c = cekSesi()
    if (c.gagal) return c.gagal
    const s = await terapkanSkenario()
    if (s) return s
    const rek = rekeningMilik(c.akun, params.id)
    if (!rek) return json({ message: 'Rekening tidak ditemukan.' }, 404)
    return json({ data: tanpaMutasi(rek), meta: { saldo_per: new Date().toISOString() } })
  }),
]

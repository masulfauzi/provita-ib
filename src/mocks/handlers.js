/**
 * Handler MSW untuk semua endpoint di Lampiran Kontrak API.
 * Aturan wajib (403 WAJIB_GANTI_PASSWORD / WAJIB_LENGKAPI_DATA, rate limit login,
 * batas rentang mutasi 3 bulan) ditiru agar perilaku frontend sama seperti dengan API asli.
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

const KUNCI_DB = 'ib-mock:db'
const KUNCI_SKENARIO = 'ib-mock:skenario'

/* ---------- penyimpanan state mock (sessionStorage, khusus mode mock) ---------- */

function dbAwal() {
  const akun = {}
  for (const a of AKUN_CONTOH) {
    akun[a.nis] = {
      password: a.password,
      wajib_ganti_password: a.wajib_ganti_password,
      profil_lengkap: a.profil_lengkap,
      profil: a.profil,
      riwayat_login: [
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
      ],
    }
  }
  return { akun, sesi: null, gagal: {} }
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

/**
 * Cek sesi + aturan onboarding.
 * @param {('password'|'profil')[]} izin endpoint yang tetap boleh selama onboarding belum selesai
 */
function cekSesi(izin = []) {
  const db = bacaDb()
  if (!db.sesi || !db.akun[db.sesi]) return { gagal: tidakTerautentikasi() }
  const st = db.akun[db.sesi]
  if (st.wajib_ganti_password && !izin.includes('password')) {
    return {
      gagal: json({ message: 'Anda wajib mengganti password.', kode: 'WAJIB_GANTI_PASSWORD' }, 403),
    }
  }
  if (!st.profil_lengkap && !izin.includes('profil')) {
    return {
      gagal: json(
        { message: 'Anda wajib melengkapi data pribadi.', kode: 'WAJIB_LENGKAPI_DATA' },
        403,
      ),
    }
  }
  return { db, nis: db.sesi, st, akun: akunAsli(db.sesi) }
}

function dataMe(akun, st) {
  return {
    id: akun.id,
    nis: akun.nis,
    nama: akun.nama,
    nama_panggilan: akun.nama_panggilan,
    kelas: akun.kelas,
    jenis_nasabah: akun.jenis_nasabah,
    nomor_rekening: dataRekening(akun).map((r) => r.no_rekening),
    wajib_ganti_password: st.wajib_ganti_password,
    profil_lengkap: st.profil_lengkap,
    login_terakhir: st.riwayat_login[1]?.waktu ?? null,
  }
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

function aturanPasswordServer(baru, { lama, nis, noRekening }) {
  if (!baru || baru.length < 8) return 'Password minimal 8 karakter.'
  if (!/[A-Za-z]/.test(baru) || !/\d/.test(baru))
    return 'Password harus mengandung huruf dan angka.'
  if (baru === lama) return 'Password baru tidak boleh sama dengan password lama.'
  if (baru === nis || noRekening.includes(baru))
    return 'Password tidak boleh sama dengan NIS / nomor rekening.'
  return null
}

const BATAS_GAGAL = 5
const JENDELA_MS = 60_000

/* ---------- handler ---------- */

export const handlers = [
  http.get('*/sanctum/csrf-cookie', () => new HttpResponse(null, { status: 204 })),

  http.post('*/nasabah/login', async ({ request }) => {
    await delay(400)
    const { nis = '', password = '' } = (await request.json().catch(() => ({}))) || {}
    const db = bacaDb()
    const kunci = String(nis)
    const sekarang = Date.now()
    const gagal = (db.gagal[kunci] || []).filter((t) => sekarang - t < JENDELA_MS)

    if (gagal.length >= BATAS_GAGAL) {
      const tunggu = Math.ceil((JENDELA_MS - (sekarang - gagal[0])) / 1000)
      return json({ message: 'Terlalu banyak percobaan.', retry_after: tunggu }, 429, {
        'Retry-After': String(tunggu),
      })
    }

    const akun = akunAsli(kunci)
    const st = db.akun[kunci]
    if (!akun || !st || st.password !== password) {
      gagal.push(sekarang)
      db.gagal[kunci] = gagal
      simpanDb(db)
      return json(
        {
          message: 'NIS atau password salah.',
          errors: { nis: ['NIS atau password salah.'] },
          sisa_percobaan: Math.max(0, BATAS_GAGAL - gagal.length),
        },
        422,
      )
    }

    delete db.gagal[kunci]
    db.sesi = kunci
    st.riwayat_login.unshift({
      waktu: new Date().toISOString(),
      perangkat: navigator.userAgent.includes('Mobile') ? 'Peramban · HP' : 'Peramban · Komputer',
      ip: '127.0.0.1',
    })
    st.riwayat_login = st.riwayat_login.slice(0, 10)
    simpanDb(db)
    return json({ data: dataMe(akun, st) })
  }),

  http.post('*/nasabah/logout', () => {
    const db = bacaDb()
    db.sesi = null
    simpanDb(db)
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('*/nasabah/me', async () => {
    await delay(150)
    const c = cekSesi(['password', 'profil'])
    if (c.gagal) return c.gagal
    return json({ data: dataMe(c.akun, c.st) })
  }),

  http.put('*/nasabah/password', async ({ request }) => {
    await delay(400)
    const c = cekSesi(['password', 'profil'])
    if (c.gagal) return c.gagal
    const body = (await request.json().catch(() => ({}))) || {}
    if (body.password_lama !== c.st.password) {
      return validasi({ password_lama: ['Password saat ini salah.'] })
    }
    const salah = aturanPasswordServer(body.password, {
      lama: body.password_lama,
      nis: c.nis,
      noRekening: dataRekening(c.akun).map((r) => r.no_rekening),
    })
    if (salah) return validasi({ password: [salah] })
    if (body.password !== body.password_confirmation) {
      return validasi({ password_confirmation: ['Konfirmasi password tidak sama.'] })
    }
    c.st.password = body.password
    c.st.wajib_ganti_password = false
    simpanDb(c.db)
    return json({ message: 'Password berhasil diganti.' })
  }),

  http.get('*/nasabah/profil', async () => {
    const c = cekSesi(['profil'])
    if (c.gagal) return c.gagal
    const s = await terapkanSkenario()
    if (s) return s
    return json({
      data: {
        nama: c.akun.nama,
        nis: c.akun.nis,
        kelas: c.akun.kelas,
        jenis_nasabah: c.akun.jenis_nasabah,
        ...c.st.profil,
        riwayat_login: c.st.riwayat_login,
      },
    })
  }),

  http.put('*/nasabah/profil', async ({ request }) => {
    await delay(500)
    const c = cekSesi(['profil'])
    if (c.gagal) return c.gagal
    const b = (await request.json().catch(() => ({}))) || {}
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
      no_hp: 'No. HP',
    }
    if (c.akun.jenis_nasabah === 'siswa') {
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
    if (b.no_hp && !/^08\d{8,11}$/.test(b.no_hp)) errors.no_hp = ['Format No. HP tidak valid.']
    if (b.wali_hp && !/^08\d{8,11}$/.test(b.wali_hp))
      errors.wali_hp = ['Format No. HP tidak valid.']
    if (b.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(b.email))
      errors.email = ['Format email tidak valid.']
    if (!b.persetujuan) errors.persetujuan = ['Persetujuan wajib dicentang.']
    if (Object.keys(errors).length) return validasi(errors, 'Data yang diberikan tidak valid.')

    const { persetujuan: _persetujuan, ...profil } = b
    c.st.profil = profil
    c.st.profil_lengkap = true
    simpanDb(c.db)
    return json({ data: profil })
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

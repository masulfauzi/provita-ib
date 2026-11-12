/**
 * Data contoh untuk Mock API. Mutasi dibuat deterministik (seed per NIS) relatif
 * terhadap tanggal hari ini, sehingga filter "Hari ini", "7 hari", dst. selalu berisi data.
 */

/**
 * Nasabah contoh. `no_hp` null = belum aktivasi (akun IB belum ada).
 * Nomor rekening dibuat di `dataRekening()`: `110{id 2 digit}{nis}`, mis. 1100125039.
 */
export const AKUN_CONTOH = [
  {
    id: 1,
    nis: '25039',
    nisn: '0090025039',
    nomor: 'NSB-000001',
    nama: 'Andi Pratama',
    nama_panggilan: 'Andi',
    kelas: 'X PPLG 2',
    jenis_nasabah: 'siswa',
    no_hp: null,
    password: null,
    profil: null,
  },
  {
    id: 2,
    nis: '25040',
    nisn: '0090025040',
    nomor: 'NSB-000002',
    nama: 'Siti Nurhaliza',
    nama_panggilan: 'Siti',
    kelas: 'XI AKL 1',
    jenis_nasabah: 'siswa',
    no_hp: '081234567891',
    password: 'Provita2026',
    profil: {
      tempat_lahir: 'Semarang',
      tanggal_lahir: '2007-08-21',
      jenis_kelamin: 'P',
      alamat_jalan: 'Jl. Pandanaran No. 12',
      rt: '002',
      rw: '004',
      kelurahan: 'Mugassari',
      kecamatan: 'Semarang Selatan',
      kota: 'Kota Semarang',
      kode_pos: '50249',
      email: null,
      wali_nama: 'Rahayu',
      wali_hubungan: 'ibu',
      wali_hp: '081211112222',
    },
  },
  {
    id: 3,
    nis: '25041',
    nisn: '0090025041',
    nomor: 'NSB-000003',
    nama: 'Rizky Ramadhan',
    nama_panggilan: 'Rizky',
    kelas: 'XII TJKT 3',
    jenis_nasabah: 'siswa',
    no_hp: '081234567890',
    password: 'Provita2026',
    profil: {
      tempat_lahir: 'Semarang',
      tanggal_lahir: '2008-03-14',
      jenis_kelamin: 'L',
      alamat_jalan: 'Jl. Sidodadi Barat No. 8',
      rt: '003',
      rw: '005',
      kelurahan: 'Karangkidul',
      kecamatan: 'Semarang Tengah',
      kota: 'Kota Semarang',
      kode_pos: '50136',
      email: 'rizky.ramadhan@example.com',
      wali_nama: 'Slamet Riyadi',
      wali_hubungan: 'ayah',
      wali_hp: '081298765432',
    },
  },
  {
    id: 4,
    nis: '19004',
    nisn: null,
    nomor: 'NSB-000004',
    nama: 'Dewi Kartika, S.Pd.',
    nama_panggilan: 'Bu Dewi',
    kelas: null,
    jenis_nasabah: 'guru',
    no_hp: null,
    password: null,
    profil: null,
  },
]

/* ---------- utilitas tanggal & acak ---------- */

export function hariIni() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}
export function tambahHari(d, n) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
}
export function tambahBulan(d, n) {
  const hasil = new Date(d.getFullYear(), d.getMonth() + n, 1)
  const akhir = new Date(hasil.getFullYear(), hasil.getMonth() + 1, 0).getDate()
  hasil.setDate(Math.min(d.getDate(), akhir))
  return hasil
}
export function iso(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export function dariIso(s) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function denganJam(d, j, m) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), j, m, 0)
}

/** PRNG mulberry32 */
function acak(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const rp = (n) => `${Math.round(n)}.00`

const PETUGAS = ['Dewi Lestari', 'Fajar Nugroho', 'Nadia Putri', 'Bagas Saputra']

/* ---------- pembuat rekening & mutasi ---------- */

function buatTransaksi(state, { waktu, kategori, keterangan, jenis, nominal, petugas, loket }) {
  state.saldo += jenis === 'masuk' ? nominal : -nominal
  state.seq += 1
  const t = waktu
  const ref = `${state.prefix}${iso(t).replaceAll('-', '')}${String(state.seq).padStart(4, '0')}`
  state.items.push({
    id: `${state.rekeningId}-${state.seq}`,
    no_referensi: ref,
    waktu: t.toISOString(),
    jenis,
    kategori,
    keterangan,
    nominal: rp(nominal),
    saldo_setelah: rp(state.saldo),
    petugas: petugas ?? null,
    loket: loket ?? null,
  })
}

function akhirBulan(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() === d.getDate()
}

const cache = new Map()

/** Rekening + mutasi milik satu akun (di-cache per hari). */
export function dataRekening(akun) {
  const kunci = `${akun.nis}-${iso(hariIni())}`
  if (cache.has(kunci)) return cache.get(kunci)

  const r = acak(Number(akun.nis) * 7919)
  const today = hariIni()
  const mulai = tambahHari(today, -300)
  const idDasar = akun.id * 10

  const reguler = {
    id: idDasar + 1,
    no_rekening: `110${String(akun.id).padStart(2, '0')}${akun.nis}`,
    produk: 'reguler',
    nama_produk: 'Tabungan Reguler',
    status: 'aktif',
    tanggal_buka: iso(tambahHari(today, -620)),
    suku_bunga: '1.00',
    jatuh_tempo: null,
    setoran_rutin: null,
    jangka_bulan: null,
  }
  const bukaBerjangka = tambahBulan(today, -8)
  const berjangka = {
    id: idDasar + 2,
    no_rekening: `120${String(akun.id).padStart(2, '0')}${akun.nis}`,
    produk: 'berjangka',
    nama_produk: 'Tabungan Berjangka',
    status: 'aktif',
    tanggal_buka: iso(bukaBerjangka),
    suku_bunga: '3.50',
    jatuh_tempo: iso(tambahBulan(bukaBerjangka, 12)),
    setoran_rutin: rp(50000),
    jangka_bulan: 12,
  }
  const bukaDeposito = tambahBulan(today, -5)
  const deposito = {
    id: idDasar + 3,
    no_rekening: `130${String(akun.id).padStart(2, '0')}${akun.nis}`,
    produk: 'deposito',
    nama_produk: 'Deposito',
    status: 'aktif',
    tanggal_buka: iso(bukaDeposito),
    suku_bunga: '4.25',
    jatuh_tempo: iso(tambahBulan(bukaDeposito, 6)),
    setoran_rutin: null,
    jangka_bulan: 6,
  }

  const sReg = {
    rekeningId: reguler.id,
    prefix: 'TRX',
    saldo: 350000,
    seq: 0,
    items: [],
    saldoAwal: 350000,
  }
  const sBer = {
    rekeningId: berjangka.id,
    prefix: 'TBJ',
    saldo: 0,
    seq: 0,
    items: [],
    saldoAwal: 0,
  }
  const sDep = { rekeningId: deposito.id, prefix: 'DEP', saldo: 0, seq: 0, items: [], saldoAwal: 0 }

  for (let d = new Date(mulai); d <= today; d = tambahHari(d, 1)) {
    const hari = d.getDay()
    const sekolah = hari !== 0 && hari !== 6
    /** @type {Array<{ s: object, tx: object, minSaldo?: number }>} */
    const acara = []
    const ev = (s, tx, minSaldo) => acara.push({ s, tx, minSaldo })

    if (d.getDate() === 1) {
      ev(sReg, {
        waktu: denganJam(d, 0, 5),
        kategori: 'biaya_admin',
        keterangan: 'Biaya administrasi',
        jenis: 'keluar',
        nominal: 1000,
        petugas: 'Sistem',
      })
    }

    if (iso(d) === deposito.tanggal_buka) {
      ev(sDep, {
        waktu: denganJam(d, 9, 15),
        kategori: 'setoran_tunai',
        keterangan: 'Penempatan deposito',
        jenis: 'masuk',
        nominal: 1000000,
        petugas: PETUGAS[0],
        loket: 'Loket 1',
      })
    }

    // Setoran rutin berjangka (pindah buku dari reguler) setiap tanggal buka berjangka
    if (d >= bukaBerjangka && d.getDate() === bukaBerjangka.getDate()) {
      const w = denganJam(d, 7, 30)
      ev(sReg, {
        waktu: w,
        kategori: 'pindah_buku',
        keterangan: 'Pindah buku ke Tabungan Berjangka',
        jenis: 'keluar',
        nominal: 50000,
        petugas: 'Sistem',
      })
      ev(sBer, {
        waktu: w,
        kategori: 'pindah_buku',
        keterangan: 'Setoran rutin dari Tabungan Reguler',
        jenis: 'masuk',
        nominal: 50000,
        petugas: 'Sistem',
      })
    }

    if (sekolah) {
      const jumlah = r() < 0.62 ? (r() < 0.25 ? 2 : 1) : 0
      for (let i = 0; i < jumlah; i++) {
        const setor = r() < 0.58
        const nominal =
          Math.round((setor ? 10000 + r() * 190000 : 10000 + r() * 140000) / 5000) * 5000
        ev(
          sReg,
          {
            waktu: denganJam(d, 7 + Math.floor(r() * 8), Math.floor(r() * 60)),
            kategori: setor ? 'setoran_tunai' : 'penarikan_tunai',
            keterangan: setor ? 'Setoran tunai' : 'Penarikan tunai',
            jenis: setor ? 'masuk' : 'keluar',
            nominal,
            petugas: PETUGAS[Math.floor(r() * PETUGAS.length)],
            loket: `Loket ${1 + Math.floor(r() * 2)}`,
          },
          setor ? undefined : 20000,
        )
      }
    }

    // Pastikan ada transaksi hari ini (untuk filter "Hari ini")
    if (iso(d) === iso(today) && !acara.some((a) => a.s === sReg)) {
      ev(sReg, {
        waktu: denganJam(today, 7, 12),
        kategori: 'setoran_tunai',
        keterangan: 'Setoran tunai',
        jenis: 'masuk',
        nominal: 25000,
        petugas: PETUGAS[1],
        loket: 'Loket 1',
      })
    }

    acara.sort((a, b) => a.tx.waktu - b.tx.waktu)
    for (const { s, tx, minSaldo } of acara) {
      if (minSaldo !== undefined && s.saldo - tx.nominal < minSaldo) continue
      buatTransaksi(s, tx)
    }

    // Bunga akhir bulan (dihitung dari saldo akhir hari, selalu transaksi terakhir hari itu)
    if (akhirBulan(d)) {
      const bungaReg = Math.round((sReg.saldo * 0.01) / 12)
      if (bungaReg > 0) {
        buatTransaksi(sReg, {
          waktu: denganJam(d, 23, 59),
          kategori: 'bunga',
          keterangan: 'Bunga',
          jenis: 'masuk',
          nominal: bungaReg,
          petugas: 'Sistem',
        })
      }
      if (sBer.saldo > 0) {
        buatTransaksi(sBer, {
          waktu: denganJam(d, 23, 59),
          kategori: 'bunga',
          keterangan: 'Bunga',
          jenis: 'masuk',
          nominal: Math.round((sBer.saldo * 0.035) / 12),
          petugas: 'Sistem',
        })
      }
      if (sDep.saldo > 0) {
        buatTransaksi(sDep, {
          waktu: denganJam(d, 23, 59),
          kategori: 'bunga',
          keterangan: 'Bunga deposito',
          jenis: 'masuk',
          nominal: Math.round((1000000 * 0.0425) / 12),
          petugas: 'Sistem',
        })
      }
    }
  }

  const hasil = [
    { ...reguler, saldo: rp(sReg.saldo), mutasi: sReg.items, saldo_awal: rp(sReg.saldoAwal) },
    { ...berjangka, saldo: rp(sBer.saldo), mutasi: sBer.items, saldo_awal: rp(0) },
    { ...deposito, saldo: rp(sDep.saldo), mutasi: sDep.items, saldo_awal: rp(0) },
  ]
  cache.set(kunci, hasil)
  return hasil
}

/** Representasi rekening untuk API (tanpa daftar mutasi). */
export function tanpaMutasi(rek) {
  const { mutasi: _mutasi, saldo_awal: _saldoAwal, ...sisa } = rek
  return sisa
}

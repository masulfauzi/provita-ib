import { describe, expect, it } from 'vitest'
import {
  bacaFilter,
  jumlahkan,
  keQuery,
  kelompokkanPerTanggal,
  rentangPreset,
  validasiRentang,
} from '../periode'
import { AKUN_CONTOH, dataRekening, hariIni, tambahHari } from '@/mocks/data'
import { mutasiPeriode } from '@/mocks/handlers'
import { keISODate, keSen } from '@/core/utils/format'

const sekarang = new Date(2026, 9, 15, 10)

describe('rentangPreset', () => {
  const r = (p) => {
    const x = rentangPreset(p, sekarang)
    return [keISODate(x.dari), keISODate(x.sampai)]
  }
  it('menghitung rentang tiap preset', () => {
    expect(r('hari-ini')).toEqual(['2026-10-15', '2026-10-15'])
    expect(r('7-hari')).toEqual(['2026-10-09', '2026-10-15'])
    expect(r('30-hari')).toEqual(['2026-09-16', '2026-10-15'])
    expect(r('bulan-ini')).toEqual(['2026-10-01', '2026-10-15'])
    expect(r('bulan-lalu')).toEqual(['2026-09-01', '2026-09-30'])
  })
})

describe('validasiRentang', () => {
  it('maksimal 3 bulan', () => {
    expect(validasiRentang('2026-07-15', '2026-10-15', sekarang)).toBeNull()
    expect(validasiRentang('2026-07-14', '2026-10-15', sekarang)).toMatch(/maksimal 3 bulan/)
    expect(validasiRentang('2026-10-10', '2026-10-01', sekarang)).toMatch(/sebelum/)
    expect(validasiRentang('2026-10-10', '2026-10-20', sekarang)).toMatch(/melebihi/)
  })
})

describe('filter ↔ query URL', () => {
  it('default & round-trip', () => {
    const f = bacaFilter({}, sekarang)
    expect(f).toMatchObject({ periode: '30-hari', jenis: 'semua', page: 1 })
    expect(keQuery(f)).toEqual({})
    const k = bacaFilter(
      { periode: 'kustom', dari: '2026-09-01', sampai: '2026-09-30', jenis: 'keluar', page: '2' },
      sekarang,
    )
    expect(keQuery(k)).toEqual({
      periode: 'kustom',
      dari: '2026-09-01',
      sampai: '2026-09-30',
      jenis: 'keluar',
      page: '2',
    })
  })
  it('rentang kustom tidak valid jatuh ke default', () => {
    expect(
      bacaFilter({ periode: 'kustom', dari: '2025-01-01', sampai: '2026-10-01' }, sekarang).periode,
    ).toBe('30-hari')
  })
})

describe('kelompokkanPerTanggal', () => {
  it('mengelompokkan berurutan', () => {
    const g = kelompokkanPerTanggal([
      { waktu: new Date(2026, 9, 15, 9).toISOString() },
      { waktu: new Date(2026, 9, 15, 7).toISOString() },
      { waktu: new Date(2026, 9, 14, 9).toISOString() },
    ])
    expect(g.map((x) => x.items.length)).toEqual([2, 1])
  })
})

describe('ringkasan mutasi (data mock)', () => {
  it.each(AKUN_CONTOH.map((a) => [a.nis, a]))(
    'total masuk/keluar = jumlah baris (%s)',
    (_nis, akun) => {
      for (const rek of dataRekening(akun)) {
        const sampai = hariIni()
        const dari = tambahHari(sampai, -89)
        const { items, ringkasan } = mutasiPeriode(rek, dari, sampai)
        const j = jumlahkan(items)
        expect(keSen(ringkasan.total_masuk)).toBe(keSen(j.masuk))
        expect(keSen(ringkasan.total_keluar)).toBe(keSen(j.keluar))
        expect(keSen(ringkasan.saldo_akhir)).toBe(
          keSen(ringkasan.saldo_awal) + keSen(j.masuk) - keSen(j.keluar),
        )
        expect(items.length).toBeGreaterThan(0)
        expect(ringkasan.saldo_akhir).toBe(items.at(-1).saldo_setelah)
      }
    },
  )
})

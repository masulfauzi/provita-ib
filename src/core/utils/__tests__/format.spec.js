import { describe, expect, it } from 'vitest'
import { keSen, normalisasiHp, rupiah, samarkanRekening, tanggal, terbilang } from '../format'

describe('keSen', () => {
  it('membaca string desimal & integer tanpa galat float', () => {
    expect(keSen('1250000.00')).toBe(125000000)
    expect(keSen('0.10')).toBe(10)
    expect(keSen('0.1')).toBe(10)
    expect(keSen(1250000)).toBe(125000000)
    expect(keSen('-500.50')).toBe(-50050)
    expect(keSen('abc')).toBe(0)
    expect(keSen(null)).toBe(0)
  })
})

describe('rupiah', () => {
  it('format dasar', () => {
    expect(rupiah('1250000.00')).toBe('Rp 1.250.000')
    expect(rupiah(0)).toBe('Rp 0')
    expect(rupiah('0.00')).toBe('Rp 0')
  })
  it('ratusan juta', () => {
    expect(rupiah('350000000.00')).toBe('Rp 350.000.000')
    expect(rupiah(999999999)).toBe('Rp 999.999.999')
  })
  it('sen ditampilkan bila tidak nol', () => {
    expect(rupiah('1500.50')).toBe('Rp 1.500,50')
  })
  it('tanda +/−', () => {
    expect(rupiah('50000', { tanda: true })).toBe('+Rp 50.000')
    expect(rupiah('-50000')).toBe('−Rp 50.000')
  })
  it('disembunyikan', () => {
    expect(rupiah('1250000', { sembunyikan: true })).toBe('Rp ••••••')
  })
})

describe('tanggal', () => {
  const sekarang = new Date(2026, 9, 12, 10, 0)
  it('Hari ini / Kemarin / tanggal pendek', () => {
    expect(tanggal(new Date(2026, 9, 12, 7, 0), sekarang)).toBe('Hari ini')
    expect(tanggal('2026-10-11', sekarang)).toBe('Kemarin')
    expect(tanggal('2026-10-01', sekarang)).toBe('1 Okt 2026')
    expect(tanggal(null)).toBe('-')
  })
})

describe('samarkanRekening', () => {
  it('menyisakan 3 digit terakhir', () => {
    expect(samarkanRekening('25039')).toBe('•••039')
    expect(samarkanRekening(1101025041)).toBe('•••041')
    expect(samarkanRekening('')).toBe('')
  })
})

describe('terbilang', () => {
  it('angka umum', () => {
    expect(terbilang(1250000)).toBe('satu juta dua ratus lima puluh ribu rupiah')
    expect(terbilang(11)).toBe('sebelas rupiah')
    expect(terbilang(115)).toBe('seratus lima belas rupiah')
    expect(terbilang(1000)).toBe('seribu rupiah')
    expect(terbilang(0)).toBe('nol rupiah')
  })
})

describe('normalisasiHp', () => {
  it.each([
    ['081234567890', '081234567890'],
    ['0812-3456-7890', '081234567890'],
    ['+62 812 3456 7890', '081234567890'],
    ['6281234567890', '081234567890'],
    ['', ''],
  ])('%s → %s', (masuk, keluar) => expect(normalisasiHp(masuk)).toBe(keluar))
})

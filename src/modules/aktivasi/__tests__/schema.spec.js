import { describe, expect, it } from 'vitest'
import { buatSchemaAktivasi, NILAI_AWAL, schemaVerifikasi } from '../schema'

const terlarang = ['0090025039', '1100125039']
const lengkap = {
  ...NILAI_AWAL,
  tempat_lahir: 'Semarang',
  tanggal_lahir: new Date(2008, 2, 14),
  jenis_kelamin: 'L',
  alamat_jalan: 'Jl. Sidodadi 8',
  rt: '003',
  rw: '005',
  kelurahan: 'Karangkidul',
  kecamatan: 'Semarang Tengah',
  kota: 'Semarang',
  kode_pos: '50136',
  no_hp: '081311112222',
  no_hp_confirmation: '081311112222',
  password: 'Andi2026ok',
  password_confirmation: 'Andi2026ok',
  persetujuan: true,
}
const wali = { wali_nama: 'Slamet', wali_hubungan: 'ayah', wali_hp: '081298765432' }
const pathError = (r) => r.error?.issues.map((i) => i.path[0]) ?? []
const siswa = buatSchemaAktivasi({ wajibWali: true, terlarang })
const guru = buatSchemaAktivasi({ wajibWali: false, terlarang })

describe('schema verifikasi', () => {
  it('identitas & nomor rekening wajib', () => {
    expect(pathError(schemaVerifikasi.safeParse({ identitas: '', no_rekening: '' }))).toEqual([
      'identitas',
      'no_rekening',
    ])
    expect(
      schemaVerifikasi.safeParse({ identitas: 'NSB-000004', no_rekening: '1100419004' }).success,
    ).toBe(true)
  })
})

describe('schema aktivasi', () => {
  it('siswa: kontak wali wajib', () => {
    expect(pathError(siswa.safeParse(lengkap))).toEqual(
      expect.arrayContaining(['wali_nama', 'wali_hubungan', 'wali_hp']),
    )
    expect(siswa.safeParse({ ...lengkap, ...wali }).success).toBe(true)
  })

  it('guru: kontak wali tidak wajib', () => {
    expect(guru.safeParse(lengkap).success).toBe(true)
  })

  it.each([
    ['081234567890', true],
    ['+62 812-3456-7890', true],
    ['6281234567890', true],
    ['081234567', false],
    ['08123abc890', false],
  ])('format No. HP %s → %s', (no_hp, valid) => {
    const r = guru.safeParse({ ...lengkap, no_hp, no_hp_confirmation: no_hp })
    expect(pathError(r).includes('no_hp')).toBe(!valid)
  })

  it('ulangi No. HP dibandingkan setelah dinormalisasi', () => {
    expect(
      guru.safeParse({ ...lengkap, no_hp: '+6281311112222', no_hp_confirmation: '081311112222' })
        .success,
    ).toBe(true)
    expect(pathError(guru.safeParse({ ...lengkap, no_hp_confirmation: '081311119999' }))).toEqual([
      'no_hp_confirmation',
    ])
  })

  it('password mengikuti aturan & tidak boleh sama dengan identitas / No. HP', () => {
    const pw = (password) =>
      pathError(guru.safeParse({ ...lengkap, password, password_confirmation: password }))
    expect(pw('abc12')).toContain('password')
    expect(pw('abcdefgh')).toContain('password')
    expect(pw('0090025039')).toContain('password')
    expect(pw('081311112222')).toContain('password')
    expect(pw('Andi2026ok')).toEqual([])
  })

  it('ulangi password harus sama — tetap dicek walau field lain kosong', () => {
    const r = guru.safeParse({
      ...NILAI_AWAL,
      password: 'Andi2026ok',
      password_confirmation: 'Andi2026xx',
    })
    expect(pathError(r)).toContain('password_confirmation')
    expect(pathError(r)).toContain('tanggal_lahir')
  })

  it('persetujuan wajib dicentang', () => {
    expect(pathError(guru.safeParse({ ...lengkap, persetujuan: false }))).toContain('persetujuan')
  })
})

import { describe, expect, it } from 'vitest'
import { buatSchemaDataPribadi, NILAI_AWAL } from '../schema'

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
  no_hp: '081234567890',
  persetujuan: true,
}
const wali = { wali_nama: 'Slamet', wali_hubungan: 'ayah', wali_hp: '081298765432' }
const pathError = (r) => r.error?.issues.map((i) => i.path[0]) ?? []

describe('schema data pribadi', () => {
  it('siswa: kontak wali wajib', () => {
    const r = buatSchemaDataPribadi('siswa').safeParse(lengkap)
    expect(r.success).toBe(false)
    expect(pathError(r)).toEqual(expect.arrayContaining(['wali_nama', 'wali_hubungan', 'wali_hp']))
    expect(buatSchemaDataPribadi('siswa').safeParse({ ...lengkap, ...wali }).success).toBe(true)
  })

  it('guru/karyawan: kontak wali tidak wajib', () => {
    expect(buatSchemaDataPribadi('guru').safeParse(lengkap).success).toBe(true)
    expect(buatSchemaDataPribadi('karyawan').safeParse(lengkap).success).toBe(true)
  })

  it.each([
    ['081234567890', true],
    ['0812345678', true],
    ['0812345678901', true],
    ['081234567', false],
    ['08123456789012', false],
    ['6281234567890', false],
    ['08123abc890', false],
  ])('format No. HP %s → %s', (no_hp, valid) => {
    const r = buatSchemaDataPribadi('guru').safeParse({ ...lengkap, no_hp })
    expect(r.success).toBe(valid)
    expect(pathError(r).includes('no_hp')).toBe(!valid)
  })

  it('format No. HP wali juga dicek', () => {
    const r = buatSchemaDataPribadi('siswa').safeParse({ ...lengkap, ...wali, wali_hp: '12345' })
    expect(pathError(r)).toContain('wali_hp')
  })

  it('persetujuan wajib dicentang', () => {
    const r = buatSchemaDataPribadi('guru').safeParse({ ...lengkap, persetujuan: false })
    expect(pathError(r)).toContain('persetujuan')
  })

  it('email opsional tapi harus valid bila diisi', () => {
    expect(buatSchemaDataPribadi('guru').safeParse({ ...lengkap, email: '' }).success).toBe(true)
    expect(
      pathError(buatSchemaDataPribadi('guru').safeParse({ ...lengkap, email: 'salah' })),
    ).toContain('email')
  })
})

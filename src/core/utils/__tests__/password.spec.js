import { describe, expect, it } from 'vitest'
import { aturanPassword, kekuatanPassword, passwordValid } from '../password'

const ok = (pw, k) => Object.fromEntries(aturanPassword(pw, k).map((a) => [a.kode, a.ok]))
const konteks = { lama: 'rahasia123', nis: '25039', noRekening: ['1100125039'] }

describe('aturanPassword', () => {
  it('minimal 8 karakter', () => {
    expect(ok('abc123', konteks).panjang).toBe(false)
    expect(ok('abcd1234', konteks).panjang).toBe(true)
  })
  it('huruf dan angka', () => {
    expect(ok('abcdefgh', konteks).hurufAngka).toBe(false)
    expect(ok('12345678', konteks).hurufAngka).toBe(false)
    expect(ok('abcd1234', konteks).hurufAngka).toBe(true)
  })
  it('tidak sama dengan password lama', () => {
    expect(ok('rahasia123', konteks).bedaLama).toBe(false)
    expect(ok('Rahasia1234', konteks).bedaLama).toBe(true)
  })
  it('tidak sama dengan NIS / nomor rekening', () => {
    expect(ok('25039', konteks).bukanNis).toBe(false)
    expect(ok('1100125039', konteks).bukanNis).toBe(false)
    expect(ok('Provita2026', konteks).bukanNis).toBe(true)
  })
  it('passwordValid', () => {
    expect(passwordValid('Provita2026', konteks)).toBe(true)
    expect(passwordValid('rahasia123', konteks)).toBe(false)
  })
})

describe('kekuatanPassword', () => {
  it('naik sesuai kompleksitas', () => {
    expect(kekuatanPassword('').skor).toBe(0)
    expect(kekuatanPassword('abc').skor).toBeLessThanOrEqual(1)
    expect(kekuatanPassword('abcd1234').skor).toBe(2)
    expect(kekuatanPassword('Abcd1234!xyz').skor).toBe(4)
  })
})

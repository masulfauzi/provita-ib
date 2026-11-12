import { expect } from '@playwright/test'

/** Akun mock (lihat src/mocks/data.js). */
export const AKUN = {
  /** Belum aktivasi: NISN 0090025039 + rekening 1100125039. */
  belumAktivasi: { identitas: '0090025039', no_rekening: '1100125039', nama: 'Andi Pratama' },
  /** Guru belum aktivasi: No. nasabah NSB-000004 + rekening 1100419004. */
  guru: { identitas: 'NSB-000004', no_rekening: '1100419004', nama: 'Dewi Kartika' },
  aktif: { no_hp: '081234567891', password: 'Provita2026' },
  lengkap: { no_hp: '081234567890', password: 'Provita2026' },
}

export async function login(page, { no_hp, password }) {
  await page.goto('/masuk')
  await page.locator('#no_hp').fill(no_hp)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: 'Masuk', exact: true }).click()
}

export async function pilihOpsi(page, pemicu, teks) {
  await pemicu.click()
  await page.getByRole('option', { name: teks }).click()
  await expect(page.getByRole('listbox')).toBeHidden()
}

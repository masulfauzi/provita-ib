import { expect } from '@playwright/test'

export const AKUN = {
  baru: { nis: '25039', password: 'rahasia123' },
  belumLengkap: { nis: '25040', password: 'Provita2026' },
  lengkap: { nis: '25041', password: 'Provita2026' },
}

export async function login(page, { nis, password }) {
  await page.goto('/masuk')
  await page.locator('#nis').fill(nis)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: 'Masuk', exact: true }).click()
}

export async function pilihOpsi(page, pemicu, teks) {
  await pemicu.click()
  await page.getByRole('option', { name: teks }).click()
  await expect(page.getByRole('listbox')).toBeHidden()
}

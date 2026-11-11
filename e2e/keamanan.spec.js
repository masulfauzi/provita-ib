import { expect, test } from '@playwright/test'
import { AKUN, login } from './helpers'

test('diam 10 menit → peringatan hitung mundur lalu otomatis keluar (#8)', async ({ page }) => {
  await page.clock.install()
  await login(page, AKUN.lengkap)
  await expect(page).toHaveURL(/\/beranda$/)

  await page.clock.fastForward('09:01')
  await expect(page.getByText('Sesi akan berakhir')).toBeVisible()
  await expect(page.getByTestId('hitung-mundur')).toBeVisible()

  await page.clock.fastForward('01:00')
  await expect(page).toHaveURL(/\/masuk\?alasan=tidak-aktif/)
  await expect(page.getByText('otomatis keluar karena tidak ada aktivitas')).toBeVisible()

  // Sesi benar-benar berakhir
  await page.goto('/beranda')
  await expect(page).toHaveURL(/\/masuk/)
})

test('"Tetap masuk" membatalkan auto-logout', async ({ page }) => {
  await page.clock.install()
  await login(page, AKUN.lengkap)
  await expect(page).toHaveURL(/\/beranda$/)
  await page.clock.fastForward('09:01')
  await page.getByRole('button', { name: 'Tetap masuk' }).click()
  await page.clock.fastForward('01:30')
  await expect(page).toHaveURL(/\/beranda$/)
})

test('judul tab tidak memuat data sensitif', async ({ page }) => {
  await login(page, AKUN.lengkap)
  await expect(page).toHaveURL(/\/beranda$/)
  await expect(page).toHaveTitle('Beranda · Bank Provita')
  await page.goto('/rekening/31')
  await expect(page).toHaveTitle('Detail rekening · Bank Provita')
})

import { expect, test } from '@playwright/test'
import { AKUN, login, pilihOpsi } from './helpers'

test.beforeEach(async ({ page }) => {
  await login(page, AKUN.lengkap)
  await expect(page).toHaveURL(/\/beranda$/)
})

test('beranda: daftar rekening & sembunyikan saldo (#6)', async ({ page }) => {
  await expect(page.getByTestId('kartu-rekening')).toHaveCount(3)
  // Mulai dari kondisi saldo terlihat (default HP = tersembunyi)
  await page.evaluate(() => localStorage.setItem('ib:sembunyikan-saldo', 'false'))
  await page.reload()
  const total = page.getByTestId('total-saldo')
  const toggle = page.getByTestId('toggle-saldo')
  await expect(total).toHaveText(/Rp \d{1,3}(\.\d{3})+/)
  await toggle.click()
  await expect(total).toHaveText('Rp ••••••')
  // Preferensi diingat setelah reload
  await page.reload()
  await expect(page.getByTestId('total-saldo')).toHaveText('Rp ••••••')
})

test('mutasi: ganti rekening, ganti periode, unduh PDF (#7)', async ({ page }) => {
  await page.goto('/mutasi')
  await expect(page.getByTestId('ringkasan')).toBeVisible()
  await expect(page.getByTestId('saldo-akhir')).toHaveText(/Rp/)

  // Ganti rekening
  await pilihOpsi(page, page.getByTestId('pilih-rekening'), /Deposito/)
  await expect(page).toHaveURL(/rekening=33/)
  await expect(page.getByTestId('pilih-rekening')).toContainText('Deposito')

  // Ganti periode
  await pilihOpsi(page, page.getByTestId('pilih-rekening'), /Tabungan Reguler/)
  await page.getByTestId('pilih-periode').getByText('7 hari').click()
  await expect(page).toHaveURL(/periode=7-hari/)
  await page.getByTestId('pilih-jenis').getByText('Masuk').click()
  await expect(page).toHaveURL(/jenis=masuk/)
  await expect(page.getByTestId('total-masuk')).toHaveText(/\+?Rp/)

  // Filter bertahan setelah refresh
  await page.reload()
  await expect(page).toHaveURL(/periode=7-hari/)
  await expect(page.getByTestId('pilih-rekening')).toContainText('Tabungan Reguler')

  // Unduh PDF
  const unduh = page.waitForEvent('download')
  await page.getByTestId('unduh-pdf').click()
  const file = await unduh
  expect(file.suggestedFilename()).toMatch(
    /^rekening-koran-\d+-\d{4}-\d{2}-\d{2}-\d{4}-\d{2}-\d{2}\.pdf$/,
  )
})

test('mutasi per rekening dari halaman detail', async ({ page }) => {
  await page.getByTestId('kartu-rekening').first().getByRole('link').click()
  await expect(page).toHaveURL(/\/rekening\/31$/)
  await page.getByRole('link', { name: 'Lihat semua mutasi' }).first().click()
  await expect(page).toHaveURL(/\/rekening\/31\/mutasi/)
  await expect(page.getByTestId('pilih-rekening')).toContainText('Tabungan Reguler')
})

test('skenario mock kosong menampilkan kondisi kosong', async ({ page }) => {
  await page.goto('/mutasi?mock=kosong')
  await expect(page.getByText('Belum ada rekening')).toBeVisible()
  await page.goto('/beranda?mock=normal')
  await expect(page.getByTestId('kartu-rekening')).toHaveCount(3)
})

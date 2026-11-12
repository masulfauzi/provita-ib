import { expect, test } from '@playwright/test'
import { AKUN, login } from './helpers'

test.describe('Login dengan No. HP', () => {
  test('belum login → dialihkan ke /masuk dengan redirect', async ({ page }) => {
    await page.goto('/mutasi')
    await expect(page).toHaveURL(/\/masuk\?redirect=(%2F|\/)mutasi$/)
  })

  test('kredensial salah → pesan umum tanpa membedakan No. HP/password', async ({ page }) => {
    await login(page, { no_hp: '089999999999', password: 'salah12345' })
    await expect(page.getByTestId('galat-login')).toContainText('No. HP atau password salah')
    await login(page, { no_hp: AKUN.lengkap.no_hp, password: 'salah12345' })
    await expect(page.getByTestId('galat-login')).toContainText('No. HP atau password salah')
    await expect(page.getByTestId('galat-login')).toContainText('Sisa percobaan')
  })

  test('validasi format No. HP', async ({ page }) => {
    await login(page, { no_hp: '12345', password: 'x' })
    await expect(page.getByText('Format No. HP tidak valid')).toBeVisible()
  })

  test('No. HP format +62 diterima, langsung ke beranda tanpa langkah wajib', async ({ page }) => {
    await login(page, { no_hp: '+62 812-3456-7891', password: AKUN.aktif.password })
    await expect(page).toHaveURL(/\/beranda$/)
    await page.goto('/masuk')
    await expect(page).toHaveURL(/\/beranda$/)
    await page.goto('/aktivasi')
    await expect(page).toHaveURL(/\/beranda$/)
  })

  test('tautan aktivasi & info lupa password', async ({ page }) => {
    await page.goto('/masuk')
    await page.getByRole('button', { name: 'Lupa password atau ganti nomor?' }).click()
    await expect(page.getByRole('dialog')).toContainText('reset akun IB')
    await page.getByRole('button', { name: 'Mengerti' }).click()
    await page.getByTestId('tautan-aktivasi').click()
    await expect(page).toHaveURL(/\/aktivasi$/)
  })
})

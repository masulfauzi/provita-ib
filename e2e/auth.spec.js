import { expect, test } from '@playwright/test'
import { AKUN, login } from './helpers'

test.describe('Login & ganti password wajib (#4)', () => {
  test('belum login → dialihkan ke /masuk dengan redirect', async ({ page }) => {
    await page.goto('/mutasi')
    await expect(page).toHaveURL(/\/masuk\?redirect=(%2F|\/)mutasi$/)
  })

  test('kredensial salah → pesan umum tanpa membedakan NIS/password', async ({ page }) => {
    await login(page, { nis: '99999', password: 'salah12345' })
    await expect(page.getByTestId('galat-login')).toContainText('NIS atau password salah')
    await login(page, { nis: '25041', password: 'salah12345' })
    await expect(page.getByTestId('galat-login')).toContainText('NIS atau password salah')
    await expect(page.getByTestId('galat-login')).toContainText('Sisa percobaan')
  })

  test('validasi: NIS hanya angka', async ({ page }) => {
    await login(page, { nis: '25o41', password: 'x' })
    await expect(page.getByText('NIS / No. Rekening hanya boleh berisi angka')).toBeVisible()
  })

  test('akun 25039 dipaksa ganti password dan tidak bisa membuka /beranda lewat URL', async ({
    page,
  }) => {
    await login(page, AKUN.baru)
    await expect(page).toHaveURL(/\/ganti-password$/)

    for (const url of ['/beranda', '/mutasi', '/profil', '/lengkapi-data', '/rekening/11']) {
      await page.goto(url)
      await expect(page).toHaveURL(/\/ganti-password$/)
    }

    // Aturan password ditampilkan sebagai checklist
    await page.locator('#password_lama').fill(AKUN.baru.password)
    await page.locator('#password').fill('25039')
    await expect(page.getByTestId('aturan-bukanNis')).toHaveAttribute('data-ok', 'false')
    await page.locator('#password').fill('Rahasia2026')
    for (const k of ['panjang', 'hurufAngka', 'bedaLama', 'bukanNis']) {
      await expect(page.getByTestId(`aturan-${k}`)).toHaveAttribute('data-ok', 'true')
    }
    await page.locator('#password_confirmation').fill('Rahasia2026')
    await page.getByRole('button', { name: /Ganti password/ }).click()

    await expect(page.getByText('Password berhasil diganti')).toBeVisible()
    await expect(page).toHaveURL(/\/lengkapi-data$/)
    await page.goto('/beranda')
    await expect(page).toHaveURL(/\/lengkapi-data$/)
  })

  test('tombol Keluar tersedia saat onboarding', async ({ page }) => {
    await login(page, AKUN.baru)
    await expect(page).toHaveURL(/\/ganti-password$/)
    await page.getByRole('button', { name: 'Keluar' }).click()
    await expect(page).toHaveURL(/\/masuk\?alasan=keluar/)
    await page.goto('/ganti-password')
    await expect(page).toHaveURL(/\/masuk/)
  })
})

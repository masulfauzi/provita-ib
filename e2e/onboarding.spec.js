import { expect, test } from '@playwright/test'
import { AKUN, login, pilihOpsi } from './helpers'

test('akun 25040 dipaksa lengkapi data → setelah simpan masuk beranda (#5)', async ({ page }) => {
  await login(page, AKUN.belumLengkap)
  await expect(page).toHaveURL(/\/lengkapi-data$/)
  await page.goto('/mutasi')
  await expect(page).toHaveURL(/\/lengkapi-data$/)

  // Data bagian A hanya baca
  await expect(page.getByText('Siti Nurhaliza')).toBeVisible()
  await expect(page.getByTestId('jenis-nasabah')).toHaveText('Siswa')

  // Kirim kosong → error per field
  await page.getByRole('button', { name: /Simpan & lanjut/ }).click()
  await expect(page.getByTestId('galat-form')).toBeVisible()
  await expect(page.getByText('Nama orang tua / wali wajib diisi')).toBeVisible()

  await page.locator('#tempat_lahir').fill('Semarang')
  await page.locator('#tanggal_lahir').fill('14/03/2008')
  await page.locator('#tanggal_lahir').press('Escape')
  await page.getByText('Perempuan', { exact: true }).click()
  await page.locator('#alamat_jalan').fill('Jl. Pandanaran No. 12')
  await page.locator('#rt').fill('2')
  await page.locator('#rw').fill('4')
  await page.locator('#kelurahan').fill('Mugassari')
  await page.locator('#kecamatan').fill('Semarang Selatan')
  await page.locator('#kota').fill('Kota Semarang')
  await page.locator('#kode_pos').fill('50249')
  await page.locator('#no_hp').fill('0812345')
  await page.locator('#wali_nama').fill('Ibu Rahayu')
  await pilihOpsi(page, page.locator('.p-select', { has: page.locator('#wali_hubungan') }), 'Ibu')
  await page.locator('#wali_hp').fill('081211112222')
  await page.locator('#persetujuan').check()

  await page.getByRole('button', { name: /Simpan & lanjut/ }).click()
  await expect(page.locator('#no_hp-error')).toContainText('diawali 08')

  // Draf tersimpan saat halaman di-refresh
  await page.reload()
  await expect(page.locator('#kelurahan')).toHaveValue('Mugassari')
  await page.locator('#no_hp').fill('081234567890')
  await page.locator('#persetujuan').check()
  await page.getByRole('button', { name: /Simpan & lanjut/ }).click()

  await expect(page).toHaveURL(/\/beranda$/)
  await expect(page.getByText('Selamat datang, Siti!')).toBeVisible()
  await expect(page.getByTestId('sapaan')).toHaveText('Halo, Siti')
  await page.goto('/lengkapi-data')
  await expect(page).toHaveURL(/\/beranda$/)
})

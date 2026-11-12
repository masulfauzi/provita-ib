import { expect, test } from '@playwright/test'
import { AKUN, login, pilihOpsi } from './helpers'

async function verifikasi(page, { identitas, no_rekening }) {
  await page.goto('/aktivasi')
  await page.locator('#identitas').fill(identitas)
  await page.locator('#no_rekening').fill(no_rekening)
  await page.getByRole('button', { name: 'Periksa data' }).click()
}

test('aktivasi siswa 2 langkah → login dengan No. HP baru', async ({ page }) => {
  // Data tidak cocok → pesan umum + sisa percobaan
  await verifikasi(page, { identitas: AKUN.belumAktivasi.identitas, no_rekening: '999' })
  await expect(page.getByTestId('galat-verifikasi')).toContainText('tidak cocok')
  await expect(page.getByTestId('galat-verifikasi')).toContainText('Sisa percobaan')

  // Cocok → konfirmasi "Apakah ini Anda?"
  await verifikasi(page, AKUN.belumAktivasi)
  await expect(page.getByTestId('nama-konfirmasi')).toHaveText(AKUN.belumAktivasi.nama)
  await page.getByTestId('lanjut-aktivasi').click()
  await expect(page).toHaveURL(/\/aktivasi\/data$/)
  await expect(page.getByTestId('sisa-waktu')).toContainText(/1[45]:\d{2}/)
  await expect(page.getByTestId('jenis-nasabah')).toContainText('Siswa')

  // Kirim kosong → error per field
  await page.getByRole('button', { name: 'Aktivasi akun' }).click()
  await expect(page.getByTestId('galat-form')).toBeVisible()
  await expect(page.getByText('Nama orang tua / wali wajib diisi')).toBeVisible()

  await page.locator('#tempat_lahir').fill('Semarang')
  await page.locator('#tanggal_lahir').fill('14/03/2008')
  await page.locator('#tanggal_lahir').press('Escape')
  await page.getByText('Laki-laki', { exact: true }).click()
  await page.locator('#alamat_jalan').fill('Jl. Pandanaran No. 12')
  await page.locator('#rt').fill('2')
  await page.locator('#rw').fill('4')
  await page.locator('#kelurahan').fill('Mugassari')
  await page.locator('#kecamatan').fill('Semarang Selatan')
  await page.locator('#kota').fill('Kota Semarang')
  await page.locator('#kode_pos').fill('50249')
  await page.locator('#wali_nama').fill('Ibu Rahayu')
  await pilihOpsi(page, page.locator('.p-select', { has: page.locator('#wali_hubungan') }), 'Ibu')
  await page.locator('#wali_hp').fill('081211112222')
  // No. HP sudah dipakai akun lain → error dari API
  await page.locator('#no_hp').fill(AKUN.lengkap.no_hp)
  await page.locator('#no_hp_confirmation').fill(AKUN.lengkap.no_hp)
  await page.locator('#password').fill('0090025039')
  await expect(page.getByTestId('aturan-bukanIdentitas')).toHaveAttribute('data-ok', 'false')
  await page.locator('#password').fill('Andi2026ok')
  for (const k of ['panjang', 'hurufAngka', 'bukanIdentitas']) {
    await expect(page.getByTestId(`aturan-${k}`)).toHaveAttribute('data-ok', 'true')
  }
  await page.locator('#password_confirmation').fill('Andi2026ok')
  await page.locator('#persetujuan').check()
  await page.getByRole('button', { name: 'Aktivasi akun' }).click()
  await expect(page.locator('#no_hp-error')).toHaveText('No. HP sudah dipakai akun lain.')

  // Draf (tanpa password) tersimpan saat halaman di-refresh
  await page.reload()
  await expect(page.locator('#kelurahan')).toHaveValue('Mugassari')
  await expect(page.locator('#password')).toHaveValue('')
  await page.locator('#no_hp').fill('0813 1111 2222')
  await page.locator('#no_hp_confirmation').fill('081311112222')
  await page.locator('#password').fill('Andi2026ok')
  await page.locator('#password_confirmation').fill('Andi2026ok')
  await page.locator('#persetujuan').check()
  await page.getByRole('button', { name: 'Aktivasi akun' }).click()

  // Tidak auto-login: ke halaman masuk dengan No. HP terisi
  await expect(page).toHaveURL(/\/masuk\?alasan=aktivasi$/)
  await expect(page.getByText('Aktivasi berhasil').first()).toBeVisible()
  await expect(page.locator('#no_hp')).toHaveValue('081311112222')
  await page.locator('#password').fill('Andi2026ok')
  await page.getByRole('button', { name: 'Masuk', exact: true }).click()
  await expect(page).toHaveURL(/\/beranda$/)
  await expect(page.getByTestId('sapaan')).toHaveText('Halo, Andi')
})

test('nasabah yang sudah aktivasi → diarahkan ke login (409)', async ({ page }) => {
  await verifikasi(page, { identitas: '0090025041', no_rekening: '1100325041' })
  await expect(page.getByTestId('sudah-aktivasi')).toContainText('Akun sudah diaktivasi')
  await page
    .getByTestId('sudah-aktivasi')
    .getByRole('link', { name: /Ke halaman masuk/ })
    .click()
  await expect(page).toHaveURL(/\/masuk$/)
})

test('guru: No. nasabah tanpa awalan diterima, wali opsional; langkah 2 tanpa verifikasi ditolak', async ({
  page,
}) => {
  await page.goto('/aktivasi/data')
  await expect(page).toHaveURL(/\/aktivasi$/)

  await verifikasi(page, { identitas: '4', no_rekening: AKUN.guru.no_rekening })
  await expect(page.getByTestId('nama-konfirmasi')).toContainText(AKUN.guru.nama)
  await page.getByRole('button', { name: 'Bukan saya' }).click()
  await expect(page.locator('#identitas')).toBeVisible()
  await page.getByRole('button', { name: 'Periksa data' }).click()
  await page.getByTestId('lanjut-aktivasi').click()
  await expect(page.getByTestId('bagian-wali')).toContainText('Opsional')
})

test('profil: ganti No. HP login', async ({ page }) => {
  await login(page, AKUN.lengkap)
  await expect(page).toHaveURL(/\/beranda$/)
  await page.goto('/profil')
  await expect(page.getByTestId('no-hp-login')).toHaveText(AKUN.lengkap.no_hp)
  await page.getByTestId('tombol-ganti-hp').click()
  await page.locator('#hp_baru').fill('085700001111')
  await page.locator('#hp_baru_ulang').fill('085700001111')
  await page.locator('#hp_password').fill('salah123')
  await page.getByRole('button', { name: 'Simpan No. HP' }).click()
  await expect(page.locator('#hp_password-error')).toHaveText('Password saat ini salah.')
  await page.locator('#hp_password').fill(AKUN.lengkap.password)
  await page.getByRole('button', { name: 'Simpan No. HP' }).click()
  await expect(page.getByText('No. HP berhasil diganti', { exact: true })).toBeVisible()
  await expect(page.getByTestId('no-hp-login')).toHaveText('085700001111')
})

/**
 * Aturan password nasabah (sama dengan API):
 * minimal 8 karakter, huruf dan angka, tidak sama dengan password lama (bila ada),
 * dan tidak sama dengan NIS/NISN, No. nasabah, nomor rekening, maupun No. HP.
 * @param {string} baru
 * @param {{ lama?: string|null, terlarang?: string[] }} konteks
 *   `lama` diisi (string) hanya pada form ganti password; `null`/tidak diisi = aturan "beda dari lama" tidak dipakai.
 */
export function aturanPassword(baru = '', { lama = null, terlarang = [] } = {}) {
  const daftar = terlarang.filter(Boolean).map((s) => String(s).trim().toLowerCase())
  const aturan = [
    { kode: 'panjang', label: 'Minimal 8 karakter', ok: baru.length >= 8 },
    {
      kode: 'hurufAngka',
      label: 'Mengandung huruf dan angka',
      ok: /[A-Za-z]/.test(baru) && /\d/.test(baru),
    },
  ]
  if (lama !== null && lama !== undefined) {
    aturan.push({
      kode: 'bedaLama',
      label: 'Tidak sama dengan password lama',
      ok: baru.length > 0 && baru !== lama,
    })
  }
  aturan.push({
    kode: 'bukanIdentitas',
    label: 'Tidak sama dengan NIS/NISN, No. HP, atau nomor rekening',
    ok: baru.length > 0 && !daftar.includes(baru.trim().toLowerCase()),
  })
  return aturan
}

export function passwordValid(baru, konteks) {
  return aturanPassword(baru, konteks).every((a) => a.ok)
}

/** Pesan error pertama yang belum terpenuhi (untuk validasi form), atau null. */
export function galatPassword(baru, konteks) {
  const gagal = aturanPassword(baru, konteks).find((a) => !a.ok)
  return gagal ? `Password: ${gagal.label.toLowerCase()}` : null
}

const LABEL_KEKUATAN = ['Sangat lemah', 'Lemah', 'Sedang', 'Kuat', 'Sangat kuat']

/** Skor 0–4 untuk indikator kekuatan password. */
export function kekuatanPassword(pw = '') {
  if (!pw) return { skor: 0, label: '' }
  let skor = 0
  if (pw.length >= 8) skor++
  if (pw.length >= 12) skor++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) skor++
  if (/\d/.test(pw) && /[A-Za-z]/.test(pw)) skor++
  if (/[^A-Za-z0-9]/.test(pw)) skor++
  if (pw.length < 8) skor = Math.min(skor, 1)
  if (/^(.)\1+$/.test(pw)) skor = 0
  skor = Math.min(skor, 4)
  return { skor, label: LABEL_KEKUATAN[skor] }
}

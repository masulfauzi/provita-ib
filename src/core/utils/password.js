/**
 * Aturan password baru nasabah (issue #4). Ditegakkan juga di API.
 * @param {string} baru
 * @param {{ lama?: string, nis?: string, noRekening?: string[] }} konteks
 */
export function aturanPassword(baru = '', { lama = '', nis = '', noRekening = [] } = {}) {
  const terlarang = [nis, ...noRekening].filter(Boolean).map(String)
  return [
    { kode: 'panjang', label: 'Minimal 8 karakter', ok: baru.length >= 8 },
    {
      kode: 'hurufAngka',
      label: 'Mengandung huruf dan angka',
      ok: /[A-Za-z]/.test(baru) && /\d/.test(baru),
    },
    {
      kode: 'bedaLama',
      label: 'Tidak sama dengan password lama',
      ok: baru.length > 0 && baru !== lama,
    },
    {
      kode: 'bukanNis',
      label: 'Tidak sama dengan NIS / nomor rekening',
      ok: baru.length > 0 && !terlarang.includes(baru),
    },
  ]
}

export function passwordValid(baru, konteks) {
  return aturanPassword(baru, konteks).every((a) => a.ok)
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

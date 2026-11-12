import { ensureCsrf, http } from '@/core/http/client'

/** POST /nasabah/aktivasi/cek — langkah 1 (NISN / No. nasabah + nomor rekening). */
export async function cekAktivasi({ identitas, no_rekening }) {
  await ensureCsrf()
  const { data } = await http.post(
    '/nasabah/aktivasi/cek',
    { identitas, no_rekening },
    { skipAuthRedirect: true },
  )
  return data.data
}

/** POST /nasabah/aktivasi — langkah 2 (data pribadi + No. HP + password). Tidak auto-login. */
export async function kirimAktivasi(payload) {
  await ensureCsrf()
  const { data } = await http.post('/nasabah/aktivasi', payload, { skipAuthRedirect: true })
  return { message: data.message, no_hp: data.data?.no_hp }
}

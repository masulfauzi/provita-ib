import { http } from '@/core/http/client'

/** GET /nasabah/profil — data pribadi + riwayat login (bila API menyediakan). */
export async function ambilProfil() {
  const { data } = await http.get('/nasabah/profil')
  return data.data
}

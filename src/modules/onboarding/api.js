import { http } from '@/core/http/client'

/** PUT /nasabah/profil — simpan data pribadi (set profil_lengkap = true di API). */
export async function simpanDataPribadi(payload) {
  const { data } = await http.put('/nasabah/profil', payload)
  return data.data
}

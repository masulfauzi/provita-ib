import { http } from '@/core/http/client'

export const PER_PAGE = 25

/** GET /nasabah/rekening (untuk pilihan rekening) */
export async function ambilDaftarRekening() {
  const { data } = await http.get('/nasabah/rekening')
  return data.data
}

/**
 * GET /nasabah/rekening/{id}/mutasi?dari=&sampai=&jenis=&page=&per_page=
 * @returns {Promise<{ data: object[], meta: object, ringkasan: object }>}
 */
export async function ambilMutasi(id, { dari, sampai, jenis, page = 1, perPage = PER_PAGE }) {
  const params = { dari, sampai, page, per_page: perPage }
  if (jenis && jenis !== 'semua') params.jenis = jenis
  const { data } = await http.get(`/nasabah/rekening/${id}/mutasi`, { params })
  return data
}

/** GET /nasabah/rekening/{id}/mutasi.pdf?dari=&sampai= — PDF dibuat oleh API. */
export async function unduhRekeningKoran(id, { dari, sampai }) {
  const res = await http.get(`/nasabah/rekening/${id}/mutasi.pdf`, {
    params: { dari, sampai },
    responseType: 'blob',
    headers: { Accept: 'application/pdf' },
  })
  return res.data
}

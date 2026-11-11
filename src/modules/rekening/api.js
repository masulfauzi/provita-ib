import { http } from '@/core/http/client'

/** GET /nasabah/rekening → { data: Rekening[], meta: { saldo_per } } */
export async function ambilDaftarRekening() {
  const { data } = await http.get('/nasabah/rekening')
  return data
}

/** GET /nasabah/rekening/{id} */
export async function ambilRekening(id) {
  const { data } = await http.get(`/nasabah/rekening/${id}`)
  return data
}

/** N transaksi terakhir dari endpoint mutasi (rentang default API = 3 bulan terakhir). */
export async function ambilTransaksiTerakhir(id, jumlah = 5) {
  const { data } = await http.get(`/nasabah/rekening/${id}/mutasi`, {
    params: { page: 1, per_page: jumlah },
  })
  return data.data
}

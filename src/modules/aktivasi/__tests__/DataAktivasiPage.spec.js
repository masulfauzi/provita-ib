import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { siapkanGlobal, tunggu } from '@/test-utils'
import { useAktivasiStore } from '../store'
import DataAktivasiPage from '../pages/DataAktivasiPage.vue'

const replace = vi.fn()
vi.mock('vue-router', () => ({ useRouter: () => ({ replace }) }))
vi.mock('../api', () => ({
  kirimAktivasi: vi
    .fn()
    .mockResolvedValue({ message: 'Aktivasi berhasil.', no_hp: '081311112222' }),
}))

function hasilCek(jenis, menit = 15) {
  return {
    nama: 'Andi Pratama',
    kelas: jenis === 'siswa' ? 'X PPLG 2' : null,
    jenis_nasabah: jenis,
    wajib_wali: jenis === 'siswa',
    berlaku_sampai: new Date(Date.now() + menit * 60_000).toISOString(),
    identitas: '0090025039',
    no_rekening: '1100125039',
  }
}

function pasang(jenis, menit) {
  const { plugins } = siapkanGlobal()
  const store = useAktivasiStore()
  if (jenis) store.simpan(hasilCek(jenis, menit))
  return mount(DataAktivasiPage, { global: { plugins }, attachTo: document.body })
}

async function isiWajib(w) {
  const isian = {
    tempat_lahir: 'Semarang',
    alamat_jalan: 'Jl. Sidodadi 8',
    rt: '3',
    rw: '5',
    kelurahan: 'Karangkidul',
    kecamatan: 'Semarang Tengah',
    kota: 'Semarang',
    kode_pos: '50136',
    no_hp: '0813-1111-2222',
    no_hp_confirmation: '081311112222',
    password: 'Andi2026ok',
    password_confirmation: 'Andi2026ok',
  }
  for (const [id, v] of Object.entries(isian)) await w.get(`#${id}`).setValue(v)
  await w.get('#jk-l').setValue(true)
  await w.get('#persetujuan').setValue(true)
  w.findComponent({ name: 'DatePicker' }).vm.$emit('update:modelValue', new Date(2008, 2, 14))
  await flushPromises()
}

describe('DataAktivasiPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('tanpa hasil verifikasi → kembali ke langkah 1', async () => {
    const w = pasang(null)
    await flushPromises()
    expect(replace).toHaveBeenCalledWith({ name: 'aktivasi' })
    w.unmount()
  })

  it('siswa: field wali wajib', async () => {
    const w = pasang('siswa')
    const { kirimAktivasi } = await import('../api')
    expect(w.get('[data-testid="bagian-wali"]').text()).toContain('Wajib untuk siswa')
    expect(w.get('[data-testid="info-id-login"]').text()).toContain('ID login')
    await isiWajib(w)
    await w.get('form').trigger('submit')
    await tunggu()
    expect(kirimAktivasi).not.toHaveBeenCalled()
    expect(w.text()).toContain('Nama orang tua / wali wajib diisi')
    w.unmount()
  })

  it('guru: terkirim dengan No. HP dinormalisasi, lalu ke login dengan No. HP terisi', async () => {
    const w = pasang('guru')
    const { kirimAktivasi } = await import('../api')
    expect(w.get('[data-testid="bagian-wali"]').text()).toContain('Opsional')
    await isiWajib(w)
    await w.get('form').trigger('submit')
    await tunggu()
    expect(kirimAktivasi).toHaveBeenCalledWith(
      expect.objectContaining({
        tanggal_lahir: '2008-03-14',
        no_hp: '081311112222',
        no_hp_confirmation: '081311112222',
        password: 'Andi2026ok',
        persetujuan: true,
        wali_nama: null,
      }),
    )
    expect(replace).toHaveBeenCalledWith({
      name: 'masuk',
      query: { alasan: 'aktivasi' },
      state: { noHp: '081311112222' },
    })
    expect(useAktivasiStore().hasil).toBeNull()
    w.unmount()
  })

  it('403 VERIFIKASI_DIPERLUKAN → kembali ke langkah 1 dengan pesan', async () => {
    const w = pasang('guru')
    const { kirimAktivasi } = await import('../api')
    kirimAktivasi.mockRejectedValueOnce({
      tipe: 'terlarang',
      kode: 'VERIFIKASI_DIPERLUKAN',
      message: 'Sesi aktivasi sudah kedaluwarsa.',
    })
    await isiWajib(w)
    await w.get('form').trigger('submit')
    await tunggu()
    expect(replace).toHaveBeenCalledWith({ name: 'aktivasi' })
    expect(useAktivasiStore().pesan).toBe('Sesi aktivasi sudah kedaluwarsa.')
    w.unmount()
  })

  it('error 422 dari API ditampilkan per field', async () => {
    const w = pasang('guru')
    const { kirimAktivasi } = await import('../api')
    kirimAktivasi.mockRejectedValueOnce({
      tipe: 'validasi',
      fieldErrors: { no_hp: 'No. HP sudah dipakai akun lain.' },
    })
    await isiWajib(w)
    await w.get('form').trigger('submit')
    await tunggu()
    expect(w.get('#no_hp-error').text()).toBe('No. HP sudah dipakai akun lain.')
    w.unmount()
  })

  it('waktu aktivasi habis → tombol kirim nonaktif dan ajakan ulangi verifikasi', async () => {
    const w = pasang('guru', -1)
    await flushPromises()
    expect(w.find('[data-testid="aktivasi-kedaluwarsa"]').exists()).toBe(true)
    expect(w.get('button[type="submit"]').attributes('disabled')).toBeDefined()
    w.unmount()
  })
})

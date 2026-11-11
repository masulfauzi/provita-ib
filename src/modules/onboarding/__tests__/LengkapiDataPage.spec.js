import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { siapkanGlobal, tunggu } from '@/test-utils'
import { useAuthStore } from '@/core/stores/auth'
import LengkapiDataPage from '../pages/LengkapiDataPage.vue'

const replace = vi.fn()
vi.mock('vue-router', () => ({ useRouter: () => ({ replace }) }))
vi.mock('../api', () => ({ simpanDataPribadi: vi.fn().mockResolvedValue({}) }))

function pasang(jenis) {
  const { plugins } = siapkanGlobal()
  const auth = useAuthStore()
  auth.user = { nis: '25040', nama: 'Siti Nurhaliza', kelas: 'XI AKL 1', jenis_nasabah: jenis }
  return { w: mount(LengkapiDataPage, { global: { plugins }, attachTo: document.body }), auth }
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
    no_hp: '081234567890',
  }
  for (const [id, v] of Object.entries(isian)) await w.get(`#${id}`).setValue(v)
  await w.get('#jk-p').setValue(true)
  await w.get('#persetujuan').setValue(true)
  // DatePicker: set lewat komponen
  const dp = w.findComponent({ name: 'DatePicker' })
  dp.vm.$emit('update:modelValue', new Date(2008, 2, 14))
  await flushPromises()
}

describe('LengkapiDataPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('siswa: field wali wajib', async () => {
    const { w } = pasang('siswa')
    const { simpanDataPribadi } = await import('../api')
    expect(w.get('[data-testid="bagian-wali"]').text()).toContain('Wajib untuk siswa')
    await isiWajib(w)
    await w.get('form').trigger('submit')
    await tunggu()
    expect(simpanDataPribadi).not.toHaveBeenCalled()
    expect(w.text()).toContain('Nama orang tua / wali wajib diisi')
    expect(w.text()).toContain('No. HP orang tua / wali wajib diisi')
    w.unmount()
  })

  it('guru: field wali tidak wajib, data tersimpan dan menuju beranda', async () => {
    const { w, auth } = pasang('guru')
    const { simpanDataPribadi } = await import('../api')
    expect(w.get('[data-testid="bagian-wali"]').text()).toContain('Opsional')
    await isiWajib(w)
    await w.get('form').trigger('submit')
    await tunggu()
    expect(simpanDataPribadi).toHaveBeenCalledWith(
      expect.objectContaining({
        tanggal_lahir: '2008-03-14',
        no_hp: '081234567890',
        wali_nama: null,
      }),
    )
    expect(auth.profilLengkap).toBe(true)
    expect(replace).toHaveBeenCalledWith({ name: 'beranda' })
    w.unmount()
  })

  it('format No. HP divalidasi', async () => {
    const { w } = pasang('guru')
    await isiWajib(w)
    await w.get('#no_hp').setValue('12345')
    await w.get('form').trigger('submit')
    await tunggu()
    expect(w.get('#no_hp-error').text()).toMatch(/diawali 08/)
    w.unmount()
  })
})

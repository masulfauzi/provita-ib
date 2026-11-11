import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { siapkanGlobal, tunggu } from '@/test-utils'
import { useAuthStore } from '@/core/stores/auth'
import PasswordForm from '../PasswordForm.vue'

vi.mock('@/core/http/client', () => ({
  http: { get: vi.fn(), post: vi.fn(), put: vi.fn().mockResolvedValue({ data: {} }) },
  ensureCsrf: vi.fn(),
}))

function pasang() {
  const { plugins } = siapkanGlobal()
  const auth = useAuthStore()
  auth.user = { nis: '25039', nomor_rekening: ['1100125039'], wajib_ganti_password: true }
  auth.wajibGantiPassword = true
  const w = mount(PasswordForm, { global: { plugins }, attachTo: document.body })
  return { w, auth }
}
const aturan = (w, kode) => w.get(`[data-testid="aturan-${kode}"]`).attributes('data-ok')
async function isi(w, id, nilai) {
  await w.get(`#${id}`).setValue(nilai)
  await flushPromises()
}

describe('PasswordForm', () => {
  beforeEach(() => vi.clearAllMocks())

  it('checklist mengikuti tiap aturan', async () => {
    const { w } = pasang()
    await isi(w, 'password_lama', 'rahasia123')

    await isi(w, 'password', 'abc')
    expect(aturan(w, 'panjang')).toBe('false')
    expect(aturan(w, 'hurufAngka')).toBe('false')

    await isi(w, 'password', 'abcdefgh')
    expect(aturan(w, 'panjang')).toBe('true')
    expect(aturan(w, 'hurufAngka')).toBe('false')

    await isi(w, 'password', 'rahasia123')
    expect(aturan(w, 'hurufAngka')).toBe('true')
    expect(aturan(w, 'bedaLama')).toBe('false')

    await isi(w, 'password', '1100125039')
    expect(aturan(w, 'bukanNis')).toBe('false')

    await isi(w, 'password', 'Provita2026')
    for (const k of ['panjang', 'hurufAngka', 'bedaLama', 'bukanNis'])
      expect(aturan(w, k)).toBe('true')
    expect(w.get('[data-testid="kekuatan-label"]').text()).not.toBe('—')
    w.unmount()
  })

  it('tidak mengirim bila aturan belum terpenuhi / ulangi tidak sama', async () => {
    const { w } = pasang()
    const { http } = await import('@/core/http/client')
    await isi(w, 'password_lama', 'rahasia123')
    await isi(w, 'password', 'abcdefgh')
    await isi(w, 'password_confirmation', 'abcdefgh')
    await w.get('form').trigger('submit')
    await tunggu()
    expect(http.put).not.toHaveBeenCalled()
    expect(w.text()).toContain('mengandung huruf dan angka')

    await isi(w, 'password', 'Provita2026')
    await isi(w, 'password_confirmation', 'Provita2025')
    await w.get('form').trigger('submit')
    await tunggu()
    expect(http.put).not.toHaveBeenCalled()
    expect(w.text()).toContain('tidak sama')
    w.unmount()
  })

  it('sukses → memanggil API, flag wajib turun, emit berhasil', async () => {
    const { w, auth } = pasang()
    const { http } = await import('@/core/http/client')
    await isi(w, 'password_lama', 'rahasia123')
    await isi(w, 'password', 'Provita2026')
    await isi(w, 'password_confirmation', 'Provita2026')
    await w.get('form').trigger('submit')
    await tunggu()
    expect(http.put).toHaveBeenCalledWith('/nasabah/password', {
      password_lama: 'rahasia123',
      password: 'Provita2026',
      password_confirmation: 'Provita2026',
    })
    expect(auth.wajibGantiPassword).toBe(false)
    expect(w.emitted('berhasil')).toHaveLength(1)
    w.unmount()
  })

  it('error 422 dari API ditampilkan di field', async () => {
    const { w } = pasang()
    const { http } = await import('@/core/http/client')
    http.put.mockRejectedValueOnce({
      tipe: 'validasi',
      fieldErrors: { password_lama: 'Password saat ini salah.' },
    })
    await isi(w, 'password_lama', 'salah123')
    await isi(w, 'password', 'Provita2026')
    await isi(w, 'password_confirmation', 'Provita2026')
    await w.get('form').trigger('submit')
    await tunggu()
    expect(w.get('#password_lama-error').text()).toBe('Password saat ini salah.')
    w.unmount()
  })
})

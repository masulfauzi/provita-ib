import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick } from 'vue'
import { useAutoLogout } from '../useAutoLogout'

describe('useAutoLogout', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  function pasang() {
    const onLogout = vi.fn()
    const scope = effectScope()
    const api = scope.run(() => useAutoLogout({ onLogout }))
    return { onLogout, scope, ...api }
  }

  it('diam 10 menit → peringatan di menit ke-9, lalu keluar otomatis', async () => {
    const { onLogout, tampil, sisa, scope } = pasang()
    await vi.advanceTimersByTimeAsync(9 * 60 * 1000 - 1000)
    await nextTick()
    expect(tampil.value).toBe(false)

    await vi.advanceTimersByTimeAsync(2000)
    await nextTick()
    expect(tampil.value).toBe(true)
    expect(sisa.value).toBeGreaterThan(50)
    expect(onLogout).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(60 * 1000)
    expect(onLogout).toHaveBeenCalledTimes(1)
    expect(tampil.value).toBe(false)
    scope.stop()
  })

  it('"Tetap masuk" membatalkan hitung mundur', async () => {
    const { onLogout, tampil, tetapMasuk, scope } = pasang()
    await vi.advanceTimersByTimeAsync(9 * 60 * 1000 + 1000)
    await nextTick()
    expect(tampil.value).toBe(true)
    tetapMasuk()
    await vi.advanceTimersByTimeAsync(70 * 1000)
    expect(onLogout).not.toHaveBeenCalled()
    scope.stop()
  })

  it('aktivitas pengguna mereset waktu diam', async () => {
    const { tampil, scope } = pasang()
    await vi.advanceTimersByTimeAsync(8 * 60 * 1000)
    window.dispatchEvent(new Event('mousemove'))
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000)
    await nextTick()
    expect(tampil.value).toBe(false)
    scope.stop()
  })
})

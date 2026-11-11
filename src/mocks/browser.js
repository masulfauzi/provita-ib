import { setupWorker } from 'msw/browser'
import { handlers, skenario } from './handlers'

/** Jalankan Mock Service Worker (hanya bila VITE_USE_MOCK=true). */
export async function mulaiMock() {
  skenario() // simpan ?mock=… dari URL awal
  const worker = setupWorker(...handlers)
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
    quiet: true,
  })
  return worker
}

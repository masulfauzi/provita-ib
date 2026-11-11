/**
 * Plugin Pinia: mencatat state awal setiap store (termasuk setup store) agar semua
 * store bisa dikosongkan sekaligus saat logout.
 */
const terdaftar = new Map()

function salin(v) {
  return v === undefined ? v : JSON.parse(JSON.stringify(v))
}

export function resetPlugin({ store }) {
  terdaftar.set(store, salin(store.$state))
}

/** Kembalikan satu store ke state awalnya. */
export function resetStore(store) {
  const awal = terdaftar.get(store)
  if (!awal) return
  for (const k of Object.keys(awal)) {
    store.$state[k] = salin(awal[k])
  }
}

export function resetSemuaStore() {
  terdaftar.forEach((_awal, store) => resetStore(store))
}

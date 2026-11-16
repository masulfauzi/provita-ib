/** Label & ikon kategori transaksi (dipakai beranda, detail rekening, dan mutasi). */
export const KATEGORI = {
  setoran_tunai: { label: 'Setoran tunai', ikon: 'pi pi-arrow-down-left' },
  penarikan_tunai: { label: 'Penarikan tunai', ikon: 'pi pi-arrow-up-right' },
  bunga: { label: 'Bunga', ikon: 'pi pi-percentage' },
  biaya_admin: { label: 'Biaya administrasi', ikon: 'pi pi-receipt' },
  pindah_buku: { label: 'Pindah buku', ikon: 'pi pi-arrow-right-arrow-left' },
  penutupan: { label: 'Penutupan rekening', ikon: 'pi pi-lock' },
  koreksi: { label: 'Koreksi', ikon: 'pi pi-replay' },
}

export function infoKategori(kategori) {
  return KATEGORI[kategori] || { label: 'Transaksi', ikon: 'pi pi-wallet' }
}

/** Produk rekening: label, warna badge, ikon. */
export const PRODUK = {
  reguler: {
    label: 'Tabungan Reguler',
    ikon: 'pi pi-wallet',
    badge: 'bg-primary-soft-strong text-primary-hover',
    aksen: 'bg-primary',
  },
  berjangka: {
    label: 'Tabungan Berjangka',
    ikon: 'pi pi-calendar-clock',
    badge: 'bg-ungu-soft text-ungu-ink',
    aksen: 'bg-ungu-ink',
  },
  deposito: {
    label: 'Deposito',
    ikon: 'pi pi-building-columns',
    badge: 'bg-warning-soft text-warning-ink',
    aksen: 'bg-warning-ink',
  },
}

export function infoProduk(produk) {
  return (
    PRODUK[produk] || {
      label: produk,
      ikon: 'pi pi-wallet',
      badge: 'bg-hairline text-muted',
      aksen: 'bg-muted',
    }
  )
}

export const STATUS_REKENING = {
  aktif: { label: 'Aktif', nada: 'sukses' },
  jatuh_tempo: { label: 'Jatuh tempo', nada: 'peringatan' },
  ditutup: { label: 'Ditutup', nada: 'netral' },
}

export function infoStatus(status) {
  return STATUS_REKENING[status] || { label: status, nada: 'netral' }
}

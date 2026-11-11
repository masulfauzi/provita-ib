/**
 * Pembuat PDF teks sederhana untuk mock rekening koran (hanya karakter ASCII).
 * Di produksi, PDF dibuat oleh API Laravel.
 */
function bersihkan(s) {
  return String(s)
    .replace(/[−]/g, '-')
    .replace(/[^\x20-\x7e]/g, '')
    .replace(/([\\()])/g, '\\$1')
}

export function buatPdf(baris) {
  const perHalaman = 48
  const halaman = []
  for (let i = 0; i < Math.max(baris.length, 1); i += perHalaman)
    halaman.push(baris.slice(i, i + perHalaman))

  const objek = []
  const tambah = (isi) => {
    objek.push(isi)
    return objek.length
  }
  const katalog = tambah(null)
  const pages = tambah(null)
  const font = tambah('<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>')
  const kids = []
  halaman.forEach((isiHalaman) => {
    const teks = isiHalaman
      .map((b, i) => `BT /F1 9 Tf 40 ${800 - i * 16} Td (${bersihkan(b)}) Tj ET`)
      .join('\n')
    const konten = tambah(`<< /Length ${teks.length} >>\nstream\n${teks}\nendstream`)
    kids.push(
      tambah(
        `<< /Type /Page /Parent ${pages} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${font} 0 R >> >> /Contents ${konten} 0 R >>`,
      ),
    )
  })
  objek[katalog - 1] = `<< /Type /Catalog /Pages ${pages} 0 R >>`
  objek[pages - 1] =
    `<< /Type /Pages /Kids [${kids.map((k) => `${k} 0 R`).join(' ')}] /Count ${kids.length} >>`

  let out = '%PDF-1.4\n'
  const offset = []
  objek.forEach((isi, i) => {
    offset.push(out.length)
    out += `${i + 1} 0 obj\n${isi}\nendobj\n`
  })
  const xref = out.length
  out += `xref\n0 ${objek.length + 1}\n0000000000 65535 f \n`
  offset.forEach((o) => {
    out += `${String(o).padStart(10, '0')} 00000 n \n`
  })
  out += `trailer\n<< /Size ${objek.length + 1} /Root ${katalog} 0 R >>\nstartxref\n${xref}\n%%EOF`
  return new TextEncoder().encode(out)
}

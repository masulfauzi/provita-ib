import { z } from 'zod'

export const POLA_HP = /^08\d{8,11}$/
const wajib = (label) =>
  z
    .string({ required_error: `${label} wajib diisi` })
    .trim()
    .min(1, `${label} wajib diisi`)
const pesanHp = 'No. HP harus diawali 08 dan terdiri dari 10–13 digit'

/**
 * Schema form data pribadi. Kontak orang tua/wali wajib bila jenis nasabah = siswa.
 * @param {'siswa'|'guru'|'karyawan'} jenisNasabah
 */
export function buatSchemaDataPribadi(jenisNasabah) {
  const wajibWali = jenisNasabah === 'siswa'
  return z.object({
    tempat_lahir: wajib('Tempat lahir'),
    tanggal_lahir: z
      .date({
        required_error: 'Tanggal lahir wajib diisi',
        invalid_type_error: 'Tanggal lahir wajib diisi',
      })
      .refine((d) => d < new Date(), 'Tanggal lahir tidak valid'),
    jenis_kelamin: z.enum(['L', 'P'], {
      required_error: 'Pilih jenis kelamin',
      invalid_type_error: 'Pilih jenis kelamin',
    }),
    alamat_jalan: wajib('Alamat (jalan)'),
    rt: wajib('RT').regex(/^\d{1,3}$/, 'RT berupa angka (maks. 3 digit)'),
    rw: wajib('RW').regex(/^\d{1,3}$/, 'RW berupa angka (maks. 3 digit)'),
    kelurahan: wajib('Kelurahan'),
    kecamatan: wajib('Kecamatan'),
    kota: wajib('Kota/kabupaten'),
    kode_pos: wajib('Kode pos').regex(/^\d{5}$/, 'Kode pos terdiri dari 5 digit'),
    no_hp: wajib('No. HP / WhatsApp').regex(POLA_HP, pesanHp),
    email: z.string().trim().email('Format email tidak valid').optional().or(z.literal('')),
    wali_nama: wajibWali
      ? wajib('Nama orang tua / wali')
      : z.string().trim().optional().or(z.literal('')),
    wali_hubungan: wajibWali
      ? z.enum(['ayah', 'ibu', 'wali'], {
          required_error: 'Pilih hubungan',
          invalid_type_error: 'Pilih hubungan',
        })
      : z.enum(['ayah', 'ibu', 'wali']).optional().nullable(),
    wali_hp: wajibWali
      ? wajib('No. HP orang tua / wali').regex(POLA_HP, pesanHp)
      : z.string().trim().regex(POLA_HP, pesanHp).optional().or(z.literal('')),
    persetujuan: z.literal(true, {
      errorMap: () => ({ message: 'Anda harus menyetujui pernyataan ini' }),
    }),
  })
}

export const NILAI_AWAL = {
  tempat_lahir: '',
  tanggal_lahir: null,
  jenis_kelamin: null,
  alamat_jalan: '',
  rt: '',
  rw: '',
  kelurahan: '',
  kecamatan: '',
  kota: '',
  kode_pos: '',
  no_hp: '',
  email: '',
  wali_nama: '',
  wali_hubungan: null,
  wali_hp: '',
  persetujuan: false,
}

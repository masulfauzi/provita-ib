import { z } from 'zod'
import { normalisasiHp, POLA_HP } from '@/core/utils/format'
import { galatPassword } from '@/core/utils/password'

const wajib = (label) =>
  z
    .string({ required_error: `${label} wajib diisi` })
    .trim()
    .min(1, `${label} wajib diisi`)
const pesanHp = 'No. HP harus diawali 08 (atau +62) dan terdiri dari 10–13 digit'
const hpValid = (v) => POLA_HP.test(normalisasiHp(v))
/** Nilai kosong (null) tetap lolos tipe agar refine lain (konfirmasi) tetap dijalankan. */
const pilihan = (nilai, pesan) =>
  z
    .enum(nilai)
    .nullable()
    .refine((v) => v != null, pesan)

/** Langkah 1: NISN / No. nasabah + nomor rekening. */
export const schemaVerifikasi = z.object({
  identitas: wajib('NISN / No. nasabah').max(50, 'Maksimal 50 karakter'),
  no_rekening: wajib('Nomor rekening')
    .max(50, 'Maksimal 50 karakter')
    .regex(/^[\d\s.-]*$/, 'Nomor rekening hanya berisi angka'),
})

/**
 * Langkah 2: data pribadi + akun (No. HP login & password) + persetujuan.
 * @param {{ wajibWali: boolean, terlarang?: string[] }} opsi
 *   `terlarang`: identitas yang tidak boleh dipakai sebagai password (NISN, nomor rekening, …);
 *   No. HP yang diisi ikut ditambahkan otomatis.
 */
export function buatSchemaAktivasi({ wajibWali, terlarang = [] }) {
  return z
    .object({
      tempat_lahir: wajib('Tempat lahir'),
      tanggal_lahir: z
        .date({ invalid_type_error: 'Tanggal lahir wajib diisi' })
        .nullable()
        .refine((d) => d != null, 'Tanggal lahir wajib diisi')
        .refine((d) => d == null || d < new Date(), 'Tanggal lahir tidak valid'),
      jenis_kelamin: pilihan(['L', 'P'], 'Pilih jenis kelamin'),
      alamat_jalan: wajib('Alamat (jalan)'),
      rt: wajib('RT').regex(/^\d{1,3}$/, 'RT berupa angka (maks. 3 digit)'),
      rw: wajib('RW').regex(/^\d{1,3}$/, 'RW berupa angka (maks. 3 digit)'),
      kelurahan: wajib('Kelurahan'),
      kecamatan: wajib('Kecamatan'),
      kota: wajib('Kota/kabupaten'),
      kode_pos: wajib('Kode pos').regex(/^\d{5}$/, 'Kode pos terdiri dari 5 digit'),
      email: z.string().trim().email('Format email tidak valid').optional().or(z.literal('')),
      wali_nama: wajibWali
        ? wajib('Nama orang tua / wali')
        : z.string().trim().optional().or(z.literal('')),
      wali_hubungan: wajibWali
        ? pilihan(['ayah', 'ibu', 'wali'], 'Pilih hubungan')
        : z.enum(['ayah', 'ibu', 'wali']).optional().nullable(),
      wali_hp: wajibWali
        ? wajib('No. HP orang tua / wali').refine(hpValid, pesanHp)
        : z
            .string()
            .trim()
            .refine((v) => !v || hpValid(v), pesanHp)
            .optional(),
      no_hp: wajib('No. HP').refine(hpValid, pesanHp),
      no_hp_confirmation: wajib('Ulangi No. HP'),
      password: wajib('Password'),
      password_confirmation: wajib('Ulangi password'),
      persetujuan: z.boolean().refine((v) => v === true, 'Anda harus menyetujui pernyataan ini'),
    })
    .superRefine((v, ctx) => {
      const tambah = (path, message) =>
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message })
      if (v.no_hp_confirmation && normalisasiHp(v.no_hp) !== normalisasiHp(v.no_hp_confirmation)) {
        tambah('no_hp_confirmation', 'Ulangi No. HP tidak sama')
      }
      const galat =
        v.password &&
        galatPassword(v.password, { terlarang: [...terlarang, normalisasiHp(v.no_hp)] })
      if (galat) tambah('password', galat)
      if (v.password_confirmation && v.password !== v.password_confirmation) {
        tambah('password_confirmation', 'Ulangi password tidak sama')
      }
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
  email: '',
  wali_nama: '',
  wali_hubungan: null,
  wali_hp: '',
  no_hp: '',
  no_hp_confirmation: '',
  password: '',
  password_confirmation: '',
  persetujuan: false,
}

/** Field yang tidak boleh ikut disimpan di draf sessionStorage. */
export const FIELD_RAHASIA = ['password', 'password_confirmation', 'persetujuan']

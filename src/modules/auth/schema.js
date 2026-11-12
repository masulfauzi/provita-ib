import { z } from 'zod'
import { normalisasiHp, POLA_HP } from '@/core/utils/format'

export const schemaLogin = z.object({
  no_hp: z
    .string({ required_error: 'No. HP wajib diisi' })
    .trim()
    .min(1, 'No. HP wajib diisi')
    .refine(
      (v) => POLA_HP.test(normalisasiHp(v)),
      'Format No. HP tidak valid (contoh: 081234567890)',
    ),
  password: z.string({ required_error: 'Password wajib diisi' }).min(1, 'Password wajib diisi'),
})

import { z } from 'zod'

export const schemaLogin = z.object({
  nis: z
    .string({ required_error: 'NIS / No. Rekening wajib diisi' })
    .trim()
    .min(1, 'NIS / No. Rekening wajib diisi')
    .regex(/^\d+$/, 'NIS / No. Rekening hanya boleh berisi angka'),
  password: z.string({ required_error: 'Password wajib diisi' }).min(1, 'Password wajib diisi'),
})

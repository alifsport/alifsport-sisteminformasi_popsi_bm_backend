import { z } from 'zod';

const jenisKelaminEnum = z.enum(['Laki_laki', 'Perempuan']);
const sabukEnum = z.enum(['Belum_Sabuk', 'Merah_Strip_1', 'Merah_Strip_2', 'Merah_Strip_3', 'Biru_Polos', 'Biru_Strip_1', 'Biru_Strip_2', 'Biru_Strip_3', 'Hijau_Polos', 'Hijau_Strip_1', 'Hijau_Strip_2', 'Hijau_Strip_3']);
const sortOrderEnum = z.enum(['asc', 'desc']);

// ==================== CREATE SCHEMA ====================
export const createPelatihSchema = z.object({
  body: z.object({
    nama_lengkap: z
      .string()
      .min(3, 'Nama lengkap minimal 3 karakter')
      .max(100, 'Nama lengkap maksimal 100 karakter'),
    tempat_lahir: z
      .string()
      .min(2, 'Tempat lahir minimal 2 karakter')
      .max(50, 'Tempat lahir maksimal 50 karakter'),
    tanggal_lahir: z.string().min(1, 'Tanggal lahir wajib diisi').refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, 'Format tanggal lahir tidak valid'),
    jenis_kelamin: jenisKelaminEnum,
    alamat: z.string().min(5, 'Alamat minimal 5 karakter'),
    no_telepon: z
      .string()
      .min(10, 'No telepon minimal 10 karakter')
      .max(15, 'No telepon maksimal 15 karakter')
      .regex(/^[\d+]+$/, 'No telepon harus berisi angka'),
    email: z.string().email('Format email tidak valid'),
    foto_url: z.string().url('URL foto tidak valid').optional().nullable(),
    email_pribadi: z.string().email('Format email tidak valid').optional().nullable(),
    sabuk: sabukEnum,
    tempat_melatih_id: z.string().uuid('ID tempat melatih tidak valid').optional().nullable(),
    tanggal_gabung: z.string().min(1, 'Tanggal gabung wajib diisi').refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, 'Format tanggal gabung tidak valid'),
  }),
});

// ==================== UPDATE SCHEMA ====================
export const updatePelatihSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID pelatih tidak valid'),
  }),
  body: z
    .object({
      nama_lengkap: z
        .string()
        .min(3, 'Nama lengkap minimal 3 karakter')
        .max(100, 'Nama lengkap maksimal 100 karakter')
        .optional(),
      tempat_lahir: z
        .string()
        .min(2, 'Tempat lahir minimal 2 karakter')
        .max(50, 'Tempat lahir maksimal 50 karakter')
        .optional(),
      tanggal_lahir: z
        .string()
        .refine((val) => !isNaN(new Date(val).getTime()), {
          message: 'Format tanggal lahir tidak valid',
        })
        .optional(),
      jenis_kelamin: jenisKelaminEnum.optional(),
      alamat: z.string().min(5, 'Alamat minimal 5 karakter').optional(),
      no_telepon: z
        .string()
        .min(10, 'No telepon minimal 10 karakter')
        .max(15, 'No telepon maksimal 15 karakter')
        .regex(/^[\d+]+$/, 'No telepon harus berisi angka')
        .optional(),
      email: z.string().email('Format email tidak valid').optional(),
      foto_url: z.string().url('URL foto tidak valid').optional().nullable(),
      email_pribadi: z.string().email('Format email tidak valid').optional().nullable(),
      sabuk: sabukEnum.optional(),
      tempat_melatih_id: z.string().uuid().optional().nullable(),
      tanggal_gabung: z
        .string()
        .refine((val) => !isNaN(new Date(val).getTime()), {
          message: 'Format tanggal gabung tidak valid',
        })
        .optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Minimal satu field harus diisi',
    }),
});

// ==================== QUERY SCHEMA ====================
export const pelatihQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    lokasi: z.string().uuid('ID lokasi tidak valid').optional(),
    sort: z.string().optional(),
    order: sortOrderEnum.optional(),
  }),
});

// ==================== PARAMS SCHEMA ====================
export const pelatihParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID pelatih tidak valid'),
  }),
});

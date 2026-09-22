import { z } from 'zod';

const sabukEnum = z.enum([
  'Belum_Sabuk',
  'Merah_Strip_1',
  'Merah_Strip_2',
  'Merah_Strip_3',
  'Biru_Polos',
  'Biru_Strip_1',
  'Biru_Strip_2',
  'Biru_Strip_3',
  'Hijau_Polos',
  'Hijau_Strip_1',
  'Hijau_Strip_2',
  'Hijau_Strip_3',
]);
const jenisKelaminEnum = z.enum(['Laki_laki', 'Perempuan']);
const statusKeanggotaanEnum = z.enum(['Aktif', 'Tidak_Aktif', 'Pengurus', 'Pelatih']);

// ==================== Create Anggota ====================
export const createAnggotaSchema = z.object({
  body: z.object({
    nama_lengkap: z
      .string()
      .min(3, 'Nama lengkap minimal 3 karakter')
      .max(100, 'Nama lengkap maksimal 100 karakter'),
    tempat_lahir: z
      .string()
      .min(1, 'Tempat lahir wajib diisi')
      .max(50, 'Tempat lahir maksimal 50 karakter'),
    tanggal_lahir: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Format tanggal lahir tidak valid',
    }),
    jenis_kelamin: jenisKelaminEnum,
    no_telepon: z
      .string()
      .min(1, 'Nomor telepon wajib diisi')
      .max(15, 'Nomor telepon maksimal 15 karakter'),
    email_pribadi: z.string().email('Format email tidak valid').optional().nullable(),
    sabuk: sabukEnum,
    tanggal_gabung: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Format tanggal gabung tidak valid',
    }),
    status_keanggotaan: statusKeanggotaanEnum.default('Aktif'),
    tempat_latihan_pertama_id: z.preprocess(
      (val) => (val === '' || val === undefined ? null : val),
      z.string().uuid('Format ID tempat latihan tidak valid').optional().nullable()
    ),
    tempat_latihan_saat_ini_id: z.preprocess(
      (val) => (val === '' || val === undefined ? null : val),
      z.string().uuid('Format ID tempat latihan tidak valid').optional().nullable()
    ),
    pelatih_pertama_id: z.preprocess(
      (val) => (val === '' || val === undefined ? null : val),
      z.string().uuid('Format ID pelatih tidak valid').optional().nullable()
    ),
    pelatih_saat_ini_id: z.preprocess(
      (val) => (val === '' || val === undefined ? null : val),
      z.string().uuid('Format ID pelatih tidak valid').optional().nullable()
    ),
  }),
});

// ==================== Update Anggota ====================
export const updateAnggotaSchema = z.object({
  params: z.object({
    id: z.string().uuid('Format ID tidak valid'),
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
        .min(1, 'Tempat lahir wajib diisi')
        .max(50, 'Tempat lahir maksimal 50 karakter')
        .optional(),
      tanggal_lahir: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {
          message: 'Format tanggal lahir tidak valid',
        })
        .optional(),
      jenis_kelamin: jenisKelaminEnum.optional(),
      no_telepon: z
        .string()
        .min(1, 'Nomor telepon wajib diisi')
        .max(15, 'Nomor telepon maksimal 15 karakter')
        .optional(),
      email_pribadi: z.string().email('Format email tidak valid').optional().nullable(),
      sabuk: sabukEnum.optional(),
      tanggal_gabung: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {
          message: 'Format tanggal gabung tidak valid',
        })
        .optional(),
      status_keanggotaan: statusKeanggotaanEnum.optional(),
      tempat_latihan_pertama_id: z.preprocess(
        (val) => (val === '' || val === undefined ? null : val),
        z.string().uuid().optional().nullable()
      ),
      tempat_latihan_saat_ini_id: z.preprocess(
        (val) => (val === '' || val === undefined ? null : val),
        z.string().uuid().optional().nullable()
      ),
      pelatih_pertama_id: z.preprocess(
        (val) => (val === '' || val === undefined ? null : val),
        z.string().uuid().optional().nullable()
      ),
      pelatih_saat_ini_id: z.preprocess(
        (val) => (val === '' || val === undefined ? null : val),
        z.string().uuid().optional().nullable()
      ),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'Minimal satu field harus diisi',
    }),
});

// ==================== Query Params ====================
export const anggotaQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    sabuk: sabukEnum.optional(),
    status: statusKeanggotaanEnum.optional(),
    lokasi: z.string().uuid().optional(),
    tanggal_gabung_from: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Format tanggal tidak valid',
      })
      .optional(),
    tanggal_gabung_to: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Format tanggal tidak valid',
      })
      .optional(),
    sort: z
      .enum([
        'nama_lengkap',
        'sabuk',
        'tanggal_gabung',
        'status_keanggotaan',
        'created_at',
      ])
      .optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }),
});

// ==================== Get By ID ====================
export const anggotaIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Format ID tidak valid'),
  }),
});

// ==================== Archived Query ====================
export const archivedQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    sabuk: sabukEnum.optional(),
    status: statusKeanggotaanEnum.optional(),
    sort: z
      .enum([
        'nama_lengkap',
        'sabuk',
        'deleted_at',
        'status_keanggotaan',
      ])
      .optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }),
});

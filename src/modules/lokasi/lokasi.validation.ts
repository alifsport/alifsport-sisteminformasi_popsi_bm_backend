import { z } from 'zod';

export const createLokasiSchema = z.object({
  body: z.object({
    nama: z.string().min(1, 'Nama lokasi harus diisi').max(100, 'Nama maksimal 100 karakter'),
    alamat: z.string().optional(),
    kota: z.string().min(1, 'Kota/Kabupaten harus diisi').max(50, 'Kota maksimal 50 karakter'),
    provinsi: z.string().min(1, 'Provinsi harus diisi').max(50, 'Provinsi maksimal 50 karakter'),
    kecamatan: z.string().min(1, 'Kecamatan harus diisi').max(50, 'Kecamatan maksimal 50 karakter'),
    kelurahan: z.string().max(50, 'Kelurahan maksimal 50 karakter').optional(),
    desa: z.string().max(50, 'Desa maksimal 50 karakter').optional(),
    kode_pos: z.string().max(5, 'Kode pos maksimal 5 karakter').optional(),
    jam_operasional: z.string().min(1, 'Jam operasional harus diisi').max(255),
    kapasitas: z.coerce.number().int().positive('Kapasitas harus lebih dari 0'),
    pelatih_pj_id: z.string().uuid('ID Pelatih tidak valid').optional().nullable(),
    foto_urls: z.array(z.string().url('URL foto tidak valid')).optional(),
    status: z.enum(['Aktif', 'Tidak_Aktif', 'Maintenance']).optional().default('Aktif'),
  }),
});

export const updateLokasiSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID Lokasi tidak valid'),
  }),
  body: z.object({
    nama: z.string().min(1).max(100).optional(),
    alamat: z.string().min(1).optional(),
    kota: z.string().min(1).max(50).optional(),
    provinsi: z.string().min(1).max(50).optional(),
    kecamatan: z.string().min(1).max(50).optional(),
    kelurahan: z.string().max(50).optional(),
    desa: z.string().max(50).optional(),
    kode_pos: z.string().max(5).optional(),
    jam_operasional: z.string().min(1).max(255).optional(),
    kapasitas: z.coerce.number().int().positive().optional(),
    pelatih_pj_id: z.string().uuid().optional().nullable(),
    foto_urls: z.array(z.string().url()).optional(),
    status: z.enum(['Aktif', 'Tidak_Aktif', 'Maintenance']).optional(),
  }),
});

export const queryLokasiSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(500).optional().default(10),
    search: z.string().optional(),
    status: z.enum(['Aktif', 'Tidak_Aktif', 'Maintenance']).optional(),
    kota: z.string().optional(),
    pelatih_pj: z.string().uuid().optional(),
    sort: z.enum(['nama', 'kota', 'status', 'created_at', 'kapasitas']).optional().default('created_at'),
    order: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID Lokasi tidak valid'),
  }),
});

export const toggleStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID Lokasi tidak valid'),
  }),
});

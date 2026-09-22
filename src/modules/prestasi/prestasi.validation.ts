import { z } from 'zod';

// Create prestasi
export const createPrestasiSchema = z.object({
  body: z.object({
    nama_kejuaraan: z.string().min(1, 'Nama kejuaraan wajib diisi').max(200),
    tingkat: z.enum(['Club', 'Kabupaten', 'Provinsi', 'Nasional', 'Internasional']),
    tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    perolehan: z.string().min(1, 'Perolehan wajib diisi').max(100),
    kategori: z.string().min(1, 'Kategori wajib diisi').max(50),
    lokasi_kejuaraan: z.string().min(1, 'Lokasi kejuaraan wajib diisi').max(200),
    catatan: z.string().optional(),
    file_url: z.string().url('Invalid file URL format').optional(),
  }),
});

// Update prestasi
export const updatePrestasiSchema = z.object({
  body: z.object({
    nama_kejuaraan: z.string().min(1).max(200).optional(),
    tingkat: z.enum(['Club', 'Kabupaten', 'Provinsi', 'Nasional', 'Internasional']).optional(),
    tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    perolehan: z.string().min(1).max(100).optional(),
    kategori: z.string().min(1).max(50).optional(),
    lokasi_kejuaraan: z.string().min(1).max(200).optional(),
    catatan: z.string().optional(),
    file_url: z.string().url().optional(),
  }),
});

// Query params for list
export const prestasiQuerySchema = z.object({
  query: z.object({
    tingkat: z.enum(['Club', 'Kabupaten', 'Provinsi', 'Nasional', 'Internasional']).optional(),
    tahun: z.string().regex(/^\d{4}$/, 'Tahun must be a 4-digit year').optional(),
  }),
});

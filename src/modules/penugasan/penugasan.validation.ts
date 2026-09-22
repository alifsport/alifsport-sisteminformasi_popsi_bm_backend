import { z } from 'zod';

// Create penugasan
export const createPenugasanSchema = z.object({
  body: z.object({
    anggota_id: z.string().uuid('Invalid anggota ID format'),
    tempat_id: z.string().uuid('Invalid tempat ID format'),
    tanggal_mulai: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    alasan: z.string().optional(),
  }),
});

// Transfer penugasan
export const transferPenugasanSchema = z.object({
  body: z.object({
    anggota_id: z.string().uuid('Invalid anggota ID format'),
    tempat_id_baru: z.string().uuid('Invalid tempat ID format'),
    alasan: z.string().min(1, 'Alasan wajib diisi untuk transfer'),
  }),
});

// Query params for list
export const penugasanQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    lokasi_id: z.string().uuid().optional(),
    status: z.enum(['Aktif', 'Selesai', 'Dipindahkan']).optional(),
  }),
});

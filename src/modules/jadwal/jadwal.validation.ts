import { z } from 'zod';

// Create jadwal
export const createJadwalSchema = z.object({
  body: z.object({
    judul_materi: z.string().min(1, 'Judul materi wajib diisi').max(100),
    tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    jam_mulai: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, 'jam_mulai must be a valid datetime'),
    jam_selesai: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, 'jam_selesai must be a valid datetime'),
    tempat_id: z.string().uuid('Invalid tempat ID format'),
    pelatih_id: z.string().uuid('Invalid pelatih ID format').optional().nullable(),
    tipe_latihan: z.enum(['Rutin', 'Khusus', 'Ujian', 'Kejuaraan', 'Peringatan']),
    target_peserta: z.enum(['Semua_Anggota', 'Sabuk_Putih_Hijau', 'Sabuk_Biru_Hitam', 'Aturan_Khusus']),
    hari: z.string().optional().nullable(),
    catatan: z.string().optional().nullable(),
    seri_id: z.string().uuid().optional().nullable(),
    pengulangan: z.enum(['tidak', 'harian', 'mingguan', 'bulanan']).optional(),
  }),
});

// Update jadwal
export const updateJadwalSchema = z.object({
  body: z.object({
    judul_materi: z.string().min(1).max(100).optional(),
    tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    jam_mulai: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/).optional(),
    jam_selesai: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/).optional(),
    tempat_id: z.string().uuid().optional(),
    pelatih_id: z.string().uuid().optional(),
    tipe_latihan: z.enum(['Rutin', 'Khusus', 'Ujian', 'Kejuaraan', 'Peringatan']).optional(),
    target_peserta: z.enum(['Semua_Anggota', 'Sabuk_Putih_Hijau', 'Sabuk_Biru_Hitam', 'Aturan_Khusus']).optional(),
    catatan: z.string().optional(),
  }),
});

// Query params for list
export const jadwalQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    tanggal_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    tanggal_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    lokasi_id: z.string().uuid().optional(),
    pelatih_id: z.string().uuid().optional(),
    tipe: z.enum(['Rutin', 'Khusus', 'Ujian', 'Kejuaraan', 'Peringatan']).optional(),
    hari: z.string().optional(),
    status: z.enum(['Dijadwalkan', 'Berlangsung', 'Selesai', 'Dibatalkan']).optional(),
  }),
});

// Cancel jadwal
export const batalkanJadwalSchema = z.object({
  body: z.object({
    alasan: z.string().min(1, 'Alasan pembatalan wajib diisi'),
  }),
});

// Calendar query
export const kalenderQuerySchema = z.object({
  query: z.object({
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'start must be YYYY-MM-DD'),
    end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'end must be YYYY-MM-DD'),
  }),
});

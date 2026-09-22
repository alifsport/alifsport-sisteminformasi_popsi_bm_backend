import { z } from 'zod';

const presensiItemSchema = z.object({
  anggota_id: z.string().uuid(),
  status: z.enum(['Hadir', 'Sakit', 'Alpa', 'Terlambat']),
  keterangan: z.string().optional(),
});

export const inputPresensiSchema = z.object({
  body: z.object({
    jadwal_id: z.string().uuid(),
    tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal harus format YYYY-MM-DD'),
    presensi: z.array(presensiItemSchema).min(1, 'Minimal 1 data presensi'),
    catatan_umum: z.string().optional(),
  }),
});

export const updatePresensiSchema = z.object({
  body: z.object({
    status: z.enum(['Hadir', 'Izin', 'Alpa', 'Terlambat', 'Sakit']).optional(),
    keterangan: z.string().optional(),
    alasan_koreksi: z.string().min(1, 'Alasan koreksi wajib diisi'),
  }),
});

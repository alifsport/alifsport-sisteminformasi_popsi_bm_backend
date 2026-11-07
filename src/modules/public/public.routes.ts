import { Router, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { AuthRequest } from '../../types';

// Endpoint publik (TANPA autentikasi) untuk melihat absensi.
// Hanya menampilkan data yang aman: nama lokasi, jadwal, nama & status kehadiran.
// TIDAK menampilkan uang kas, no. telepon, atau data pribadi lain.
const router = Router();

// GET /api/public/lokasi — daftar lokasi aktif
router.get('/lokasi', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT id, nama, kota
      FROM tempat_latihan
      WHERE status = 'Aktif'
      ORDER BY nama`;
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
});

// GET /api/public/jadwal?lokasi_id= — jadwal per lokasi
router.get('/jadwal', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const lokasiId = req.query.lokasi_id as string;
    if (!lokasiId || !/^[0-9a-f-]{36}$/i.test(lokasiId)) {
      return res.status(400).json({ success: false, message: 'lokasi_id tidak valid' });
    }
    const rows = await prisma.$queryRaw<any[]>`
      SELECT id, judul_materi, hari, jam_mulai, jam_selesai, tipe_latihan
      FROM jadwal_latihan
      WHERE tempat_id = ${lokasiId}::uuid AND status != 'Dibatalkan'
      ORDER BY hari, jam_mulai`;
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
});

// GET /api/public/tanggal?jadwal_id= — tanggal-tanggal yang memiliki data absensi
router.get('/tanggal', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const jadwalId = req.query.jadwal_id as string;
    if (!jadwalId || !/^[0-9a-f-]{36}$/i.test(jadwalId)) {
      return res.status(400).json({ success: false, message: 'jadwal_id tidak valid' });
    }
    const rows = await prisma.$queryRaw<any[]>`
      SELECT tanggal,
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'Hadir')::int AS hadir,
        COUNT(*) FILTER (WHERE status = 'Sakit')::int AS sakit,
        COUNT(*) FILTER (WHERE status = 'Alpa')::int AS alpa,
        COUNT(*) FILTER (WHERE status = 'Terlambat')::int AS terlambat
      FROM presensi
      WHERE jadwal_id = ${jadwalId}::uuid
      GROUP BY tanggal
      ORDER BY tanggal DESC`;
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
});

// GET /api/public/absensi?jadwal_id=&tanggal=YYYY-MM-DD — data absensi per sesi
router.get('/absensi', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const jadwalId = req.query.jadwal_id as string;
    const tanggal = req.query.tanggal as string;
    if (!jadwalId || !/^[0-9a-f-]{36}$/i.test(jadwalId)) {
      return res.status(400).json({ success: false, message: 'jadwal_id tidak valid' });
    }
    if (!tanggal || !/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
      return res.status(400).json({ success: false, message: 'tanggal tidak valid (YYYY-MM-DD)' });
    }
    const rows = await prisma.$queryRaw<any[]>`
      SELECT a.id_anggota, a.nama_lengkap, a.sabuk, p.status, p.keterangan
      FROM presensi p
      JOIN anggota_profiles a ON a.id = p.anggota_id
      WHERE p.jadwal_id = ${jadwalId}::uuid AND p.tanggal = ${new Date(tanggal)}
      ORDER BY a.nama_lengkap`;
    res.json({ success: true, data: rows });
  } catch (e) { next(e); }
});

export default router;

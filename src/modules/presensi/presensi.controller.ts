import { Response, NextFunction } from 'express';
import { PresensiService } from './presensi.service';
import { AuthRequest } from '../../types';

export class PresensiController {

  // GET /presensi/anggota-by-lokasi/:lokasiId
  static async getAnggotaByLokasi(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { lokasiId } = req.params;
      const result = await PresensiService.getAnggotaByLokasi(lokasiId, req.user!.id, req.user!.role);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // POST /presensi
  static async inputPresensi(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { jadwal_id, presensi, tanggal, catatan_umum } = req.body;
      const result = await PresensiService.inputPresensi(jadwal_id, presensi, req.user!.id, req.user!.role, tanggal, catatan_umum);
      res.status(201).json({ success: true, message: 'Presensi berhasil disimpan', data: result });
    } catch (error) {
      next(error);
    }
  }

  // GET /presensi/jadwal/:jadwalId
  static async getByJadwal(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { jadwalId } = req.params;
      const { tanggal } = req.query;
      const result = await PresensiService.getByJadwal(jadwalId, tanggal as string);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // PUT /presensi/:id
  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await PresensiService.update(id, req.body, req.user!.id);
      res.json({ success: true, message: 'Presensi berhasil dikoreksi', data: result });
    } catch (error) {
      next(error);
    }
  }

  // GET /presensi/anggota/:anggotaId
  static async getByAnggota(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { anggotaId } = req.params;
      const result = await PresensiService.getByAnggota(anggotaId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // GET /presensi/rekap
  static async getRekap(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { lokasi_id, bulan, tahun } = req.query;
      const result = await PresensiService.getRekap({
        lokasi_id: lokasi_id as string,
        bulan: bulan ? parseInt(bulan as string) : undefined,
        tahun: tahun ? parseInt(tahun as string) : undefined,
      });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // GET /presensi/stats
  static async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await PresensiService.getStats();
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

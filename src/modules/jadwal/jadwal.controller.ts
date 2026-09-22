import { Response, NextFunction } from 'express';
import { JadwalService } from './jadwal.service';
import { AuthRequest } from '../../types';

export class JadwalController {
  // GET /api/jadwal
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, tanggal_from, tanggal_to, lokasi_id, pelatih_id, tipe, status } = req.query;
      const result = await JadwalService.getAll({
        page: page as string,
        limit: limit as string,
        tanggal_from: tanggal_from as string,
        tanggal_to: tanggal_to as string,
        lokasi_id: lokasi_id as string,
        pelatih_id: pelatih_id as string,
        tipe: tipe as string,
        status: status as string,
      });
      res.json({
        success: true,
        message: 'Daftar jadwal berhasil diambil',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/jadwal/kalender
  static async getKalender(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { start, end } = req.query;
      const jadwals = await JadwalService.getKalender(start as string, end as string);
      res.json({
        success: true,
        message: 'Data kalender berhasil diambil',
        data: jadwals,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/jadwal/saya
  static async getSaya(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const jadwals = await JadwalService.getSaya(req.user!.id, req.user!.role);
      res.json({
        success: true,
        message: 'Jadwal Anda berhasil diambil',
        data: jadwals,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/jadwal/:id
  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const jadwal = await JadwalService.getById(id);
      res.json({
        success: true,
        message: 'Detail jadwal berhasil diambil',
        data: jadwal,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/jadwal
  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const {
        judul_materi, tanggal, jam_mulai, jam_selesai,
        tempat_id, pelatih_id, tipe_latihan, target_peserta,
        hari, catatan, seri_id, pengulangan,
      } = req.body;
      const jadwals = await JadwalService.create({
        judul_materi,
        tanggal,
        jam_mulai,
        jam_selesai,
        tempat_id,
        pelatih_id,
        tipe_latihan,
        target_peserta,
        hari,
        catatan,
        seri_id,
        pengulangan,
        created_by: req.user!.id,
      });
      res.status(201).json({
        success: true,
        message: jadwals.length > 1
          ? `${jadwals.length} jadwal seri berhasil dibuat`
          : 'Jadwal berhasil dibuat',
        data: jadwals,
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/jadwal/:id
  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const {
        judul_materi, tanggal, jam_mulai, jam_selesai,
        tempat_id, pelatih_id, tipe_latihan, target_peserta,
        catatan,
      } = req.body;
      const jadwal = await JadwalService.update(id, {
        judul_materi,
        tanggal,
        jam_mulai,
        jam_selesai,
        tempat_id,
        pelatih_id,
        tipe_latihan,
        target_peserta,
        catatan,
      });
      res.json({
        success: true,
        message: 'Jadwal berhasil diupdate',
        data: jadwal,
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/jadwal/:id/batal
  static async batalkan(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { alasan } = req.body;
      const jadwal = await JadwalService.batalkan(id, alasan);
      res.json({
        success: true,
        message: 'Jadwal berhasil dibatalkan',
        data: jadwal,
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/jadwal/:id
  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await JadwalService.delete(id);
      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}

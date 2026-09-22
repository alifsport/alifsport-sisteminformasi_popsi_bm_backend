import { Response, NextFunction } from 'express';
import { PenugasanService } from './penugasan.service';
import { AuthRequest } from '../../types';

export class PenugasanController {
  // GET /api/penugasan
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { page, limit, lokasi_id, status } = req.query;
      const result = await PenugasanService.getAll({
        page: page as string,
        limit: limit as string,
        lokasi_id: lokasi_id as string,
        status: status as string,
      });
      res.json({
        success: true,
        message: 'Daftar penugasan berhasil diambil',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/penugasan/:id
  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const penugasan = await PenugasanService.getById(id);
      res.json({
        success: true,
        message: 'Detail penugasan berhasil diambil',
        data: penugasan,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/penugasan
  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { anggota_id, tempat_id, tanggal_mulai, alasan } = req.body;
      const penugasan = await PenugasanService.create({
        anggota_id,
        tempat_id,
        tanggal_mulai,
        alasan,
        created_by: req.user!.id,
      });
      res.status(201).json({
        success: true,
        message: 'Penugasan berhasil dibuat',
        data: penugasan,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/penugasan/transfer
  static async transfer(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { anggota_id, tempat_id_baru, alasan } = req.body;
      const penugasan = await PenugasanService.transfer({
        anggota_id,
        tempat_id_baru,
        alasan,
        created_by: req.user!.id,
      });
      res.status(201).json({
        success: true,
        message: 'Transfer penugasan berhasil dilakukan',
        data: penugasan,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/penugasan/riwayat/:anggotaId
  static async getRiwayat(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { anggotaId } = req.params;
      const riwayat = await PenugasanService.getRiwayat(anggotaId);
      res.json({
        success: true,
        message: 'Riwayat penugasan berhasil diambil',
        data: riwayat,
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/penugasan/:id
  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const penugasan = await PenugasanService.delete(id);
      res.json({
        success: true,
        message: 'Penugasan berhasil diakhiri',
        data: penugasan,
      });
    } catch (error) {
      next(error);
    }
  }
}

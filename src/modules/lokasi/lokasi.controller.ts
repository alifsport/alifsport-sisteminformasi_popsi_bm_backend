import { Request, Response, NextFunction } from 'express';
import { LokasiService } from './lokasi.service';
import { AuthRequest } from '../../types';

export class LokasiController {
  // GET /api/lokasi - List all lokasi
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, search, status, kota, pelatih_pj, sort, order } = req.query;

      const result = await LokasiService.getAll({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search as string,
        status: status as string,
        kota: kota as string,
        pelatih_pj: pelatih_pj as string,
        sort: sort as string,
        order: order as 'asc' | 'desc',
      });

      res.json({
        success: true,
        message: 'Daftar lokasi berhasil didapatkan',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/lokasi/stats - Get statistics
  static async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await LokasiService.getStats();

      res.json({
        success: true,
        message: 'Statistik lokasi berhasil didapatkan',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/lokasi/:id - Get lokasi detail
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      const lokasi = await LokasiService.getById(id);

      res.json({
        success: true,
        message: 'Detail lokasi berhasil didapatkan',
        data: lokasi,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/lokasi - Create lokasi
  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const lokasi = await LokasiService.create(req.body, req.user!.id);

      res.status(201).json({
        success: true,
        message: 'Lokasi berhasil dibuat',
        data: lokasi,
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/lokasi/:id - Update lokasi
  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      const lokasi = await LokasiService.update(id, req.body, req.user!.id);

      res.json({
        success: true,
        message: 'Lokasi berhasil diupdate',
        data: lokasi,
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/lokasi/:id - Delete lokasi
  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      await LokasiService.delete(id, req.user!.id);

      res.json({
        success: true,
        message: 'Lokasi berhasil dihapus',
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/lokasi/:id/status - Toggle status
  static async toggleStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      const lokasi = await LokasiService.toggleStatus(id, req.user!.id);

      res.json({
        success: true,
        message: `Status lokasi berhasil diubah ke ${lokasi.status}`,
        data: lokasi,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/lokasi/:id/anggota - Get anggota in lokasi
  static async getAnggota(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { page, limit, search } = req.query;

      const result = await LokasiService.getAnggota(id, {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search as string,
      });

      res.json({
        success: true,
        message: 'Daftar anggota lokasi berhasil didapatkan',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/lokasi/:id/jadwal - Get jadwal in lokasi
  static async getJadwal(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { page, limit, status } = req.query;

      const result = await LokasiService.getJadwal(id, {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        status: status as string,
      });

      res.json({
        success: true,
        message: 'Daftar jadwal lokasi berhasil didapatkan',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
}

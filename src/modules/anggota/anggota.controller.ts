import { Response, NextFunction } from 'express';
import { AnggotaService } from './anggota.service';
import { AuthRequest } from '../../types';

export class AnggotaController {
  // GET /api/anggota - List all anggota (paginated)
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await AnggotaService.getAll(req.query);
      res.json({
        success: true,
        message: 'Daftar anggota berhasil diambil',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/anggota/stats - Statistics
  static async getStats(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await AnggotaService.getStats();
      res.json({
        success: true,
        message: 'Statistik anggota berhasil diambil',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/anggota/archived - List archived (soft-deleted) anggota
  static async getArchived(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await AnggotaService.getArchived(req.query);
      res.json({
        success: true,
        message: 'Daftar anggota terarsipkan berhasil diambil',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/anggota/export - Export anggota data
  static async getExport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await AnggotaService.getExport(req.query);
      res.json({
        success: true,
        message: 'Export data anggota berhasil',
        data,
        total: data.length,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/anggota/:id - Detail anggota
  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const anggota = await AnggotaService.getById(id);
      res.json({
        success: true,
        message: 'Detail anggota berhasil diambil',
        data: anggota,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/anggota - Create anggota
  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await AnggotaService.create(req.body, req.user!.id);
      res.status(201).json({
        success: true,
        message: 'Anggota berhasil ditambahkan',
        data: {
          anggota: result.anggota,
          user: result.user,
          penugasan: result.penugasan,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/anggota/:id - Update anggota
  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await AnggotaService.update(id, req.body);
      res.json({
        success: true,
        message: 'Data anggota berhasil diperbarui',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/anggota/:id - Soft delete anggota
  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await AnggotaService.delete(id);
      res.json({
        success: true,
        message: 'Anggota berhasil diarsipkan',
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/anggota/:id/restore - Restore soft-deleted anggota
  static async restore(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const restored = await AnggotaService.restore(id);
      res.json({
        success: true,
        message: 'Anggota berhasil dipulihkan',
        data: restored,
      });
    } catch (error) {
      next(error);
    }
  }
}

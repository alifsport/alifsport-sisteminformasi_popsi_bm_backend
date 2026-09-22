import { Response, NextFunction } from 'express';
import { PrestasiService } from './prestasi.service';
import { AuthRequest } from '../../types';
import { ForbiddenError } from '../../middleware/errorHandler';
import prisma from '../../config/database';

export class PrestasiController {
  // GET /api/anggota/:anggotaId/prestasi
  static async getByAnggotaId(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { anggotaId } = req.params;
      const { tingkat, tahun } = req.query;

      // Access control: admin, pelatih at same location, or self
      await PrestasiController.checkAccess(req, anggotaId);

      const data = await PrestasiService.getByAnggotaId(anggotaId, {
        tingkat: tingkat as string,
        tahun: tahun as string,
      });
      res.json({
        success: true,
        message: 'Daftar prestasi berhasil diambil',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/anggota/:anggotaId/prestasi/stats
  static async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { anggotaId } = req.params;

      await PrestasiController.checkAccess(req, anggotaId);

      const stats = await PrestasiService.getStats(anggotaId);
      res.json({
        success: true,
        message: 'Statistik prestasi berhasil diambil',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/anggota/:anggotaId/prestasi
  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { anggotaId } = req.params;
      const {
        nama_kejuaraan, tingkat, tanggal, perolehan,
        kategori, lokasi_kejuaraan, catatan, file_url,
      } = req.body;

      const prestasi = await PrestasiService.create(anggotaId, {
        nama_kejuaraan,
        tingkat,
        tanggal,
        perolehan,
        kategori,
        lokasi_kejuaraan,
        catatan,
        file_url,
      });
      res.status(201).json({
        success: true,
        message: 'Prestasi berhasil ditambahkan',
        data: prestasi,
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/anggota/:anggotaId/prestasi/:prestasiId
  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { anggotaId, prestasiId } = req.params;
      const {
        nama_kejuaraan, tingkat, tanggal, perolehan,
        kategori, lokasi_kejuaraan, catatan, file_url,
      } = req.body;

      const prestasi = await PrestasiService.update(anggotaId, prestasiId, {
        nama_kejuaraan,
        tingkat,
        tanggal,
        perolehan,
        kategori,
        lokasi_kejuaraan,
        catatan,
        file_url,
      });
      res.json({
        success: true,
        message: 'Prestasi berhasil diupdate',
        data: prestasi,
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/anggota/:anggotaId/prestasi/:prestasiId
  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { anggotaId, prestasiId } = req.params;
      const result = await PrestasiService.delete(anggotaId, prestasiId);
      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  // Access control helper
  private static async checkAccess(req: AuthRequest, anggotaId: string) {
    const user = req.user;
    if (!user) {
      throw new ForbiddenError('Authentication required');
    }

    // Admin can access everything
    if (user.role === 'admin') {
      return;
    }

    // Self access: anggota accessing their own data
    if (user.role === 'anggota') {
      const profile = await prisma.anggota_profiles.findUnique({
        where: { user_id: user.id },
      });
      if (!profile || profile.id !== anggotaId) {
        throw new ForbiddenError('Anda tidak memiliki akses ke data ini');
      }
      return;
    }

    // Pelatih access: pelatih at the same location as the anggota
    if (user.role === 'pelatih') {
      const pelatih = await prisma.pelatih_profiles.findUnique({
        where: { user_id: user.id },
      });
      if (!pelatih) {
        throw new ForbiddenError('Profil pelatih tidak ditemukan');
      }

      // Get anggota's current assignment
      const penugasan = await prisma.penugasan.findFirst({
        where: {
          anggota_id: anggotaId,
          status: 'Aktif',
        },
      });

      if (!penugasan) {
        throw new ForbiddenError('Anggota tidak memiliki penugasan aktif');
      }

      // Check if pelatih is assigned to the same location
      if (pelatih.tempat_latihan_id !== penugasan.tempat_id) {
        throw new ForbiddenError('Anda tidak memiliki akses ke anggota di lokasi lain');
      }
      return;
    }

    throw new ForbiddenError('Role tidak memiliki akses');
  }
}

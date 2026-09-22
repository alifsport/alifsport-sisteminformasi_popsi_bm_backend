import { Response, NextFunction } from 'express';
import { LaporanService } from './laporan.service';
import { AuthRequest } from '../../types';

export class LaporanController {
  // GET /dashboard - dashboard data based on role
  static async getDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { role, id } = req.user!;
      let data;

      if (role === 'admin') {
        data = await LaporanService.getDashboardAdmin();
      } else if (role === 'pelatih') {
        data = await LaporanService.getDashboardPelatih(id);
      } else {
        data = await LaporanService.getDashboardAnggota(id);
      }

      res.json({
        success: true,
        message: 'Dashboard berhasil diambil',
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

import { Response, NextFunction } from 'express';
import { BackupService } from './backup.service';
import { AuthRequest } from '../../types';
import prisma from '../../config/database';

export class BackupController {
  // GET /api/backup/stats
  static async getStats(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await BackupService.getStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/backup/export
  static async export(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const backup = await BackupService.export();

      // Audit log
      await prisma.audit_logs.create({
        data: {
          user_id: _req.user!.id,
          aksi: 'export',
          entitas: 'backup',
          detail: { type: 'full_backup', timestamp: backup.exportedAt },
        },
      }).catch(() => {});

      // Download as file
      const filename = `sipbm-backup-${new Date().toISOString().split('T')[0]}.json`;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(JSON.stringify(backup, null, 2));
    } catch (error) {
      next(error);
    }
  }

  // POST /api/backup/restore
  static async restore(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const backupData = req.body;
      const result = await BackupService.restore(backupData);

      // Audit log
      await prisma.audit_logs.create({
        data: {
          user_id: req.user!.id,
          aksi: 'restore',
          entitas: 'backup',
          detail: { type: 'full_restore', inserted: result },
        },
      }).catch(() => {});

      res.json({
        success: true,
        message: 'Database berhasil di-restore',
        data: result,
      });
    } catch (error) {
      console.error('=== RESTORE ERROR ===');
      console.error(error);
      next(error);
    }
  }
}

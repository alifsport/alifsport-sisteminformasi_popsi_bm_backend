import { Response, NextFunction } from 'express';
import { NotifikasiService } from './notifikasi.service';
import { AuthRequest } from '../../types';

export class NotifikasiController {
  // GET / - list notifications
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await NotifikasiService.getAll(req.user!.id, req.query);
      res.json({
        success: true,
        message: 'Daftar notifikasi berhasil diambil',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /unread-count - unread count
  static async getUnreadCount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await NotifikasiService.getUnreadCount(req.user!.id);
      res.json({
        success: true,
        message: 'Jumlah notifikasi belum dibaca berhasil diambil',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /:id/baca - mark as read
  static async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const notification = await NotifikasiService.markAsRead(id, req.user!.id);
      res.json({
        success: true,
        message: 'Notifikasi berhasil ditandai sebagai sudah dibaca',
        data: notification,
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /baca-semua - mark all as read
  static async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await NotifikasiService.markAllAsRead(req.user!.id);
      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /:id - delete notification
  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await NotifikasiService.delete(id, req.user!.id);
      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}

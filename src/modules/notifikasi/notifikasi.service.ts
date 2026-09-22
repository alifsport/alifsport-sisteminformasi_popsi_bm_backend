import prisma from '../../config/database';
import { NotFoundError } from '../../middleware/errorHandler';
import { parsePaginationQuery, calculateTotalPages } from '../../utils/helpers';

interface CreateNotifikasiData {
  user_id: string;
  judul: string;
  pesan: string;
  tipe: 'jadwal' | 'presensi' | 'prestasi' | 'sistem' | 'transfer';
  link?: string;
}

export class NotifikasiService {
  // Get all notifications for a user
  static async getAll(userId: string, query: any) {
    const { page, limit, skip } = parsePaginationQuery(query);
    const { dibaca } = query;

    const where: any = { user_id: userId };

    if (dibaca !== undefined) {
      where.dibaca = dibaca === 'true';
    }

    const [notifications, total] = await Promise.all([
      prisma.notifications.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notifications.count({ where }),
    ]);

    return {
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: calculateTotalPages(total, limit),
      },
    };
  }

  // Get unread count
  static async getUnreadCount(userId: string) {
    const count = await prisma.notifications.count({
      where: {
        user_id: userId,
        dibaca: false,
      },
    });

    return { count };
  }

  // Mark single notification as read
  static async markAsRead(id: string, userId: string) {
    const notification = await prisma.notifications.findUnique({ where: { id } });

    if (!notification) {
      throw new NotFoundError('Notifikasi tidak ditemukan');
    }

    if (notification.user_id !== userId) {
      throw new NotFoundError('Notifikasi tidak ditemukan');
    }

    const updated = await prisma.notifications.update({
      where: { id },
      data: { dibaca: true },
    });

    return updated;
  }

  // Mark all notifications as read
  static async markAllAsRead(userId: string) {
    await prisma.notifications.updateMany({
      where: {
        user_id: userId,
        dibaca: false,
      },
      data: { dibaca: true },
    });

    return { message: 'Semua notifikasi telah ditandai sebagai sudah dibaca' };
  }

  // Delete notification
  static async delete(id: string, userId: string) {
    const notification = await prisma.notifications.findUnique({ where: { id } });

    if (!notification) {
      throw new NotFoundError('Notifikasi tidak ditemukan');
    }

    if (notification.user_id !== userId) {
      throw new NotFoundError('Notifikasi tidak ditemukan');
    }

    await prisma.notifications.delete({ where: { id } });

    return { message: 'Notifikasi berhasil dihapus' };
  }

  // Create notification (reusable service)
  static async create(data: CreateNotifikasiData) {
    const notification = await prisma.notifications.create({
      data: {
        user_id: data.user_id,
        judul: data.judul,
        pesan: data.pesan,
        tipe: data.tipe,
        link: data.link,
      },
    });

    return notification;
  }
}

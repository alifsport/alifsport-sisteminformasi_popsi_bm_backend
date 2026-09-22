import { Router } from 'express';
import { NotifikasiController } from './notifikasi.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/unread-count', NotifikasiController.getUnreadCount);
router.put('/baca-semua', NotifikasiController.markAllAsRead);
router.get('/', NotifikasiController.getAll);
router.put('/:id/baca', NotifikasiController.markAsRead);
router.delete('/:id', NotifikasiController.delete);

export default router;

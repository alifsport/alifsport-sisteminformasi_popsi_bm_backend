import { Router } from 'express';
import { PrestasiController } from './prestasi.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createPrestasiSchema,
  updatePrestasiSchema,
  prestasiQuerySchema,
} from './prestasi.validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /anggota/:anggotaId/prestasi - list prestasi for anggota (admin, pelatih lokasi, diri sendiri)
router.get('/anggota/:anggotaId/prestasi', validate(prestasiQuerySchema), PrestasiController.getByAnggotaId);

// GET /anggota/:anggotaId/prestasi/stats - stats for anggota
router.get('/anggota/:anggotaId/prestasi/stats', PrestasiController.getStats);

// POST /anggota/:anggotaId/prestasi - create prestasi (admin only)
router.post('/anggota/:anggotaId/prestasi', authorize('admin'), validate(createPrestasiSchema), PrestasiController.create);

// PUT /anggota/:anggotaId/prestasi/:prestasiId - update prestasi (admin only)
router.put('/anggota/:anggotaId/prestasi/:prestasiId', authorize('admin'), validate(updatePrestasiSchema), PrestasiController.update);

// DELETE /anggota/:anggotaId/prestasi/:prestasiId - delete prestasi (admin only)
router.delete('/anggota/:anggotaId/prestasi/:prestasiId', authorize('admin'), PrestasiController.delete);

export default router;

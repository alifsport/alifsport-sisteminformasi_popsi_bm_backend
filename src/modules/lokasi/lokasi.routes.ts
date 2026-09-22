import { Router } from 'express';
import { LokasiController } from './lokasi.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createLokasiSchema,
  updateLokasiSchema,
  queryLokasiSchema,
  idParamSchema,
  toggleStatusSchema,
} from './lokasi.validation';

const router = Router();

// GET /api/lokasi/stats - Get statistics (admin only)
// NOTE: This route MUST be defined BEFORE /:id to avoid matching "stats" as an id
router.get(
  '/stats',
  authenticate,
  authorize('admin'),
  LokasiController.getStats
);

// GET /api/lokasi - List all lokasi (all authenticated)
router.get(
  '/',
  authenticate,
  validate(queryLokasiSchema),
  LokasiController.getAll
);

// POST /api/lokasi - Create lokasi (admin only)
router.post(
  '/',
  authenticate,
  authorize('admin'),
  validate(createLokasiSchema),
  LokasiController.create
);

// GET /api/lokasi/:id - Get lokasi detail (all authenticated)
router.get(
  '/:id',
  authenticate,
  validate(idParamSchema),
  LokasiController.getById
);

// PUT /api/lokasi/:id - Update lokasi (admin only)
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(updateLokasiSchema),
  LokasiController.update
);

// DELETE /api/lokasi/:id - Delete lokasi (admin only)
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  validate(idParamSchema),
  LokasiController.delete
);

// PUT /api/lokasi/:id/status - Toggle status (admin only)
router.put(
  '/:id/status',
  authenticate,
  authorize('admin'),
  validate(toggleStatusSchema),
  LokasiController.toggleStatus
);

// GET /api/lokasi/:id/anggota - List anggota in lokasi (admin only)
router.get(
  '/:id/anggota',
  authenticate,
  authorize('admin'),
  validate(idParamSchema),
  LokasiController.getAnggota
);

// GET /api/lokasi/:id/jadwal - List jadwal in lokasi (admin, pelatih lokasi)
router.get(
  '/:id/jadwal',
  authenticate,
  validate(idParamSchema),
  LokasiController.getJadwal
);

export default router;

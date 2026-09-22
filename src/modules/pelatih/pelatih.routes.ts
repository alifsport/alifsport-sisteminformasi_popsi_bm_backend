import { Router } from 'express';
import { PelatihController } from './pelatih.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createPelatihSchema,
  updatePelatihSchema,
  pelatihQuerySchema,
  pelatihParamsSchema,
} from './pelatih.validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/pelatih/active-pj - Get pelatih yang menjadi PJ aktif (all authenticated)
router.get('/active-pj', PelatihController.getActivePJ);

// GET /api/pelatih - List all pelatih (admin)
router.get(
  '/',
  authorize('admin'),
  validate(pelatihQuerySchema),
  PelatihController.getAll
);

// POST /api/pelatih - Create pelatih (admin)
router.post(
  '/',
  authorize('admin'),
  validate(createPelatihSchema),
  PelatihController.create
);

// GET /api/pelatih/export - Export pelatih data (admin)
router.get(
  '/export',
  authorize('admin'),
  validate(pelatihQuerySchema),
  PelatihController.getExport
);

// GET /api/pelatih/archived - List pelatih arsip (admin)
router.get(
  '/archived',
  authorize('admin'),
  PelatihController.getArchived
);

// GET /api/pelatih/:id/delete-preview - Preview data terkait sebelum hapus permanen
router.get(
  '/:id/delete-preview',
  authorize('admin'),
  validate(pelatihParamsSchema),
  PelatihController.getDeletePreview
);

// GET /api/pelatih/:id - Detail pelatih (admin)
router.get(
  '/:id',
  authorize('admin'),
  validate(pelatihParamsSchema),
  PelatihController.getById
);

// PUT /api/pelatih/:id - Update pelatih (admin)
router.put(
  '/:id',
  authorize('admin'),
  validate(updatePelatihSchema),
  PelatihController.update
);

// DELETE /api/pelatih/:id - Nonaktifkan pelatih (admin)
router.delete(
  '/:id',
  authorize('admin'),
  validate(pelatihParamsSchema),
  PelatihController.delete
);

// PUT /api/pelatih/:id/restore - Pulihkan pelatih dari arsip (admin)
router.put(
  '/:id/restore',
  authorize('admin'),
  validate(pelatihParamsSchema),
  PelatihController.restore
);

// DELETE /api/pelatih/:id/permanent - Hapus permanen pelatih (admin)
router.delete(
  '/:id/permanent',
  authorize('admin'),
  validate(pelatihParamsSchema),
  PelatihController.permanentDelete
);

// PUT /api/pelatih/:id/status - Toggle status (admin)
router.put(
  '/:id/status',
  authorize('admin'),
  validate(pelatihParamsSchema),
  PelatihController.toggleStatus
);

// GET /api/pelatih/:id/anggota - List anggota (admin, pelatih self)
router.get(
  '/:id/anggota',
  authorize('admin', 'pelatih'),
  validate(pelatihParamsSchema),
  PelatihController.getAnggota
);

export default router;

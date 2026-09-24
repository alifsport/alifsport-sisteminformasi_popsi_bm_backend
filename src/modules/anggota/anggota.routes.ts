import { Router } from 'express';
import { AnggotaController } from './anggota.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createAnggotaSchema,
  updateAnggotaSchema,
  anggotaQuerySchema,
  anggotaIdParamSchema,
  archivedQuerySchema,
} from './anggota.validation';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// GET /api/anggota - List all anggota (paginated, with search/filter)
router.get('/', validate(anggotaQuerySchema), AnggotaController.getAll);

// POST /api/anggota - Create new anggota
router.post('/', validate(createAnggotaSchema), AnggotaController.create);

// GET /api/anggota/stats - Statistics overview
router.get('/stats', AnggotaController.getStats);

// GET /api/anggota/archived - List soft-deleted anggota
router.get('/archived', validate(archivedQuerySchema), AnggotaController.getArchived);

// GET /api/anggota/export - Export anggota data
router.get('/export', validate(anggotaQuerySchema), AnggotaController.getExport);

// GET /api/anggota/:id - Detail single anggota
router.get('/:id', validate(anggotaIdParamSchema), AnggotaController.getById);

// PUT /api/anggota/:id - Update anggota
router.put('/:id', validate(updateAnggotaSchema), AnggotaController.update);

// DELETE /api/anggota/:id - Soft delete (archive) anggota
router.delete('/:id', validate(anggotaIdParamSchema), AnggotaController.delete);

// POST /api/anggota/bulk-delete - Bulk soft delete
router.post('/bulk-delete', AnggotaController.bulkDelete);

// POST /api/anggota/:id/restore - Restore archived anggota
router.post('/:id/restore', validate(anggotaIdParamSchema), AnggotaController.restore);

export default router;

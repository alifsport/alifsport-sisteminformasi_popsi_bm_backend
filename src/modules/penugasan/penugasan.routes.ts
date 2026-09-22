import { Router } from 'express';
import { PenugasanController } from './penugasan.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createPenugasanSchema,
  transferPenugasanSchema,
  penugasanQuerySchema,
} from './penugasan.validation';

const router = Router();

// All routes require admin role
router.use(authenticate, authorize('admin'));

// GET / - list all penugasan
router.get('/', validate(penugasanQuerySchema), PenugasanController.getAll);

// POST / - create penugasan
router.post('/', validate(createPenugasanSchema), PenugasanController.create);

// POST /transfer - transfer penugasan
router.post('/transfer', validate(transferPenugasanSchema), PenugasanController.transfer);

// GET /riwayat/:anggotaId - riwayat for specific anggota (must be before /:id)
router.get('/riwayat/:anggotaId', PenugasanController.getRiwayat);

// GET /:id - detail penugasan
router.get('/:id', PenugasanController.getById);

// DELETE /:id - end penugasan
router.delete('/:id', PenugasanController.delete);

export default router;

import { Router } from 'express';
import { JadwalController } from './jadwal.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createJadwalSchema,
  updateJadwalSchema,
  jadwalQuerySchema,
  batalkanJadwalSchema,
  kalenderQuerySchema,
} from './jadwal.validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /kalender - calendar data (must be before /:id)
router.get('/kalender', validate(kalenderQuerySchema), JadwalController.getKalender);

// GET /saya - my schedules for pelatih and anggota
router.get('/saya', authorize('pelatih', 'anggota'), JadwalController.getSaya);

// GET / - list all jadwal
router.get('/', validate(jadwalQuerySchema), JadwalController.getAll);

// POST / - create jadwal (admin, pelatih)
router.post('/', authorize('admin', 'pelatih'), validate(createJadwalSchema), JadwalController.create);

// GET /:id - detail jadwal (all authenticated)
router.get('/:id', JadwalController.getById);

// PUT /:id - update jadwal (admin, pelatih)
router.put('/:id', authorize('admin', 'pelatih'), validate(updateJadwalSchema), JadwalController.update);

// PUT /:id/batal - cancel jadwal (admin, pelatih)
router.put('/:id/batal', authorize('admin', 'pelatih'), validate(batalkanJadwalSchema), JadwalController.batalkan);

// DELETE /:id - delete jadwal (admin only)
router.delete('/:id', authorize('admin'), JadwalController.delete);

export default router;

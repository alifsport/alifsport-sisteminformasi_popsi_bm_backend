import { Router } from 'express';
import { PresensiController } from './presensi.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import { inputPresensiSchema, updatePresensiSchema } from './presensi.validation';

const router = Router();

router.use(authenticate);

// GET /presensi/anggota-by-lokasi/:lokasiId — ambil anggota aktif per lokasi (harus sebelum /:id routes)
router.get('/anggota-by-lokasi/:lokasiId', authorize('admin', 'pelatih'), PresensiController.getAnggotaByLokasi);

router.post('/', authorize('admin', 'pelatih'), validate(inputPresensiSchema), PresensiController.inputPresensi);
router.get('/jadwal/:jadwalId', authorize('admin', 'pelatih'), PresensiController.getByJadwal);
router.put('/:id', authorize('admin'), validate(updatePresensiSchema), PresensiController.update);
router.get('/anggota/:anggotaId', PresensiController.getByAnggota);
router.get('/rekap', authorize('admin', 'pelatih'), PresensiController.getRekap);
router.get('/stats', authorize('admin'), PresensiController.getStats);

export default router;

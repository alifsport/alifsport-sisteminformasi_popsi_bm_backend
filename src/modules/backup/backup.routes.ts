import { Router } from 'express';
import { BackupController } from './backup.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';

const router = Router();

router.use(authenticate);
router.use(authorize('admin'));

router.get('/stats', BackupController.getStats);
router.get('/export', BackupController.export);
router.post('/restore', BackupController.restore);

export default router;

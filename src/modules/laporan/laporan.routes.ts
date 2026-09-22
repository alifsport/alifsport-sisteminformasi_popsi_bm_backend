import { Router } from 'express';
import { LaporanController } from './laporan.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/dashboard', LaporanController.getDashboard);

export default router;

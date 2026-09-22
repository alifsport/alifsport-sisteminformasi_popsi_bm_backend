import { Router } from 'express';
import { UserController } from './user.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Profile routes (all authenticated roles) - must come before /:id
router.get('/profile', UserController.getProfile);
router.put('/profile', UserController.updateProfile);

// Admin-only routes
router.get('/', authorize('admin'), UserController.getAll);
router.post('/', authorize('admin'), UserController.create);
router.get('/:id', authorize('admin'), UserController.getById);
router.put('/:id', authorize('admin'), UserController.update);
router.delete('/:id', authorize('admin'), UserController.delete);
router.put('/:id/role', authorize('admin'), UserController.updateRole);
router.put('/:id/status', authorize('admin'), UserController.updateStatus);
router.post('/:id/reset-password', authorize('admin'), UserController.resetPassword);

export default router;

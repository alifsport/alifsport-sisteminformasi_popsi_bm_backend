import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  loginSchema,
  bootstrapAdminSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.validation';
import { authRateLimiter } from '../../middleware/rateLimit.middleware';

const router = Router();

// Public routes
router.post('/bootstrap-admin', validate(bootstrapAdminSchema), AuthController.bootstrapAdmin);
router.post('/login', authRateLimiter, validate(loginSchema), AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), AuthController.resetPassword);

// Protected routes
router.post('/logout', authenticate, AuthController.logout);
router.put('/change-password', authenticate, validate(changePasswordSchema), AuthController.changePassword);
router.get('/sessions', authenticate, AuthController.getSessions);

export default router;

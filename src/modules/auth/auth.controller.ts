import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { AuthRequest } from '../../types';

export class AuthController {
  // POST /api/auth/bootstrap-admin
  static async bootstrapAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, nama_lengkap } = req.body;
      const admin = await AuthService.bootstrapAdmin(email, password, nama_lengkap);
      res.status(201).json({
        success: true,
        message: 'Admin berhasil dibuat',
        data: admin,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/login
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await AuthService.login(email, password, ipAddress, userAgent);

      // Set refresh token in httpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        success: true,
        message: 'Login berhasil',
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/logout
  static async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Log audit
      const { prisma } = await import('../../config/database');
      if (req.user) {
        await prisma.audit_logs.create({
          data: {
            user_id: req.user.id,
            aksi: 'logout',
            entitas: 'user',
            entitas_id: req.user.id,
            ip_address: req.ip,
          },
        });
      }

      res.clearCookie('refreshToken');
      res.json({
        success: true,
        message: 'Logout berhasil',
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/refresh
  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token required',
        });
      }

      const result = await AuthService.refreshToken(refreshToken);

      // Set new refresh token
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        data: {
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/auth/change-password
  static async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { current_password, new_password } = req.body;
      await AuthService.changePassword(req.user!.id, current_password, new_password);
      res.json({
        success: true,
        message: 'Password berhasil diubah',
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/forgot-password
  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await AuthService.forgotPassword(email);
      res.json({
        success: true,
        message: result.message,
        ...(process.env.NODE_ENV === 'development' && result.resetToken && {
          resetToken: result.resetToken,
        }),
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/reset-password
  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, new_password } = req.body;
      await AuthService.resetPassword(token, new_password);
      res.json({
        success: true,
        message: 'Password berhasil direset',
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/auth/sessions
  static async getSessions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const sessions = await AuthService.getSessions(req.user!.id);
      res.json({
        success: true,
        data: sessions,
      });
    } catch (error) {
      next(error);
    }
  }
}

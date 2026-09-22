import { Response, NextFunction } from 'express';
import { UserService } from './user.service';
import { AuthRequest } from '../../types';

export class UserController {
  // GET / - list users
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await UserService.getAll(req.query);
      res.json({
        success: true,
        message: 'Daftar user berhasil diambil',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST / - create user
  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email, password, role } = req.body;
      const user = await UserService.create({ email, password, role });
      res.status(201).json({
        success: true,
        message: 'User berhasil dibuat',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /profile - get own profile
  static async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const profile = await UserService.getProfile(req.user!.id);
      res.json({
        success: true,
        message: 'Profil berhasil diambil',
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /profile - update own profile
  static async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const user = await UserService.updateProfile(req.user!.id, { email });
      res.json({
        success: true,
        message: 'Profil berhasil diperbarui',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /:id - get user by id
  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const user = await UserService.getById(id);
      res.json({
        success: true,
        message: 'Detail user berhasil diambil',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /:id - update user
  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { email, status } = req.body;
      const user = await UserService.update(id, { email, status });
      res.json({
        success: true,
        message: 'User berhasil diperbarui',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /:id - soft delete user
  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await UserService.delete(id);
      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /:id/role - change role
  static async updateRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { role } = req.body;
      const user = await UserService.updateRole(id, role);
      res.json({
        success: true,
        message: 'Role user berhasil diubah',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /:id/status - toggle status
  static async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { status } = req.body;
      const user = await UserService.updateStatus(id, status);
      res.json({
        success: true,
        message: 'Status user berhasil diubah',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /:id/reset-password - reset password
  static async resetPassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await UserService.resetPassword(id);
      res.json({
        success: true,
        message: 'Password berhasil direset',
        data: { newPassword: result.newPassword },
      });
    } catch (error) {
      next(error);
    }
  }
}

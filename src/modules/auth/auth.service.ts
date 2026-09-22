import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../../config/database';
import { jwtConfig } from '../../config/jwt';
import { AppError, UnauthorizedError, NotFoundError, ConflictError } from '../../middleware/errorHandler';
import { JwtPayload } from '../../types';
import { generateRandomPassword } from '../../utils/helpers';

export class AuthService {
  // Generate access token
  static generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, jwtConfig.secret, { expiresIn: jwtConfig.accessTokenExpiry as any });
  }

  // Generate refresh token
  static generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(payload, jwtConfig.secret, { expiresIn: jwtConfig.refreshTokenExpiry as any });
  }

  // Verify token
  static verifyToken(token: string): JwtPayload {
    return jwt.verify(token, jwtConfig.secret) as JwtPayload;
  }

  // Bootstrap first admin
  static async bootstrapAdmin(email: string, password: string, namaLengkap: string) {
    // Check if any admin exists
    const existingAdmin = await prisma.users.findFirst({
      where: { role: 'admin' },
    });

    if (existingAdmin) {
      throw new ConflictError('Admin already exists. Use normal registration.');
    }

    // Check email uniqueness
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.users.create({
      data: {
        email,
        password_hash: passwordHash,
        role: 'admin',
        status: 'active',
      },
    });

    // Log audit
    await prisma.audit_logs.create({
      data: {
        user_id: user.id,
        aksi: 'create',
        entitas: 'user',
        entitas_id: user.id,
        detail: { action: 'bootstrap_admin', email },
      },
    });

    return { id: user.id, email: user.email, role: user.role };
  }

  // Login
  static async login(email: string, password: string, ipAddress?: string, userAgent?: string) {
    const user = await prisma.users.findUnique({
      where: { email },
      include: {
        anggota_profile: {
          select: { id: true, id_anggota: true, nama_lengkap: true, sabuk: true, status_keanggotaan: true },
        },
        pelatih_profile: {
          select: { id: true, id_pelatih: true, nama_lengkap: true, tempat_melatih_id: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedError('Email atau password salah');
    }

    // Check if account is locked
    if (user.locked_until && user.locked_until > new Date()) {
      throw new UnauthorizedError('Akun terkunci. Coba lagi setelah 15 menit.');
    }

    // Check if account is inactive
    if (user.status === 'inactive') {
      throw new UnauthorizedError('Akun tidak aktif. Hubungi admin.');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      // Increment failed attempts
      const failedAttempts = user.failed_login_attempts + 1;
      const lockUntil = failedAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

      await prisma.users.update({
        where: { id: user.id },
        data: {
          failed_login_attempts: failedAttempts,
          locked_until: lockUntil,
          status: failedAttempts >= 5 ? 'locked' : user.status,
        },
      });

      throw new UnauthorizedError('Email atau password salah');
    }

    // Reset failed attempts on success
    await prisma.users.update({
      where: { id: user.id },
      data: {
        failed_login_attempts: 0,
        locked_until: null,
        last_login_at: new Date(),
        status: 'active',
      },
    });

    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    // Log audit
    await prisma.audit_logs.create({
      data: {
        user_id: user.id,
        aksi: 'login',
        entitas: 'user',
        entitas_id: user.id,
        ip_address: ipAddress,
        user_agent: userAgent,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        hasAnggotaProfile: !!user.anggota_profile,
        hasPelatihProfile: !!user.pelatih_profile,
        anggotaProfile: user.anggota_profile || null,
        pelatihProfile: user.pelatih_profile || null,
      },
      accessToken,
      refreshToken,
    };
  }

  // Refresh token
  static async refreshToken(refreshToken: string) {
    const decoded = this.verifyToken(refreshToken);

    const user = await prisma.users.findUnique({
      where: { id: decoded.id },
    });

    if (!user || user.status === 'inactive') {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const newAccessToken = this.generateAccessToken(payload);
    const newRefreshToken = this.generateRefreshToken(payload);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  // Change password
  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Password lama salah');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    await prisma.users.update({
      where: { id: userId },
      data: { password_hash: newPasswordHash },
    });

    // Log audit
    await prisma.audit_logs.create({
      data: {
        user_id: userId,
        aksi: 'update',
        entitas: 'user',
        entitas_id: userId,
        detail: { action: 'change_password' },
      },
    });
  }

  // Forgot password
  static async forgotPassword(email: string) {
    const user = await prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists
      return { message: 'Jika email terdaftar, link reset password telah dikirim.' };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.users.update({
      where: { id: user.id },
      data: {
        reset_token: resetToken,
        reset_token_expires: resetTokenExpires,
      },
    });

    // TODO: Send email with reset link
    // For now, just return the token (in production, send via email)
    return {
      message: 'Jika email terdaftar, link reset password telah dikirim.',
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
    };
  }

  // Reset password
  static async resetPassword(token: string, newPassword: string) {
    const user = await prisma.users.findFirst({
      where: {
        reset_token: token,
        reset_token_expires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new UnauthorizedError('Token tidak valid atau sudah kedaluwarsa');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    await prisma.users.update({
      where: { id: user.id },
      data: {
        password_hash: newPasswordHash,
        reset_token: null,
        reset_token_expires: null,
      },
    });

    // Log audit
    await prisma.audit_logs.create({
      data: {
        user_id: user.id,
        aksi: 'update',
        entitas: 'user',
        entitas_id: user.id,
        detail: { action: 'reset_password' },
      },
    });
  }

  // Get sessions
  static async getSessions(userId: string) {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        last_login_at: true,
        anggota_profile: {
          select: { id: true, id_anggota: true, nama_lengkap: true, sabuk: true, status_keanggotaan: true },
        },
        pelatih_profile: {
          select: { id: true, id_pelatih: true, nama_lengkap: true, tempat_melatih_id: true },
        },
      },
    });

    return user;
  }
}

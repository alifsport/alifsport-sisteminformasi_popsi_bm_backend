import bcrypt from 'bcryptjs';
import prisma from '../../config/database';
import { NotFoundError, ConflictError } from '../../middleware/errorHandler';
import { parsePaginationQuery, calculateTotalPages, generateRandomPassword } from '../../utils/helpers';

interface CreateUserData {
  email: string;
  password: string;
  role: 'admin' | 'pelatih' | 'anggota';
}

interface UpdateUserData {
  email?: string;
  status?: 'active' | 'inactive' | 'locked';
}

export class UserService {
  // List all users
  static async getAll(query: any) {
    const { page, limit, skip } = parsePaginationQuery(query);
    const { search, role, status } = query;

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { anggota_profile: { nama_lengkap: { contains: search, mode: 'insensitive' } } },
        { pelatih_profile: { nama_lengkap: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    const [users, total] = await Promise.all([
      prisma.users.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          anggota_profile: {
            select: {
              id: true,
              id_anggota: true,
              nama_lengkap: true,
              sabuk: true,
              status_keanggotaan: true,
            },
          },
          pelatih_profile: {
            select: {
              id: true,
              id_pelatih: true,
              nama_lengkap: true,
            },
          },
        },
      }),
      prisma.users.count({ where }),
    ]);

    // Strip sensitive fields
    const safeUsers = users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      status: u.status,
      last_login_at: u.last_login_at,
      created_at: u.created_at,
      anggota_profile: u.anggota_profile,
      pelatih_profile: u.pelatih_profile,
    }));

    return {
      data: safeUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: calculateTotalPages(total, limit),
      },
    };
  }

  // Get user by id
  static async getById(id: string) {
    const user = await prisma.users.findUnique({
      where: { id },
      include: {
        anggota_profile: true,
        pelatih_profile: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User tidak ditemukan');
    }

    const { password_hash: _, reset_token: __, reset_token_expires: ___, ...safeUser } = user;
    return safeUser;
  }

  // Create user
  static async create(data: CreateUserData) {
    // Check email uniqueness
    const existing = await prisma.users.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictError('Email sudah terdaftar');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.users.create({
      data: {
        email: data.email,
        password_hash: passwordHash,
        role: data.role,
        status: 'active',
      },
    });

    // Audit log
    await prisma.audit_logs.create({
      data: {
        user_id: user.id,
        aksi: 'create',
        entitas: 'user',
        entitas_id: user.id,
        detail: { action: 'create_user', email: user.email, role: user.role },
      },
    });

    const { password_hash: _, ...safeUser } = user;
    return safeUser;
  }

  // Update user
  static async update(id: string, data: UpdateUserData) {
    const user = await prisma.users.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundError('User tidak ditemukan');
    }

    // Check email uniqueness if changing email
    if (data.email && data.email !== user.email) {
      const existing = await prisma.users.findUnique({
        where: { email: data.email },
      });
      if (existing) {
        throw new ConflictError('Email sudah terdaftar');
      }
    }

    const updated = await prisma.users.update({
      where: { id },
      data: {
        ...(data.email && { email: data.email }),
        ...(data.status && { status: data.status }),
      },
    });

    // Audit log
    await prisma.audit_logs.create({
      data: {
        user_id: user.id,
        aksi: 'update',
        entitas: 'user',
        entitas_id: id,
        detail: { action: 'update_user', changes: data },
      },
    });

    const { password_hash: _, ...safeUser } = updated;
    return safeUser;
  }

  // Soft delete user
  static async delete(id: string) {
    const user = await prisma.users.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundError('User tidak ditemukan');
    }

    await prisma.users.update({
      where: { id },
      data: { status: 'inactive' },
    });

    // Audit log
    await prisma.audit_logs.create({
      data: {
        user_id: user.id,
        aksi: 'delete',
        entitas: 'user',
        entitas_id: id,
        detail: { action: 'soft_delete_user', email: user.email },
      },
    });

    return { message: 'User berhasil dihapus (dinonaktifkan)' };
  }

  // Update role
  static async updateRole(id: string, role: 'admin' | 'pelatih' | 'anggota') {
    const user = await prisma.users.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundError('User tidak ditemukan');
    }

    const updated = await prisma.users.update({
      where: { id },
      data: { role },
    });

    // Audit log
    await prisma.audit_logs.create({
      data: {
        user_id: user.id,
        aksi: 'update',
        entitas: 'user',
        entitas_id: id,
        detail: { action: 'update_role', old_role: user.role, new_role: role },
      },
    });

    const { password_hash: _, ...safeUser } = updated;
    return safeUser;
  }

  // Update status
  static async updateStatus(id: string, status: 'active' | 'inactive' | 'locked') {
    const user = await prisma.users.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundError('User tidak ditemukan');
    }

    const updated = await prisma.users.update({
      where: { id },
      data: { status },
    });

    // Audit log
    await prisma.audit_logs.create({
      data: {
        user_id: user.id,
        aksi: 'update',
        entitas: 'user',
        entitas_id: id,
        detail: { action: 'update_status', old_status: user.status, new_status: status },
      },
    });

    const { password_hash: _, ...safeUser } = updated;
    return safeUser;
  }

  // Reset password
  static async resetPassword(id: string) {
    const user = await prisma.users.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundError('User tidak ditemukan');
    }

    const newPassword = generateRandomPassword();
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.users.update({
      where: { id },
      data: { password_hash: passwordHash },
    });

    // Audit log
    await prisma.audit_logs.create({
      data: {
        user_id: user.id,
        aksi: 'update',
        entitas: 'user',
        entitas_id: id,
        detail: { action: 'reset_password' },
      },
    });

    return { newPassword };
  }

  // Get own profile
  static async getProfile(userId: string) {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        anggota_profile: true,
        pelatih_profile: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User tidak ditemukan');
    }

    const { password_hash: _, reset_token: __, reset_token_expires: ___, ...safeUser } = user;
    return safeUser;
  }

  // Update own profile
  static async updateProfile(userId: string, data: { email?: string }) {
    const user = await prisma.users.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundError('User tidak ditemukan');
    }

    // Check email uniqueness if changing email
    if (data.email && data.email !== user.email) {
      const existing = await prisma.users.findUnique({
        where: { email: data.email },
      });
      if (existing) {
        throw new ConflictError('Email sudah terdaftar');
      }
    }

    const updated = await prisma.users.update({
      where: { id: userId },
      data: {
        ...(data.email && { email: data.email }),
      },
    });

    // Audit log
    await prisma.audit_logs.create({
      data: {
        user_id: userId,
        aksi: 'update',
        entitas: 'user',
        entitas_id: userId,
        detail: { action: 'update_profile', changes: data },
      },
    });

    const { password_hash: _, ...safeUser } = updated;
    return safeUser;
  }
}

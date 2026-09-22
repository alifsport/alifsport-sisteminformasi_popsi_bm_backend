import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['admin', 'pelatih', 'anggota']),
    nama_lengkap: z.string().min(3).max(100),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    email: z.string().email().optional(),
    role: z.enum(['admin', 'pelatih', 'anggota']).optional(),
    status: z.enum(['active', 'inactive', 'locked']).optional(),
  }),
});

export const updateRoleSchema = z.object({
  body: z.object({
    role: z.enum(['admin', 'pelatih', 'anggota']),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    nama_lengkap: z.string().min(3).max(100).optional(),
    no_telepon: z.string().optional(),
    alamat: z.string().optional(),
    foto_url: z.string().url().optional(),
  }),
});

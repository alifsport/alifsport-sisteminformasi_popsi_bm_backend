import { execSync } from 'child_process';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// Pastikan Prisma client selalu digenerate dari schema terkini.
// Render sering memakai cache node_modules — client basi menyebabkan
// error runtime (kolom/compound-unique tidak dikenal) saat deploy schema berubah.
try {
  execSync('npx prisma generate', {
    stdio: 'ignore',
    cwd: path.join(__dirname, '../..'),
    timeout: 90000,
  });
} catch {
  // Lanjut dengan client yang sudah ada kalau generate gagal
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;

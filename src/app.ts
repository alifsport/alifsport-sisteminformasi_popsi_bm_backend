import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import corsOptions from './config/cors';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimit.middleware';

// Routes
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/user.routes';
import anggotaRoutes from './modules/anggota/anggota.routes';
import pelatihRoutes from './modules/pelatih/pelatih.routes';
import lokasiRoutes from './modules/lokasi/lokasi.routes';
import penugasanRoutes from './modules/penugasan/penugasan.routes';
import jadwalRoutes from './modules/jadwal/jadwal.routes';
import presensiRoutes from './modules/presensi/presensi.routes';
import prestasiRoutes from './modules/prestasi/prestasi.routes';
import notifikasiRoutes from './modules/notifikasi/notifikasi.routes';
import laporanRoutes from './modules/laporan/laporan.routes';

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== MIDDLEWARE ====================
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(rateLimiter);

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ==================== ROUTES ====================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'SIPBM API - Sistem Informasi Pencak Silat POPSI Bhayu Manunggal',
    version: '1.0.0',
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/anggota', anggotaRoutes);
app.use('/api/pelatih', pelatihRoutes);
app.use('/api/lokasi', lokasiRoutes);
app.use('/api/penugasan', penugasanRoutes);
app.use('/api/jadwal', jadwalRoutes);
app.use('/api/presensi', presensiRoutes);
app.use('/api/prestasi', prestasiRoutes);
app.use('/api/notifikasi', notifikasiRoutes);
app.use('/api/laporan', laporanRoutes);

// ==================== ERROR HANDLING ====================
app.use(errorHandler);

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;

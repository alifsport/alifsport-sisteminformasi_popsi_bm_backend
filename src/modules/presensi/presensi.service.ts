import prisma from '../../config/database';
import { AppError, NotFoundError, ForbiddenError } from '../../middleware/errorHandler';

export class PresensiService {

  // ==================== GET ANGGOTA BY LOKASI ====================
  static async getAnggotaByLokasi(lokasiId: string, userId: string, userRole: string) {
    // Verify lokasi exists
    const lokasi = await prisma.tempat_latihan.findUnique({
      where: { id: lokasiId },
      select: { id: true, nama: true },
    });
    if (!lokasi) throw new NotFoundError('Lokasi tidak ditemukan');

    // If pelatih, verify they are PJ of this lokasi
    if (userRole === 'pelatih') {
      const pelatih = await prisma.pelatih_profiles.findFirst({
        where: { user_id: userId },
      });
      if (!pelatih) throw new ForbiddenError('Profil pelatih tidak ditemukan');

      const isPJ = await prisma.tempat_latihan.findFirst({
        where: { id: lokasiId, pelatih_pj_id: pelatih.id },
      });
      if (!isPJ) throw new ForbiddenError('Anda bukan Pelatih PJ lokasi ini');
    }

    // Get anggota aktif di lokasi ini
    const anggota = await prisma.anggota_profiles.findMany({
      where: {
        tempat_latihan_saat_ini_id: lokasiId,
        status_keanggotaan: 'Aktif',
        deleted_at: null,
      },
      select: {
        id: true,
        id_anggota: true,
        nama_lengkap: true,
        sabuk: true,
        no_telepon: true,
      },
      orderBy: { nama_lengkap: 'asc' },
    });

    return anggota;
  }

  // ==================== INPUT PRESENSI (UPSERT) ====================
  static async inputPresensi(jadwalId: string, presensiData: any[], userId: string, userRole: string, tanggal: string, catatanUmum?: string) {
    // 1. Verify jadwal exists
    const jadwal = await prisma.jadwal_latihan.findUnique({
      where: { id: jadwalId },
      include: { tempat: { select: { id: true, nama: true, pelatih_pj_id: true } } },
    });
    if (!jadwal) throw new NotFoundError('Jadwal tidak ditemukan');

    // 2. Verify pelatih access
    if (userRole === 'pelatih') {
      const pelatih = await prisma.pelatih_profiles.findFirst({
        where: { user_id: userId },
      });
      if (!pelatih) throw new ForbiddenError('Profil pelatih tidak ditemukan');

      // Check if pelatih is PJ of the jadwal's lokasi
      if (jadwal.tempat?.pelatih_pj_id !== pelatih.id) {
        throw new ForbiddenError('Anda tidak memiliki akses ke lokasi jadwal ini');
      }
    }

    // 3. Validate each anggota belongs to this lokasi
    const lokasiId = jadwal.tempat_id;
    for (const item of presensiData) {
      const anggota = await prisma.anggota_profiles.findUnique({
        where: { id: item.anggota_id },
        select: { id: true, tempat_latihan_saat_ini_id: true, status_keanggotaan: true, deleted_at: true },
      });

      if (!anggota) throw new NotFoundError(`Anggota ${item.anggota_id} tidak ditemukan`);
      if (anggota.deleted_at) throw new AppError(`Anggota ${item.anggota_id} sudah diarsipkan`, 400);
      if (anggota.status_keanggotaan !== 'Aktif') throw new AppError(`Anggota ${item.anggota_id} tidak aktif`, 400);
      if (anggota.tempat_latihan_saat_ini_id !== lokasiId) {
        throw new ForbiddenError(`Anggota ${item.anggota_id} bukan dari lokasi ini`);
      }
    }

    // 4. Upsert each presensi
    const tanggalDate = new Date(tanggal);
    const results = [];
    for (const item of presensiData) {
      const result = await prisma.presensi.upsert({
        where: {
          jadwal_id_anggota_id_tanggal: {
            jadwal_id: jadwalId,
            anggota_id: item.anggota_id,
            tanggal: tanggalDate,
          },
        },
        update: {
          status: item.status,
          keterangan: item.keterangan || null,
          catatan_umum: catatanUmum || null,
          input_oleh: userId,
        },
        create: {
          jadwal_id: jadwalId,
          anggota_id: item.anggota_id,
          tanggal: tanggalDate,
          status: item.status,
          keterangan: item.keterangan || null,
          catatan_umum: catatanUmum || null,
          input_oleh: userId,
        },
      });
      results.push(result);
    }

    // 5. Audit log
    await prisma.audit_logs.create({
      data: {
        user_id: userId,
        aksi: 'create',
        entitas: 'presensi',
        entitas_id: jadwalId,
        detail: { jadwal_id: jadwalId, count: results.length },
      },
    }).catch(() => {}); // ignore audit log errors

    return results;
  }

  // ==================== GET BY JADWAL ====================
  static async getByJadwal(jadwalId: string, tanggal?: string) {
    const where: any = { jadwal_id: jadwalId };
    if (tanggal) {
      where.tanggal = new Date(tanggal);
    }
    return prisma.presensi.findMany({
      where,
      include: {
        anggota: { select: { id: true, id_anggota: true, nama_lengkap: true, sabuk: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  // ==================== UPDATE ====================
  static async update(id: string, data: any, userId: string) {
    const presensi = await prisma.presensi.findUnique({ where: { id } });
    if (!presensi) throw new NotFoundError('Presensi tidak ditemukan');

    return prisma.presensi.update({
      where: { id },
      data: {
        status: data.status,
        keterangan: data.keterangan,
      },
    });
  }

  // ==================== GET BY ANGGOTA ====================
  static async getByAnggota(anggotaId: string) {
    return prisma.presensi.findMany({
      where: { anggota_id: anggotaId },
      include: {
        jadwal: {
          select: { judul_materi: true, tanggal: true, jam_mulai: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  // ==================== GET REKAP ====================
  static async getRekap(query: { lokasi_id?: string; bulan?: number; tahun?: number }) {
    const where: any = {};

    if (query.lokasi_id) {
      where.jadwal = { tempat_id: query.lokasi_id };
    }

    if (query.bulan && query.tahun) {
      const startDate = new Date(query.tahun, query.bulan - 1, 1);
      const endDate = new Date(query.tahun, query.bulan, 0);
      where.jadwal = { ...where.jadwal, tanggal: { gte: startDate, lte: endDate } };
    }

    const presensi = await prisma.presensi.findMany({
      where,
      include: {
        anggota: { select: { id_anggota: true, nama_lengkap: true } },
        jadwal: { select: { tanggal: true, judul_materi: true, tempat_id: true } },
      },
    });

    return presensi;
  }

  // ==================== GET STATS ====================
  static async getStats() {
    const totalPresensi = await prisma.presensi.count();
    const byStatus = await prisma.presensi.groupBy({
      by: ['status'],
      _count: true,
    });

    return { total: totalPresensi, byStatus };
  }
}

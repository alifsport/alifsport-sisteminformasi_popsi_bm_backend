import prisma from '../../config/database';
import { NotFoundError } from '../../middleware/errorHandler';

export class PrestasiService {
  // Get prestasi for an anggota
  static async getByAnggotaId(anggotaId: string, query: { tingkat?: string; tahun?: string }) {
    const anggota = await prisma.anggota_profiles.findUnique({
      where: { id: anggotaId },
    });
    if (!anggota) {
      throw new NotFoundError('Anggota tidak ditemukan');
    }

    const where: any = { anggota_id: anggotaId };

    if (query.tingkat) {
      where.tingkat = query.tingkat;
    }

    if (query.tahun) {
      const year = parseInt(query.tahun);
      const startOfYear = new Date(`${year}-01-01`);
      const endOfYear = new Date(`${year}-12-31`);
      where.tanggal = {
        gte: startOfYear,
        lte: endOfYear,
      };
    }

    const data = await prisma.prestasi.findMany({
      where,
      orderBy: { tanggal: 'desc' },
    });

    return data;
  }

  // Create prestasi for an anggota
  static async create(anggotaId: string, data: {
    nama_kejuaraan: string;
    tingkat: string;
    tanggal: string;
    perolehan: string;
    kategori: string;
    lokasi_kejuaraan: string;
    catatan?: string;
    file_url?: string;
  }) {
    const anggota = await prisma.anggota_profiles.findUnique({
      where: { id: anggotaId },
    });
    if (!anggota) {
      throw new NotFoundError('Anggota tidak ditemukan');
    }

    const prestasi = await prisma.prestasi.create({
      data: {
        anggota_id: anggotaId,
        nama_kejuaraan: data.nama_kejuaraan,
        tingkat: data.tingkat as any,
        tanggal: new Date(data.tanggal),
        perolehan: data.perolehan,
        kategori: data.kategori,
        lokasi_kejuaraan: data.lokasi_kejuaraan,
        catatan: data.catatan,
        file_url: data.file_url,
      },
    });

    return prestasi;
  }

  // Update prestasi
  static async update(anggotaId: string, prestasiId: string, data: {
    nama_kejuaraan?: string;
    tingkat?: string;
    tanggal?: string;
    perolehan?: string;
    kategori?: string;
    lokasi_kejuaraan?: string;
    catatan?: string;
    file_url?: string;
  }) {
    // Verify anggota exists
    const anggota = await prisma.anggota_profiles.findUnique({
      where: { id: anggotaId },
    });
    if (!anggota) {
      throw new NotFoundError('Anggota tidak ditemukan');
    }

    // Verify prestasi exists and belongs to anggota
    const existing = await prisma.prestasi.findFirst({
      where: {
        id: prestasiId,
        anggota_id: anggotaId,
      },
    });
    if (!existing) {
      throw new NotFoundError('Prestasi tidak ditemukan untuk anggota ini');
    }

    const updateData: any = {};
    if (data.nama_kejuaraan !== undefined) updateData.nama_kejuaraan = data.nama_kejuaraan;
    if (data.tingkat !== undefined) updateData.tingkat = data.tingkat;
    if (data.tanggal !== undefined) updateData.tanggal = new Date(data.tanggal);
    if (data.perolehan !== undefined) updateData.perolehan = data.perolehan;
    if (data.kategori !== undefined) updateData.kategori = data.kategori;
    if (data.lokasi_kejuaraan !== undefined) updateData.lokasi_kejuaraan = data.lokasi_kejuaraan;
    if (data.catatan !== undefined) updateData.catatan = data.catatan;
    if (data.file_url !== undefined) updateData.file_url = data.file_url;

    const updated = await prisma.prestasi.update({
      where: { id: prestasiId },
      data: updateData,
    });

    return updated;
  }

  // Delete prestasi
  static async delete(anggotaId: string, prestasiId: string) {
    // Verify anggota exists
    const anggota = await prisma.anggota_profiles.findUnique({
      where: { id: anggotaId },
    });
    if (!anggota) {
      throw new NotFoundError('Anggota tidak ditemukan');
    }

    // Verify prestasi exists and belongs to anggota
    const existing = await prisma.prestasi.findFirst({
      where: {
        id: prestasiId,
        anggota_id: anggotaId,
      },
    });
    if (!existing) {
      throw new NotFoundError('Prestasi tidak ditemukan untuk anggota ini');
    }

    await prisma.prestasi.delete({
      where: { id: prestasiId },
    });

    return { message: 'Prestasi berhasil dihapus' };
  }

  // Get stats (medals per tingkat) for an anggota
  static async getStats(anggotaId: string) {
    const anggota = await prisma.anggota_profiles.findUnique({
      where: { id: anggotaId },
    });
    if (!anggota) {
      throw new NotFoundError('Anggota tidak ditemukan');
    }

    const allPrestasi = await prisma.prestasi.findMany({
      where: { anggota_id: anggotaId },
      select: {
        tingkat: true,
        perolehan: true,
      },
    });

    const stats = {
      total: allPrestasi.length,
      per_tingkat: {
        Club: 0,
        Kabupaten: 0,
        Provinsi: 0,
        Nasional: 0,
        Internasional: 0,
      } as Record<string, number>,
      total_emas: 0,
      total_perak: 0,
      total_perunggu: 0,
    };

    for (const p of allPrestasi) {
      stats.per_tingkat[p.tingkat] = (stats.per_tingkat[p.tingkat] || 0) + 1;

      const perolehanLower = p.perolehan.toLowerCase();
      if (perolehanLower.includes('emas') || perolehanLower.includes('juara 1') || perolehanLower.includes('1st')) {
        stats.total_emas++;
      } else if (perolehanLower.includes('perak') || perolehanLower.includes('juara 2') || perolehanLower.includes('2nd')) {
        stats.total_perak++;
      } else if (perolehanLower.includes('perunggu') || perolehanLower.includes('juara 3') || perolehanLower.includes('3rd')) {
        stats.total_perunggu++;
      }
    }

    return stats;
  }
}

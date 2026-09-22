import { v4 as uuidv4 } from 'uuid';
import prisma from '../../config/database';
import { NotFoundError, ForbiddenError } from '../../middleware/errorHandler';
import { parsePaginationQuery, calculateTotalPages } from '../../utils/helpers';

export class JadwalService {
  // Get all jadwal with pagination and filters
  static async getAll(query: {
    page?: string;
    limit?: string;
    tanggal_from?: string;
    tanggal_to?: string;
    lokasi_id?: string;
    pelatih_id?: string;
    tipe?: string;
    status?: string;
  }) {
    const { page, limit, skip } = parsePaginationQuery(query);

    const where: any = {};

    if (query.tanggal_from || query.tanggal_to) {
      where.tanggal = {};
      if (query.tanggal_from) {
        where.tanggal.gte = new Date(query.tanggal_from);
      }
      if (query.tanggal_to) {
        where.tanggal.lte = new Date(query.tanggal_to);
      }
    }
    if (query.lokasi_id) {
      where.tempat_id = query.lokasi_id;
    }
    if (query.pelatih_id) {
      where.pelatih_id = query.pelatih_id;
    }
    if (query.tipe) {
      where.tipe_latihan = query.tipe;
    }
    if (query.hari) {
      where.hari = query.hari;
    }
    if (query.status) {
      where.status = query.status;
    }

    const [data, total] = await Promise.all([
      prisma.jadwal_latihan.findMany({
        where,
        include: {
          tempat: {
            select: {
              id: true,
              id_lokasi: true,
              nama: true,
              kota: true,
            },
          },
          pelatih: {
            select: {
              id: true,
              id_pelatih: true,
              nama_lengkap: true,
            },
          },
          creator: {
            select: {
              id: true,
              email: true,
            },
          },
        },
        orderBy: [
          { tanggal: 'asc' },
          { jam_mulai: 'asc' },
        ],
        skip,
        take: limit,
      }),
      prisma.jadwal_latihan.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: calculateTotalPages(total, limit),
      },
    };
  }

  // Get jadwal by ID
  static async getById(id: string) {
    const jadwal = await prisma.jadwal_latihan.findUnique({
      where: { id },
      include: {
        tempat: {
          select: {
            id: true,
            id_lokasi: true,
            nama: true,
            alamat: true,
            kota: true,
            kapasitas: true,
            jam_operasional: true,
          },
        },
        pelatih: {
          select: {
            id: true,
            id_pelatih: true,
            nama_lengkap: true,
          },
        },
        creator: {
          select: {
            id: true,
            email: true,
          },
        },
        presensi: {
          include: {
            anggota: {
              select: {
                id: true,
                id_anggota: true,
                nama_lengkap: true,
                sabuk: true,
              },
            },
          },
        },
      },
    });

    if (!jadwal) {
      throw new NotFoundError('Jadwal latihan tidak ditemukan');
    }

    return jadwal;
  }

  // Create jadwal with optional series generation
  static async create(data: {
    judul_materi: string;
    tanggal: string;
    jam_mulai: string;
    jam_selesai: string;
    tempat_id: string;
    pelatih_id?: string;
    tipe_latihan: string;
    target_peserta: string;
    catatan?: string;
    hari?: string;
    seri_id?: string;
    pengulangan?: string;
    created_by: string;
  }) {
    // Verify tempat exists
    const tempat = await prisma.tempat_latihan.findUnique({
      where: { id: data.tempat_id },
    });
    if (!tempat) {
      throw new NotFoundError('Tempat latihan tidak ditemukan');
    }

    // Auto-select pelatih from lokasi's PJ if not provided
    let pelatihId = data.pelatih_id;
    if (!pelatihId) {
      if (!tempat.pelatih_pj_id) {
        throw new AppError('Lokasi ini belum memiliki Pelatih PJ. Silakan set Pelatih PJ terlebih dahulu.', 400);
      }
      pelatihId = tempat.pelatih_pj_id;
    }

    // Verify pelatih exists
    const pelatih = await prisma.pelatih_profiles.findUnique({
      where: { id: pelatihId },
    });
    if (!pelatih) {
      throw new NotFoundError('Pelatih tidak ditemukan');
    }

    const pengulangan = data.pengulangan || 'tidak';
    const seriId = data.seri_id || (pengulangan !== 'tidak' ? uuidv4() : null);

    if (pengulangan === 'tidak') {
      // Create single jadwal
      const jadwal = await prisma.jadwal_latihan.create({
        data: {
          judul_materi: data.judul_materi,
          tanggal: new Date(data.tanggal),
          jam_mulai: new Date(data.jam_mulai),
          jam_selesai: new Date(data.jam_selesai),
          tempat_id: data.tempat_id,
          pelatih_id: pelatihId,
          tipe_latihan: data.tipe_latihan as any,
          target_peserta: data.target_peserta as any,
          hari: data.hari,
          catatan: data.catatan,
          seri_id: seriId,
          status: 'Dijadwalkan',
          created_by: data.created_by,
        },
        include: {
          tempat: { select: { id: true, nama: true, kota: true } },
          pelatih: { select: { id: true, nama_lengkap: true } },
        },
      });

      return [jadwal];
    }

    // Generate series (default 1 month forward)
    const baseDate = new Date(data.tanggal);
    const seriesEndDate = new Date(baseDate);
    seriesEndDate.setMonth(seriesEndDate.getMonth() + 1);

    const jadwals = [];
    let currentDate = new Date(baseDate);

    while (currentDate <= seriesEndDate) {
      const newJamMulai = new Date(data.jam_mulai);
      newJamMulai.setFullYear(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      const newJamSelesai = new Date(data.jam_selesai);
      newJamSelesai.setFullYear(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

      const jadwal = await prisma.jadwal_latihan.create({
        data: {
          judul_materi: data.judul_materi,
          tanggal: new Date(currentDate),
          jam_mulai: newJamMulai,
          jam_selesai: newJamSelesai,
          tempat_id: data.tempat_id,
          pelatih_id: pelatihId,
          tipe_latihan: data.tipe_latihan as any,
          target_peserta: data.target_peserta as any,
          hari: data.hari,
          catatan: data.catatan,
          seri_id: seriId,
          status: 'Dijadwalkan',
          created_by: data.created_by,
        },
        include: {
          tempat: { select: { id: true, nama: true, kota: true } },
          pelatih: { select: { id: true, nama_lengkap: true } },
        },
      });

      jadwals.push(jadwal);

      // Advance date based on recurrence type
      if (pengulangan === 'harian') {
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (pengulangan === 'mingguan') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else if (pengulangan === 'bulanan') {
        currentDate.setMonth(currentDate.getMonth() + 1);
      } else {
        break;
      }
    }

    return jadwals;
  }

  // Update jadwal
  static async update(id: string, data: {
    judul_materi?: string;
    tanggal?: string;
    jam_mulai?: string;
    jam_selesai?: string;
    tempat_id?: string;
    pelatih_id?: string;
    tipe_latihan?: string;
    target_peserta?: string;
    catatan?: string;
  }) {
    const jadwal = await prisma.jadwal_latihan.findUnique({
      where: { id },
    });

    if (!jadwal) {
      throw new NotFoundError('Jadwal latihan tidak ditemukan');
    }

    if (jadwal.status === 'Dibatalkan') {
      throw new ForbiddenError('Jadwal yang dibatalkan tidak dapat diubah');
    }

    const updateData: any = {};
    if (data.judul_materi !== undefined) updateData.judul_materi = data.judul_materi;
    if (data.tanggal !== undefined) updateData.tanggal = new Date(data.tanggal);
    if (data.jam_mulai !== undefined) updateData.jam_mulai = new Date(data.jam_mulai);
    if (data.jam_selesai !== undefined) updateData.jam_selesai = new Date(data.jam_selesai);
    if (data.tempat_id !== undefined) updateData.tempat_id = data.tempat_id;
    if (data.pelatih_id !== undefined) updateData.pelatih_id = data.pelatih_id;
    if (data.tipe_latihan !== undefined) updateData.tipe_latihan = data.tipe_latihan;
    if (data.target_peserta !== undefined) updateData.target_peserta = data.target_peserta;
    if (data.catatan !== undefined) updateData.catatan = data.catatan;

    const updated = await prisma.jadwal_latihan.update({
      where: { id },
      data: updateData,
      include: {
        tempat: { select: { id: true, nama: true, kota: true } },
        pelatih: { select: { id: true, nama_lengkap: true } },
      },
    });

    return updated;
  }

  // Batalkan jadwal
  static async batalkan(id: string, alasan: string) {
    const jadwal = await prisma.jadwal_latihan.findUnique({
      where: { id },
    });

    if (!jadwal) {
      throw new NotFoundError('Jadwal latihan tidak ditemukan');
    }

    if (jadwal.status === 'Dibatalkan') {
      throw new ForbiddenError('Jadwal sudah dibatalkan');
    }

    if (jadwal.status === 'Selesai') {
      throw new ForbiddenError('Jadwal yang sudah selesai tidak dapat dibatalkan');
    }

    const updated = await prisma.jadwal_latihan.update({
      where: { id },
      data: {
        status: 'Dibatalkan',
        catatan: alasan,
      },
      include: {
        tempat: { select: { id: true, nama: true, kota: true } },
        pelatih: { select: { id: true, nama_lengkap: true } },
      },
    });

    return updated;
  }

  // Delete jadwal
  static async delete(id: string) {
    const jadwal = await prisma.jadwal_latihan.findUnique({
      where: { id },
    });

    if (!jadwal) {
      throw new NotFoundError('Jadwal latihan tidak ditemukan');
    }

    // Check if there are presensi records
    const presensiCount = await prisma.presensi.count({
      where: { jadwal_id: id },
    });

    if (presensiCount > 0) {
      throw new ForbiddenError('Tidak dapat menghapus jadwal yang sudah memiliki data presensi');
    }

    await prisma.jadwal_latihan.delete({
      where: { id },
    });

    return { message: 'Jadwal berhasil dihapus' };
  }

  // Get kalender data
  static async getKalender(start: string, end: string) {
    const jadwals = await prisma.jadwal_latihan.findMany({
      where: {
        tanggal: {
          gte: new Date(start),
          lte: new Date(end),
        },
        status: {
          not: 'Dibatalkan',
        },
      },
      include: {
        tempat: {
          select: {
            id: true,
            nama: true,
            kota: true,
          },
        },
        pelatih: {
          select: {
            id: true,
            nama_lengkap: true,
          },
        },
      },
      orderBy: [
        { tanggal: 'asc' },
        { jam_mulai: 'asc' },
      ],
    });

    return jadwals;
  }

  // Get jadwal for current user based on role
  static async getSaya(userId: string, role: string) {
    if (role === 'pelatih') {
      // Get pelatih profile
      const pelatih = await prisma.pelatih_profiles.findUnique({
        where: { user_id: userId },
      });

      if (!pelatih) {
        return [];
      }

      const jadwals = await prisma.jadwal_latihan.findMany({
        where: {
          pelatih_id: pelatih.id,
          status: {
            not: 'Dibatalkan',
          },
        },
        include: {
          tempat: {
            select: {
              id: true,
              nama: true,
              kota: true,
            },
          },
        },
        orderBy: [
          { tanggal: 'desc' },
          { jam_mulai: 'desc' },
        ],
        take: 50,
      });

      return jadwals;
    }

    if (role === 'anggota') {
      // Get anggota profile
      const anggota = await prisma.anggota_profiles.findUnique({
        where: { user_id: userId },
      });

      if (!anggota) {
        return [];
      }

      // Get jadwal at the anggota's assigned location
      const penugasan = await prisma.penugasan.findFirst({
        where: {
          anggota_id: anggota.id,
          status: 'Aktif',
        },
      });

      if (!penugasan) {
        return [];
      }

      const jadwals = await prisma.jadwal_latihan.findMany({
        where: {
          tempat_id: penugasan.tempat_id,
          status: {
            not: 'Dibatalkan',
          },
        },
        include: {
          tempat: {
            select: {
              id: true,
              nama: true,
              kota: true,
            },
          },
          pelatih: {
            select: {
              id: true,
              nama_lengkap: true,
            },
          },
        },
        orderBy: [
          { tanggal: 'desc' },
          { jam_mulai: 'desc' },
        ],
        take: 50,
      });

      return jadwals;
    }

    return [];
  }
}

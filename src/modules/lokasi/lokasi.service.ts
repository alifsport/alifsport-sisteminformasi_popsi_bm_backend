import prisma from '../../config/database';
import { NotFoundError, ConflictError, AppError } from '../../middleware/errorHandler';
import { generateIdLokasi } from '../../utils/idGenerator';

interface LokasiQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  kota?: string;
  pelatih_pj?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export class LokasiService {
  // Get all lokasi with pagination, search, filter, sort
  static async getAll(query: LokasiQuery) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Search filter
    if (query.search) {
      where.OR = [
        { nama: { contains: query.search, mode: 'insensitive' } },
        { kota: { contains: query.search, mode: 'insensitive' } },
        { alamat: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Status filter
    if (query.status) {
      where.status = query.status;
    }

    // Kota filter
    if (query.kota) {
      where.kota = { contains: query.kota, mode: 'insensitive' };
    }

    // Pelatih PJ filter
    if (query.pelatih_pj) {
      where.pelatih_pj_id = query.pelatih_pj;
    }

    // Sort
    const orderBy: any = {};
    const sortField = query.sort || 'created_at';
    const sortOrder = query.order || 'desc';
    orderBy[sortField] = sortOrder;

    const [data, total] = await Promise.all([
      prisma.tempat_latihan.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          pelatih_pj: {
            select: {
              id: true,
              id_pelatih: true,
              nama_lengkap: true,
              no_telepon: true,
            },
          },
          _count: {
            select: {
              penugasan: {
                where: { status: 'Aktif' },
              },
              jadwal_latihan: true,
            },
          },
        },
      }),
      prisma.tempat_latihan.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: data.map((lokasi) => ({
        ...lokasi,
        anggota_count: lokasi._count.penugasan,
        jadwal_count: lokasi._count.jadwal_latihan,
        _count: undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  // Get lokasi by ID with detail
  static async getById(id: string) {
    const lokasi = await prisma.tempat_latihan.findUnique({
      where: { id },
      include: {
        pelatih_pj: {
          select: {
            id: true,
            id_pelatih: true,
            nama_lengkap: true,
            no_telepon: true,
            email_pribadi: true,
            foto_url: true,
          },
        },
        penugasan: {
          where: { status: 'Aktif' },
          include: {
            anggota: {
              select: {
                id: true,
                id_anggota: true,
                nama_lengkap: true,
                sabuk: true,
                foto_url: true,
                no_telepon: true,
              },
            },
          },
        },
        _count: {
          select: {
            jadwal_latihan: true,
          },
        },
      },
    });

    if (!lokasi) {
      throw new NotFoundError('Lokasi tidak ditemukan');
    }

    return {
      ...lokasi,
      anggota_count: lokasi.penugasan.length,
      kapasitas: lokasi.kapasitas,
      sisa_kapasitas: lokasi.kapasitas - lokasi.penugasan.length,
      anggota_list: lokasi.penugasan.map((p) => p.anggota),
      penugasan: undefined,
      jadwal_count: lokasi._count.jadwal_latihan,
      _count: undefined,
    };
  }

  // Create lokasi
  static async create(data: any, userId: string) {
    // Check nama uniqueness
    const existingNama = await prisma.tempat_latihan.findFirst({
      where: { nama: data.nama },
    });

    if (existingNama) {
      throw new ConflictError('Nama lokasi sudah digunakan');
    }

    // Validate pelatih_pj_id if provided
    let validPelatihPjId = null;
    if (data.pelatih_pj_id) {
      const pelatih = await prisma.pelatih_profiles.findUnique({
        where: { id: data.pelatih_pj_id },
      });

      if (pelatih) {
        validPelatihPjId = pelatih.id;
      }
    }

    // Generate auto ID
    const id_lokasi = await generateIdLokasi();

    const lokasi = await prisma.tempat_latihan.create({
      data: {
        id_lokasi,
        nama: data.nama,
        alamat: data.alamat || null,
        kota: data.kota,
        provinsi: data.provinsi,
        kecamatan: data.kecamatan || null,
        kelurahan: data.kelurahan || null,
        desa: data.desa || null,
        kode_pos: data.kode_pos || null,
        jam_operasional: data.jam_operasional,
        kapasitas: data.kapasitas,
        pelatih_pj_id: validPelatihPjId,
        foto_urls: data.foto_urls || [],
        status: data.status || 'Aktif',
      },
      include: {
        pelatih_pj: {
          select: {
            id: true,
            id_pelatih: true,
            nama_lengkap: true,
          },
        },
      },
    });

    // Audit log (skip if userId invalid)
    if (userId) {
      await prisma.audit_logs.create({
        data: {
          user_id: userId,
          aksi: 'create',
          entitas: 'lokasi',
          entitas_id: lokasi.id,
          detail: { nama: lokasi.nama, id_lokasi: lokasi.id_lokasi },
        },
      });
    }

    return lokasi;
  }

  // Update lokasi
  static async update(id: string, data: any, userId: string) {
    const existing = await prisma.tempat_latihan.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundError('Lokasi tidak ditemukan');
    }

    // Check nama uniqueness if changing
    if (data.nama && data.nama !== existing.nama) {
      const duplicateName = await prisma.tempat_latihan.findFirst({
        where: { nama: data.nama, id: { not: id } },
      });

      if (duplicateName) {
        throw new ConflictError('Nama lokasi sudah digunakan');
      }
    }

    // Validate pelatih_pj_id if changing
    if (data.pelatih_pj_id !== undefined && data.pelatih_pj_id !== null) {
      const pelatih = await prisma.pelatih_profiles.findUnique({
        where: { id: data.pelatih_pj_id },
      });

      if (!pelatih) {
        throw new NotFoundError('Pelatih penanggung jawab tidak ditemukan');
      }
    }

    const updateData: any = {};

    if (data.nama !== undefined) updateData.nama = data.nama;
    if (data.alamat !== undefined) updateData.alamat = data.alamat;
    if (data.kota !== undefined) updateData.kota = data.kota;
    if (data.provinsi !== undefined) updateData.provinsi = data.provinsi;
    if (data.kecamatan !== undefined) updateData.kecamatan = data.kecamatan;
    if (data.kelurahan !== undefined) updateData.kelurahan = data.kelurahan;
    if (data.desa !== undefined) updateData.desa = data.desa;
    if (data.kode_pos !== undefined) updateData.kode_pos = data.kode_pos;
    if (data.jam_operasional !== undefined) updateData.jam_operasional = data.jam_operasional;
    if (data.kapasitas !== undefined) updateData.kapasitas = data.kapasitas;
    if (data.pelatih_pj_id !== undefined) updateData.pelatih_pj_id = data.pelatih_pj_id;
    if (data.foto_urls !== undefined) updateData.foto_urls = data.foto_urls;
    if (data.status !== undefined) updateData.status = data.status;

    updateData.updated_at = new Date();

    const lokasi = await prisma.tempat_latihan.update({
      where: { id },
      data: updateData,
      include: {
        pelatih_pj: {
          select: {
            id: true,
            id_pelatih: true,
            nama_lengkap: true,
          },
        },
      },
    });

    // Audit log (skip if userId invalid)
    if (userId) {
      await prisma.audit_logs.create({
        data: {
          user_id: userId,
          aksi: 'update',
          entitas: 'lokasi',
          entitas_id: lokasi.id,
          detail: { updated_fields: Object.keys(updateData) },
        },
      });
    }

    return lokasi;
  }

  // Delete lokasi - only if no active anggota or upcoming jadwal
  static async delete(id: string, userId: string) {
    const lokasi = await prisma.tempat_latihan.findUnique({ where: { id } });

    if (!lokasi) {
      throw new NotFoundError('Lokasi tidak ditemukan');
    }

    // Check for active anggota
    const activeAnggota = await prisma.penugasan.count({
      where: {
        tempat_id: id,
        status: 'Aktif',
      },
    });

    if (activeAnggota > 0) {
      throw new AppError(
        `Tidak dapat menghapus lokasi. Masih ada ${activeAnggota} anggota aktif yang ditugaskan.`,
        400
      );
    }

    // Check for upcoming jadwal
    const upcomingJadwal = await prisma.jadwal_latihan.count({
      where: {
        tempat_id: id,
        status: { in: ['Dijadwalkan', 'Berlangsung'] },
        tanggal: { gte: new Date() },
      },
    });

    if (upcomingJadwal > 0) {
      throw new AppError(
        `Tidak dapat menghapus lokasi. Masih ada ${upcomingJadwal} jadwal latihan mendatang.`,
        400
      );
    }

    await prisma.tempat_latihan.delete({ where: { id } });

    // Audit log (skip if userId invalid)
    if (userId) {
      await prisma.audit_logs.create({
        data: {
          user_id: userId,
          aksi: 'delete',
          entitas: 'lokasi',
          entitas_id: id,
          detail: { nama: lokasi.nama, id_lokasi: lokasi.id_lokasi },
        },
      });
    }
  }

  // Toggle status lokasi
  static async toggleStatus(id: string, userId: string) {
    const lokasi = await prisma.tempat_latihan.findUnique({ where: { id } });

    if (!lokasi) {
      throw new NotFoundError('Lokasi tidak ditemukan');
    }

    const statusCycle: Record<string, string> = {
      Aktif: 'Tidak_Aktif',
      Tidak_Aktif: 'Maintenance',
      Maintenance: 'Aktif',
    };

    const newStatus = statusCycle[lokasi.status] as 'Aktif' | 'Tidak_Aktif' | 'Maintenance';

    const updated = await prisma.tempat_latihan.update({
      where: { id },
      data: {
        status: newStatus,
        updated_at: new Date(),
      },
    });

    // Audit log (skip if userId invalid)
    if (userId) {
      await prisma.audit_logs.create({
        data: {
          user_id: userId,
          aksi: 'update',
          entitas: 'lokasi',
          entitas_id: id,
          detail: { action: 'toggle_status', from: lokasi.status, to: newStatus },
        },
      });
    }

    return updated;
  }

  // Get anggota in lokasi
  static async getAnggota(id: string, query: { page?: number; limit?: number; search?: string }) {
    const lokasi = await prisma.tempat_latihan.findUnique({ where: { id } });

    if (!lokasi) {
      throw new NotFoundError('Lokasi tidak ditemukan');
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      tempat_id: id,
      status: 'Aktif',
    };

    const penugasanWhere: any = {
      ...where,
    };

    if (query.search) {
      penugasanWhere.anggota = {
        nama_lengkap: { contains: query.search, mode: 'insensitive' },
      };
    }

    const [penugasan, total] = await Promise.all([
      prisma.penugasan.findMany({
        where: penugasanWhere,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          anggota: {
            select: {
              id: true,
              id_anggota: true,
              nama_lengkap: true,
              sabuk: true,
              foto_url: true,
              no_telepon: true,
              jenis_kelamin: true,
              tanggal_gabung: true,
              status_keanggotaan: true,
            },
          },
        },
      }),
      prisma.penugasan.count({ where: penugasanWhere }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: penugasan.map((p) => ({
        ...p.anggota,
        penugasan_id: p.id,
        tanggal_mulai: p.tanggal_mulai,
        tanggal_selesai: p.tanggal_selesai,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  // Get jadwal in lokasi
  static async getJadwal(id: string, query: { page?: number; limit?: number; status?: string }) {
    const lokasi = await prisma.tempat_latihan.findUnique({ where: { id } });

    if (!lokasi) {
      throw new NotFoundError('Lokasi tidak ditemukan');
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      tempat_id: id,
    };

    if (query.status) {
      where.status = query.status;
    }

    const [jadwal, total] = await Promise.all([
      prisma.jadwal_latihan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { tanggal: 'desc' },
        include: {
          pelatih: {
            select: {
              id: true,
              id_pelatih: true,
              nama_lengkap: true,
              foto_url: true,
            },
          },
          _count: {
            select: { presensi: true },
          },
        },
      }),
      prisma.jadwal_latihan.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: jadwal.map((j) => ({
        ...j,
        presensi_count: j._count.presensi,
        _count: undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  // Get stats per lokasi
  static async getStats() {
    const lokasiList = await prisma.tempat_latihan.findMany({
      select: {
        id: true,
        id_lokasi: true,
        nama: true,
        kota: true,
        status: true,
        kapasitas: true,
        _count: {
          select: {
            penugasan: {
              where: { status: 'Aktif' },
            },
            jadwal_latihan: true,
          },
        },
        pelatih_pj: {
          select: {
            id: true,
            nama_lengkap: true,
          },
        },
      },
      orderBy: { nama: 'asc' },
    });

    const totalAnggota = await prisma.penugasan.count({
      where: { status: 'Aktif' },
    });

    const totalJadwal = await prisma.jadwal_latihan.count();

    const statusCounts = await prisma.tempat_latihan.groupBy({
      by: ['status'],
      _count: true,
    });

    return {
      summary: {
        total_lokasi: lokasiList.length,
        total_anggota: totalAnggota,
        total_jadwal: totalJadwal,
        status_counts: statusCounts.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {} as Record<string, number>),
      },
      lokasi: lokasiList.map((lokasi) => ({
        id: lokasi.id,
        id_lokasi: lokasi.id_lokasi,
        nama: lokasi.nama,
        kota: lokasi.kota,
        status: lokasi.status,
        kapasitas: lokasi.kapasitas,
        anggota_count: lokasi._count.penugasan,
        jadwal_count: lokasi._count.jadwal_latihan,
        persentase_terisi: lokasi.kapasitas > 0
          ? Math.round((lokasi._count.penugasan / lokasi.kapasitas) * 100)
          : 0,
        pelatih_pj: lokasi.pelatih_pj?.nama_lengkap || null,
      })),
    };
  }
}

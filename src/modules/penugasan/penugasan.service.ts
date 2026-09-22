import prisma from '../../config/database';
import { NotFoundError, ForbiddenError } from '../../middleware/errorHandler';
import { parsePaginationQuery, calculateTotalPages } from '../../utils/helpers';

export class PenugasanService {
  // Get all penugasan with pagination and filters
  static async getAll(query: { page?: string; limit?: string; lokasi_id?: string; status?: string }) {
    const { page, limit, skip } = parsePaginationQuery(query);

    const where: any = {};
    if (query.lokasi_id) {
      where.tempat_id = query.lokasi_id;
    }
    if (query.status) {
      where.status = query.status;
    }

    const [data, total] = await Promise.all([
      prisma.penugasan.findMany({
        where,
        include: {
          anggota: {
            select: {
              id: true,
              id_anggota: true,
              nama_lengkap: true,
              sabuk: true,
              status_keanggotaan: true,
            },
          },
          tempat: {
            select: {
              id: true,
              id_lokasi: true,
              nama: true,
              kota: true,
            },
          },
          creator: {
            select: {
              id: true,
              email: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.penugasan.count({ where }),
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

  // Get penugasan by ID
  static async getById(id: string) {
    const penugasan = await prisma.penugasan.findUnique({
      where: { id },
      include: {
        anggota: {
          select: {
            id: true,
            id_anggota: true,
            nama_lengkap: true,
            sabuk: true,
            status_keanggotaan: true,
            no_telepon: true,
            alamat: true,
          },
        },
        tempat: {
          select: {
            id: true,
            id_lokasi: true,
            nama: true,
            alamat: true,
            kota: true,
            provinsi: true,
            kapasitas: true,
            jam_operasional: true,
          },
        },
        creator: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!penugasan) {
      throw new NotFoundError('Penugasan tidak ditemukan');
    }

    return penugasan;
  }

  // Create penugasan
  static async create(data: {
    anggota_id: string;
    tempat_id: string;
    tanggal_mulai: string;
    alasan?: string;
    created_by: string;
  }) {
    // Verify anggota exists
    const anggota = await prisma.anggota_profiles.findUnique({
      where: { id: data.anggota_id },
    });
    if (!anggota) {
      throw new NotFoundError('Anggota tidak ditemukan');
    }

    // Verify tempat exists
    const tempat = await prisma.tempat_latihan.findUnique({
      where: { id: data.tempat_id },
    });
    if (!tempat) {
      throw new NotFoundError('Tempat latihan tidak ditemukan');
    }

    // Check if anggota has an active penugasan -> auto-end it
    const activePenugasan = await prisma.penugasan.findFirst({
      where: {
        anggota_id: data.anggota_id,
        status: 'Aktif',
      },
    });

    if (activePenugasan) {
      await prisma.penugasan.update({
        where: { id: activePenugasan.id },
        data: {
          tanggal_selesai: new Date(),
          status: 'Dipindahkan',
        },
      });
    }

    // Create the new penugasan
    const penugasan = await prisma.penugasan.create({
      data: {
        anggota_id: data.anggota_id,
        tempat_id: data.tempat_id,
        tanggal_mulai: new Date(data.tanggal_mulai),
        alasan: data.alasan,
        status: 'Aktif',
        created_by: data.created_by,
      },
      include: {
        anggota: {
          select: {
            id: true,
            id_anggota: true,
            nama_lengkap: true,
            sabuk: true,
          },
        },
        tempat: {
          select: {
            id: true,
            id_lokasi: true,
            nama: true,
            kota: true,
          },
        },
      },
    });

    return penugasan;
  }

  // Transfer penugasan
  static async transfer(data: {
    anggota_id: string;
    tempat_id_baru: string;
    alasan: string;
    created_by: string;
  }) {
    // Verify anggota exists
    const anggota = await prisma.anggota_profiles.findUnique({
      where: { id: data.anggota_id },
    });
    if (!anggota) {
      throw new NotFoundError('Anggota tidak ditemukan');
    }

    // Verify new tempat exists
    const tempat = await prisma.tempat_latihan.findUnique({
      where: { id: data.tempat_id_baru },
    });
    if (!tempat) {
      throw new NotFoundError('Tempat latihan tidak ditemukan');
    }

    // Find the current active penugasan
    const activePenugasan = await prisma.penugasan.findFirst({
      where: {
        anggota_id: data.anggota_id,
        status: 'Aktif',
      },
    });

    if (!activePenugasan) {
      throw new NotFoundError('Tidak ada penugasan aktif untuk anggota ini');
    }

    // Auto-end old penugasan
    await prisma.penugasan.update({
      where: { id: activePenugasan.id },
      data: {
        tanggal_selesai: new Date(),
        status: 'Dipindahkan',
        alasan: data.alasan,
      },
    });

    // Create new penugasan at the new location
    const newPenugasan = await prisma.penugasan.create({
      data: {
        anggota_id: data.anggota_id,
        tempat_id: data.tempat_id_baru,
        tanggal_mulai: new Date(),
        alasan: data.alasan,
        status: 'Aktif',
        created_by: data.created_by,
      },
      include: {
        anggota: {
          select: {
            id: true,
            id_anggota: true,
            nama_lengkap: true,
            sabuk: true,
          },
        },
        tempat: {
          select: {
            id: true,
            id_lokasi: true,
            nama: true,
            kota: true,
          },
        },
      },
    });

    return newPenugasan;
  }

  // End penugasan (set status Selesai)
  static async delete(id: string) {
    const penugasan = await prisma.penugasan.findUnique({
      where: { id },
    });

    if (!penugasan) {
      throw new NotFoundError('Penugasan tidak ditemukan');
    }

    if (penugasan.status !== 'Aktif') {
      throw new ForbiddenError('Hanya penugasan aktif yang dapat diakhiri');
    }

    const updated = await prisma.penugasan.update({
      where: { id },
      data: {
        tanggal_selesai: new Date(),
        status: 'Selesai',
      },
      include: {
        anggota: {
          select: {
            id: true,
            id_anggota: true,
            nama_lengkap: true,
            sabuk: true,
          },
        },
        tempat: {
          select: {
            id: true,
            id_lokasi: true,
            nama: true,
            kota: true,
          },
        },
      },
    });

    return updated;
  }

  // Get riwayat penugasan for one anggota
  static async getRiwayat(anggotaId: string) {
    const anggota = await prisma.anggota_profiles.findUnique({
      where: { id: anggotaId },
    });
    if (!anggota) {
      throw new NotFoundError('Anggota tidak ditemukan');
    }

    const riwayat = await prisma.penugasan.findMany({
      where: { anggota_id: anggotaId },
      include: {
        tempat: {
          select: {
            id: true,
            id_lokasi: true,
            nama: true,
            kota: true,
            provinsi: true,
          },
        },
        creator: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return riwayat;
  }
}

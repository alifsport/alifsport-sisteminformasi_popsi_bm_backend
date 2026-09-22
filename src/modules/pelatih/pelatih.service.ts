import bcrypt from 'bcryptjs';
import prisma from '../../config/database';
import { NotFoundError, ConflictError, AppError } from '../../middleware/errorHandler';
import { generateIdPelatih } from '../../utils/idGenerator';
import { generateRandomPassword, parsePaginationQuery, calculateTotalPages } from '../../utils/helpers';

export class PelatihService {
  // ==================== GET ALL ====================
  static async getAll(query: any) {
    const { page, limit, skip } = parsePaginationQuery(query);
    const { search, lokasi, sort, order } = query;

    const where: any = { deleted_at: null };

    if (search) {
      where.OR = [
        { nama_lengkap: { contains: search, mode: 'insensitive' } },
        { id_pelatih: { contains: search, mode: 'insensitive' } },
        { no_telepon: { contains: search } },
        { email_pribadi: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (lokasi) {
      where.tempat_melatih_id = lokasi;
    }

    const orderBy: any = {};
    if (sort) orderBy[sort] = order || 'desc';
    else orderBy.created_at = 'desc';

    const [data, total] = await Promise.all([
      prisma.pelatih_profiles.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, status: true } },
          tempat_melatih: { select: { id: true, id_lokasi: true, nama: true, kota: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.pelatih_profiles.count({ where }),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: calculateTotalPages(total, limit) },
    };
  }

  // ==================== GET ACTIVE PJ (Pelatih yang menjadi PJ aktif di minimal 1 lokasi) ====================
  static async getActivePJ() {
    // Get all lokasi that have a pelatih_pj_id set
    const lokasiWithPJ = await prisma.tempat_latihan.findMany({
      where: {
        pelatih_pj_id: { not: null },
        status: 'Aktif',
      },
      select: { pelatih_pj_id: true },
    });

    // Get unique pelatih IDs
    const pelatihIds = [...new Set(lokasiWithPJ.map(l => l.pelatih_pj_id).filter(Boolean))] as string[];

    if (pelatihIds.length === 0) return [];

    // Get pelatih profiles for those IDs
    const pelatih = await prisma.pelatih_profiles.findMany({
      where: {
        id: { in: pelatihIds },
        deleted_at: null,
      },
      select: {
        id: true,
        id_pelatih: true,
        nama_lengkap: true,
      },
      orderBy: { nama_lengkap: 'asc' },
    });

    return pelatih;
  }

  // ==================== GET BY ID ====================
  static async getById(id: string) {
    const pelatih = await prisma.pelatih_profiles.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, status: true, last_login_at: true, created_at: true } },
        tempat_melatih: { select: { id: true, id_lokasi: true, nama: true, alamat: true, kota: true, provinsi: true, kapasitas: true, status: true } },
      },
    });

    if (!pelatih) throw new NotFoundError('Data pelatih tidak ditemukan');

    // Count anggota di lokasi pelatih
    let anggotaCount = 0;
    if (pelatih.tempat_melatih_id) {
      anggotaCount = await prisma.anggota_profiles.count({
        where: { tempat_latihan_saat_ini_id: pelatih.tempat_melatih_id, deleted_at: null },
      });
    }

    return { ...pelatih, anggota_count: anggotaCount };
  }

  // ==================== CREATE ====================
  static async create(data: any) {
    // Check email uniqueness
    const existingUser = await prisma.users.findUnique({ where: { email: data.email } });
    if (existingUser) throw new ConflictError('Email sudah terdaftar');

    // Check email_pribadi uniqueness
    if (data.email_pribadi) {
      const existing = await prisma.pelatih_profiles.findFirst({ where: { email_pribadi: data.email_pribadi } });
      if (existing) throw new ConflictError('Email pribadi sudah terdaftar');
    }

    // Validate tempat_melatih exists
    if (data.tempat_melatih_id) {
      const lokasi = await prisma.tempat_latihan.findUnique({ where: { id: data.tempat_melatih_id } });
      if (!lokasi) throw new NotFoundError('Tempat melatih tidak ditemukan');
    }

    const idPelatih = await generateIdPelatih();
    const plainPassword = 'pelatih123';
    const passwordHash = await bcrypt.hash(plainPassword, 12);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: { email: data.email, password_hash: passwordHash, role: 'pelatih', status: 'active' },
      });

      const pelatih = await tx.pelatih_profiles.create({
        data: {
          user_id: user.id,
          id_pelatih: idPelatih,
          nama_lengkap: data.nama_lengkap,
          tempat_lahir: data.tempat_lahir,
          tanggal_lahir: new Date(data.tanggal_lahir),
          jenis_kelamin: data.jenis_kelamin,
          alamat: data.alamat,
          no_telepon: data.no_telepon,
          email_pribadi: data.email_pribadi || null,
          foto_url: data.foto_url || null,
          sabuk: data.sabuk,
          tempat_melatih_id: data.tempat_melatih_id || null,
          tanggal_gabung: new Date(data.tanggal_gabung),
        },
        include: {
          user: { select: { id: true, email: true, status: true } },
          tempat_melatih: { select: { id: true, id_lokasi: true, nama: true, kota: true } },
        },
      });

      await tx.audit_logs.create({
        data: { aksi: 'create', entitas: 'pelatih', entitas_id: user.id, detail: { id_pelatih: idPelatih, nama_lengkap: data.nama_lengkap, email: data.email } },
      });

      return { pelatih, plainPassword };
    });

    return { ...result.pelatih, _debug: { plain_password: result.plainPassword } };
  }

  // ==================== UPDATE ====================
  static async update(id: string, data: any) {
    const existing = await prisma.pelatih_profiles.findUnique({ where: { id }, include: { user: true } });
    if (!existing) throw new NotFoundError('Data pelatih tidak ditemukan');

    if (data.email && data.email !== existing.user.email) {
      const emailExists = await prisma.users.findUnique({ where: { email: data.email } });
      if (emailExists) throw new ConflictError('Email sudah terdaftar');
    }

    if (data.email_pribadi && data.email_pribadi !== existing.email_pribadi) {
      const epExists = await prisma.pelatih_profiles.findFirst({ where: { email_pribadi: data.email_pribadi, id: { not: id } } });
      if (epExists) throw new ConflictError('Email pribadi sudah terdaftar');
    }

    if (data.tempat_melatih_id) {
      const lokasi = await prisma.tempat_latihan.findUnique({ where: { id: data.tempat_melatih_id } });
      if (!lokasi) throw new NotFoundError('Tempat melatih tidak ditemukan');
    }

    const updateData: any = {};
    const allowedFields = ['nama_lengkap', 'tempat_lahir', 'tanggal_lahir', 'jenis_kelamin', 'alamat', 'no_telepon', 'email_pribadi', 'foto_url', 'sabuk', 'tempat_melatih_id', 'tanggal_gabung'];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        if (field === 'tanggal_lahir' || field === 'tanggal_gabung') updateData[field] = new Date(data[field]);
        else updateData[field] = data[field];
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.pelatih_profiles.update({
        where: { id },
        data: updateData,
        include: {
          user: { select: { id: true, email: true, status: true } },
          tempat_melatih: { select: { id: true, id_lokasi: true, nama: true, kota: true } },
        },
      });

      if (data.email && data.email !== existing.user.email) {
        await tx.users.update({ where: { id: existing.user_id }, data: { email: data.email } });
      }

      await tx.audit_logs.create({
        data: { aksi: 'update', entitas: 'pelatih', entitas_id: existing.user_id, detail: { id_pelatih: existing.id_pelatih, updated_fields: Object.keys(updateData) } },
      });

      return updated;
    });

    return result;
  }

  // ==================== DELETE (Nonaktifkan) ====================
  static async delete(id: string) {
    const existing = await prisma.pelatih_profiles.findUnique({ where: { id }, include: { user: true } });
    if (!existing) throw new NotFoundError('Data pelatih tidak ditemukan');
    if (existing.deleted_at) throw new NotFoundError('Pelatih sudah diarsipkan');

    const result = await prisma.$transaction(async (tx) => {
      // Soft delete pelatih profile
      await tx.pelatih_profiles.update({ where: { id }, data: { deleted_at: new Date() } });

      // Deactivate user login
      await tx.users.update({ where: { id: existing.user_id }, data: { status: 'inactive' } });

      await tx.audit_logs.create({
        data: { aksi: 'delete', entitas: 'pelatih', entitas_id: existing.user_id, detail: { id_pelatih: existing.id_pelatih, nama_lengkap: existing.nama_lengkap } },
      });

      return { message: 'Pelatih berhasil diarsipkan' };
    });

    return result;
  }

  // ==================== GET ARCHIVED ====================
  static async getArchived() {
    return prisma.pelatih_profiles.findMany({
      where: { deleted_at: { not: null } },
      include: {
        user: { select: { id: true, email: true, status: true } },
      },
      orderBy: { deleted_at: 'desc' },
    });
  }

  // ==================== RESTORE ====================
  static async restore(id: string) {
    const existing = await prisma.pelatih_profiles.findUnique({ where: { id }, include: { user: true } });
    if (!existing) throw new NotFoundError('Data pelatih tidak ditemukan');
    if (!existing.deleted_at) throw new NotFoundError('Pelatih tidak dalam status arsip');

    await prisma.$transaction(async (tx) => {
      await tx.pelatih_profiles.update({ where: { id }, data: { deleted_at: null } });
      await tx.users.update({ where: { id: existing.user_id }, data: { status: 'active' } });
      await tx.audit_logs.create({
        data: { aksi: 'create', entitas: 'pelatih', entitas_id: existing.user_id, detail: { id_pelatih: existing.id_pelatih, nama_lengkap: existing.nama_lengkap, action: 'restore' } },
      }).catch(() => {});
    });

    return { message: 'Pelatih berhasil dipulihkan' };
  }

  // ==================== DELETE PREVIEW (data terkait sebelum hapus permanen) ====================
  static async getDeletePreview(id: string) {
    const existing = await prisma.pelatih_profiles.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Data pelatih tidak ditemukan');

    // Count all related data
    const jadwalRecords = await prisma.jadwal_latihan.findMany({ where: { pelatih_id: id }, select: { id: true } });
    const jadwalIds = jadwalRecords.map(j => j.id);
    const [jadwalCount, presensiCount, anggotaPertamaCount, anggotaSaatIniCount, lokasiPJCount, auditLogCount] = await Promise.all([
      prisma.jadwal_latihan.count({ where: { pelatih_id: id } }),
      jadwalIds.length > 0 ? prisma.presensi.count({ where: { jadwal_id: { in: jadwalIds } } }) : Promise.resolve(0),
      prisma.anggota_profiles.count({ where: { pelatih_pertama_id: id } }),
      prisma.anggota_profiles.count({ where: { pelatih_saat_ini_id: id } }),
      prisma.tempat_latihan.count({ where: { pelatih_pj_id: id } }),
      prisma.audit_logs.count({ where: { entitas: 'pelatih', entitas_id: existing.user_id } }),
    ]);

    // Get jadwal details (up to 10)
    const jadwalList = await prisma.jadwal_latihan.findMany({
      where: { pelatih_id: id },
      select: { id: true, judul_materi: true, tanggal: true, status: true },
      orderBy: { tanggal: 'desc' },
      take: 10,
    });

    // Get anggota details (pelatih pertama)
    const anggotaPertamaList = await prisma.anggota_profiles.findMany({
      where: { pelatih_pertama_id: id },
      select: { id: true, nama_lengkap: true, id_anggota: true },
      take: 10,
    });

    // Get anggota details (pelatih saat ini)
    const anggotaSaatIniList = await prisma.anggota_profiles.findMany({
      where: { pelatih_saat_ini_id: id },
      select: { id: true, nama_lengkap: true, id_anggota: true },
      take: 10,
    });

    // Get lokasi PJ details
    const lokasiPJList = await prisma.tempat_latihan.findMany({
      where: { pelatih_pj_id: id },
      select: { id: true, nama: true, kota: true },
    });

    return {
      pelatih: { id: existing.id, nama_lengkap: existing.nama_lengkap, id_pelatih: existing.id_pelatih },
      summary: {
        jadwal: jadwalCount,
        presensi: presensiCount,
        anggotaPertama: anggotaPertamaCount,
        anggotaSaatIni: anggotaSaatIniCount,
        lokasiPJ: lokasiPJCount,
        auditLog: auditLogCount,
        total: jadwalCount + presensiCount + anggotaPertamaCount + anggotaSaatIniCount + lokasiPJCount + auditLogCount,
      },
      details: {
        jadwal: jadwalList,
        presensi: presensiCount,
        anggotaPertama: anggotaPertamaList,
        anggotaSaatIni: anggotaSaatIniList,
        lokasiPJ: lokasiPJList,
      },
    };
  }

  // ==================== PERMANENT DELETE ====================
  static async permanentDelete(id: string) {
    const existing = await prisma.pelatih_profiles.findUnique({ where: { id }, include: { user: true } });
    if (!existing) throw new NotFoundError('Data pelatih tidak ditemukan');
    if (!existing.deleted_at) throw new NotFoundError('Hanya pelatih yang diarsipkan yang bisa dihapus permanen');

    await prisma.$transaction(async (tx) => {
      // 1. Delete presensi records linked to this pelatih's jadwal
      const jadwalRecords = await tx.jadwal_latihan.findMany({ where: { pelatih_id: id }, select: { id: true } });
      const jadwalIds = jadwalRecords.map(j => j.id);
      if (jadwalIds.length > 0) {
        await tx.presensi.deleteMany({ where: { jadwal_id: { in: jadwalIds } } });
      }

      // 2. Delete jadwal_latihan linked to this pelatih
      await tx.jadwal_latihan.deleteMany({ where: { pelatih_id: id } });

      // 3. Unlink anggota (pelatih_pertama_id → null)
      await tx.anggota_profiles.updateMany({ where: { pelatih_pertama_id: id }, data: { pelatih_pertama_id: null } });

      // 4. Unlink anggota (pelatih_saat_ini_id → null)
      await tx.anggota_profiles.updateMany({ where: { pelatih_saat_ini_id: id }, data: { pelatih_saat_ini_id: null } });

      // 5. Unlink lokasi PJ (pelatih_pj_id → null)
      await tx.tempat_latihan.updateMany({ where: { pelatih_pj_id: id }, data: { pelatih_pj_id: null } });

      // 6. Delete audit logs referencing this pelatih
      await tx.audit_logs.deleteMany({ where: { entitas: 'pelatih', entitas_id: existing.user_id } });

      // 7. Delete pelatih profile FIRST (before user, because user cascade would delete it)
      await tx.pelatih_profiles.delete({ where: { id } });

      // 8. Delete user account
      await tx.users.delete({ where: { id: existing.user_id } });
    });

    return { message: 'Pelatih berhasil dihapus permanen' };
  }

  // ==================== TOGGLE STATUS ====================
  static async toggleStatus(id: string) {
    const existing = await prisma.pelatih_profiles.findUnique({ where: { id }, include: { user: true } });
    if (!existing) throw new NotFoundError('Data pelatih tidak ditemukan');

    const newStatus = existing.user.status === 'active' ? 'inactive' : 'active';

    await prisma.$transaction(async (tx) => {
      await tx.users.update({ where: { id: existing.user_id }, data: { status: newStatus as any } });

      await tx.audit_logs.create({
        data: { aksi: 'update', entitas: 'pelatih', entitas_id: existing.user_id, detail: { id_pelatih: existing.id_pelatih, new_status: newStatus } },
      });
    });

    return { message: `Pelatih berhasil ${newStatus === 'active' ? 'diaktifkan' : 'dinonaktifkan'}` };
  }

  // ==================== GET ANGGOTA ====================
  static async getAnggota(id: string) {
    const pelatih = await prisma.pelatih_profiles.findUnique({ where: { id } });
    if (!pelatih) throw new NotFoundError('Data pelatih tidak ditemukan');

    if (!pelatih.tempat_melatih_id) {
      return { data: [], message: 'Pelatih belum ditugaskan ke lokasi manapun' };
    }

    const anggotaList = await prisma.anggota_profiles.findMany({
      where: { tempat_latihan_saat_ini_id: pelatih.tempat_melatih_id, deleted_at: null },
      include: { user: { select: { id: true, email: true, status: true } } },
      orderBy: { nama_lengkap: 'asc' },
    });

    return { data: anggotaList, total: anggotaList.length };
  }
}

import bcrypt from 'bcryptjs';
import prisma from '../../config/database';
import { NotFoundError, ConflictError } from '../../middleware/errorHandler';
import { parsePaginationQuery, calculateTotalPages, generateRandomPassword } from '../../utils/helpers';
import { generateIdAnggota } from '../../utils/idGenerator';

export class AnggotaService {
  // ==================== GET ALL ====================
  static async getAll(query: any) {
    const { page, limit, skip } = parsePaginationQuery(query);
    const { search, sabuk, status, lokasi, tanggal_gabung_from, tanggal_gabung_to, sort, order } = query;

    const where: any = { deleted_at: null };

    if (search) {
      where.OR = [
        { nama_lengkap: { contains: search, mode: 'insensitive' } },
        { id_anggota: { contains: search, mode: 'insensitive' } },
        { no_telepon: { contains: search } },
        { email_pribadi: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (sabuk) where.sabuk = sabuk;
    if (status) where.status_keanggotaan = status;

    if (lokasi) {
      where.OR = [
        { tempat_latihan_saat_ini_id: lokasi },
        { tempat_latihan_pertama_id: lokasi },
      ];
    }

    if (tanggal_gabung_from || tanggal_gabung_to) {
      where.tanggal_gabung = {};
      if (tanggal_gabung_from) where.tanggal_gabung.gte = new Date(tanggal_gabung_from);
      if (tanggal_gabung_to) where.tanggal_gabung.lte = new Date(tanggal_gabung_to);
    }

    const orderBy: any = {};
    if (sort) {
      orderBy[sort] = order || 'asc';
    } else {
      orderBy.created_at = 'desc';
    }

    const [data, total] = await Promise.all([
      prisma.anggota_profiles.findMany({
        where,
        include: {
          tempat_latihan_pertama: { select: { id: true, nama: true, kota: true } },
          tempat_latihan_saat_ini: { select: { id: true, nama: true, kota: true } },
          pelatih_pertama: { select: { id: true, nama_lengkap: true } },
          pelatih_saat_ini: { select: { id: true, nama_lengkap: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.anggota_profiles.count({ where }),
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

  // ==================== GET BY ID ====================
  static async getById(id: string) {
    const anggota = await prisma.anggota_profiles.findUnique({
      where: { id },
      include: {
        tempat_latihan_pertama: { select: { id: true, id_lokasi: true, nama: true, alamat: true, kota: true, provinsi: true } },
        tempat_latihan_saat_ini: { select: { id: true, id_lokasi: true, nama: true, alamat: true, kota: true, provinsi: true } },
        pelatih_pertama: { select: { id: true, id_pelatih: true, nama_lengkap: true } },
        pelatih_saat_ini: { select: { id: true, id_pelatih: true, nama_lengkap: true } },
        user: { select: { id: true, email: true, status: true, last_login_at: true } },
        prestasi: { orderBy: { tanggal: 'desc' } },
        penugasan: {
          include: {
            tempat: { select: { id: true, id_lokasi: true, nama: true, kota: true } },
          },
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!anggota) throw new NotFoundError('Anggota tidak ditemukan');
    return anggota;
  }

  // ==================== CREATE ====================
  static async create(data: any, createdByUserId: string) {
    // Sanitize: convert empty strings to null for optional UUID fields
    const uuidFields = ['tempat_latihan_pertama_id', 'tempat_latihan_saat_ini_id', 'pelatih_pertama_id', 'pelatih_saat_ini_id', 'email_pribadi'];
    for (const field of uuidFields) {
      if (data[field] === '' || data[field] === undefined) {
        data[field] = null;
      }
    }

    // Check uniqueness of email_pribadi if provided
    if (data.email_pribadi) {
      const existingEmail = await prisma.anggota_profiles.findFirst({
        where: { email_pribadi: data.email_pribadi },
      });
      if (existingEmail) throw new ConflictError('Email pribadi sudah terdaftar');
    }

    // Validate foreign keys
    if (data.tempat_latihan_pertama_id) {
      const lokasi = await prisma.tempat_latihan.findUnique({ where: { id: data.tempat_latihan_pertama_id } });
      if (!lokasi) throw new NotFoundError('Tempat latihan pertama tidak ditemukan');
    }
    if (data.tempat_latihan_saat_ini_id) {
      const lokasi = await prisma.tempat_latihan.findUnique({ where: { id: data.tempat_latihan_saat_ini_id } });
      if (!lokasi) throw new NotFoundError('Tempat latihan saat ini tidak ditemukan');
    }
    if (data.pelatih_pertama_id) {
      const pelatih = await prisma.pelatih_profiles.findUnique({ where: { id: data.pelatih_pertama_id } });
      if (!pelatih) throw new NotFoundError('Pelatih pertama tidak ditemukan');
    }
    if (data.pelatih_saat_ini_id) {
      const pelatih = await prisma.pelatih_profiles.findUnique({ where: { id: data.pelatih_saat_ini_id } });
      if (!pelatih) throw new NotFoundError('Pelatih saat ini tidak ditemukan');
    }

    // Generate auto ID Anggota (AG001, AG002, ...)
    const idAnggota = await generateIdAnggota();

    // Generate random password for user account
    const plainPassword = generateRandomPassword();
    const passwordHash = await bcrypt.hash(plainPassword, 12);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create user account
      const user = await tx.users.create({
        data: {
          email: `${idAnggota.toLowerCase()}@sipbm.local`,
          password_hash: passwordHash,
          role: 'anggota',
          status: 'active',
        },
      });

      // 2. Create anggota profile
      const anggota = await tx.anggota_profiles.create({
        data: {
          user_id: user.id,
          id_anggota: idAnggota,
          nama_lengkap: data.nama_lengkap,
          tempat_lahir: data.tempat_lahir,
          tanggal_lahir: new Date(data.tanggal_lahir),
          jenis_kelamin: data.jenis_kelamin,
          no_telepon: data.no_telepon,
          email_pribadi: data.email_pribadi || null,
          sabuk: data.sabuk,
          tanggal_gabung: new Date(data.tanggal_gabung),
          status_keanggotaan: data.status_keanggotaan || 'Aktif',
          tempat_latihan_pertama_id: data.tempat_latihan_pertama_id || null,
          tempat_latihan_saat_ini_id: data.tempat_latihan_saat_ini_id || null,
          pelatih_pertama_id: data.pelatih_pertama_id || null,
          pelatih_saat_ini_id: data.pelatih_saat_ini_id || null,
        },
      });

      // 3. Create penugasan if tempat_latihan_saat_ini_id is provided
      let penugasan = null;
      if (data.tempat_latihan_saat_ini_id) {
        penugasan = await tx.penugasan.create({
          data: {
            anggota_id: anggota.id,
            tempat_id: data.tempat_latihan_saat_ini_id,
            tanggal_mulai: new Date(data.tanggal_gabung),
            status: 'Aktif',
            created_by: createdByUserId,
          },
        });
      }

      // 4. Audit log
      await tx.audit_logs.create({
        data: {
          user_id: createdByUserId,
          aksi: 'create',
          entitas: 'anggota_profiles',
          entitas_id: anggota.id,
          detail: { id_anggota: idAnggota, nama_lengkap: data.nama_lengkap, sabuk: data.sabuk },
        },
      });

      return { anggota, user, penugasan };
    });

    return {
      anggota: result.anggota,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        initial_password: plainPassword,
      },
      penugasan: result.penugasan,
    };
  }

  // ==================== UPDATE ====================
  static async update(id: string, data: any) {
    // Sanitize: convert empty strings to null for optional UUID fields
    const uuidFields = ['tempat_latihan_pertama_id', 'tempat_latihan_saat_ini_id', 'pelatih_pertama_id', 'pelatih_saat_ini_id', 'email_pribadi'];
    for (const field of uuidFields) {
      if (data[field] === '' || data[field] === undefined) {
        data[field] = null;
      }
    }

    const existing = await prisma.anggota_profiles.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Anggota tidak ditemukan');
    if (existing.deleted_at) throw new NotFoundError('Anggota yang sudah diarsipkan tidak dapat diupdate');

    // Check email uniqueness if changed
    if (data.email_pribadi && data.email_pribadi !== existing.email_pribadi) {
      const emailExists = await prisma.anggota_profiles.findFirst({
        where: { email_pribadi: data.email_pribadi, id: { not: id } },
      });
      if (emailExists) throw new ConflictError('Email pribadi sudah terdaftar');
    }

    // Validate foreign keys
    if (data.tempat_latihan_pertama_id) {
      const lokasi = await prisma.tempat_latihan.findUnique({ where: { id: data.tempat_latihan_pertama_id } });
      if (!lokasi) throw new NotFoundError('Tempat latihan pertama tidak ditemukan');
    }
    if (data.tempat_latihan_saat_ini_id) {
      const lokasi = await prisma.tempat_latihan.findUnique({ where: { id: data.tempat_latihan_saat_ini_id } });
      if (!lokasi) throw new NotFoundError('Tempat latihan saat ini tidak ditemukan');
    }
    if (data.pelatih_pertama_id) {
      const pelatih = await prisma.pelatih_profiles.findUnique({ where: { id: data.pelatih_pertama_id } });
      if (!pelatih) throw new NotFoundError('Pelatih pertama tidak ditemukan');
    }
    if (data.pelatih_saat_ini_id) {
      const pelatih = await prisma.pelatih_profiles.findUnique({ where: { id: data.pelatih_saat_ini_id } });
      if (!pelatih) throw new NotFoundError('Pelatih saat ini tidak ditemukan');
    }

    const updateData: any = {};
    const allowedFields = [
      'nama_lengkap', 'tempat_lahir', 'tanggal_lahir', 'jenis_kelamin',
      'no_telepon', 'email_pribadi', 'sabuk', 'tanggal_gabung',
      'status_keanggotaan', 'tempat_latihan_pertama_id', 'tempat_latihan_saat_ini_id',
      'pelatih_pertama_id', 'pelatih_saat_ini_id',
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        if (field === 'tanggal_lahir' || field === 'tanggal_gabung') {
          updateData[field] = new Date(data[field]);
        } else {
          updateData[field] = data[field];
        }
      }
    }

    const updated = await prisma.anggota_profiles.update({ where: { id }, data: updateData });

    await prisma.audit_logs.create({
      data: {
        aksi: 'update',
        entitas: 'anggota_profiles',
        entitas_id: id,
        detail: { updated_fields: Object.keys(updateData) },
      },
    });

    return updated;
  }

  // ==================== DELETE (Soft Delete) ====================
  static async delete(id: string) {
    const existing = await prisma.anggota_profiles.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Anggota tidak ditemukan');
    if (existing.deleted_at) throw new NotFoundError('Anggota sudah diarsipkan sebelumnya');

    const updated = await prisma.anggota_profiles.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    await prisma.audit_logs.create({
      data: {
        aksi: 'delete',
        entitas: 'anggota_profiles',
        entitas_id: id,
        detail: { id_anggota: existing.id_anggota, nama_lengkap: existing.nama_lengkap },
      },
    });

    return updated;
  }

  // ==================== RESTORE ====================
  static async restore(id: string) {
    const existing = await prisma.anggota_profiles.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Anggota tidak ditemukan');
    if (!existing.deleted_at) throw new NotFoundError('Anggota tidak dalam status terarsipkan');

    const updated = await prisma.anggota_profiles.update({
      where: { id },
      data: { deleted_at: null },
    });

    await prisma.audit_logs.create({
      data: {
        aksi: 'restore',
        entitas: 'anggota_profiles',
        entitas_id: id,
        detail: { id_anggota: existing.id_anggota, nama_lengkap: existing.nama_lengkap },
      },
    });

    return updated;
  }

  // ==================== GET ARCHIVED ====================
  static async getArchived(query: any) {
    const { page, limit, skip } = parsePaginationQuery(query);
    const { search, sabuk, status, sort, order } = query;

    const where: any = { deleted_at: { not: null } };

    if (search) {
      where.OR = [
        { nama_lengkap: { contains: search, mode: 'insensitive' } },
        { id_anggota: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (sabuk) where.sabuk = sabuk;
    if (status) where.status_keanggotaan = status;

    const orderBy: any = {};
    if (sort) orderBy[sort] = order || 'desc';
    else orderBy.deleted_at = 'desc';

    const [data, total] = await Promise.all([
      prisma.anggota_profiles.findMany({ where, orderBy, skip, take: limit }),
      prisma.anggota_profiles.count({ where }),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: calculateTotalPages(total, limit) },
    };
  }

  // ==================== GET STATS ====================
  static async getStats() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalActive, totalArchived, bySabuk, byStatus, newThisMonth] = await Promise.all([
      prisma.anggota_profiles.count({ where: { deleted_at: null } }),
      prisma.anggota_profiles.count({ where: { deleted_at: { not: null } } }),
      prisma.anggota_profiles.groupBy({ by: ['sabuk'], where: { deleted_at: null }, _count: { id: true } }),
      prisma.anggota_profiles.groupBy({ by: ['status_keanggotaan'], where: { deleted_at: null }, _count: { id: true } }),
      prisma.anggota_profiles.count({ where: { deleted_at: null, tanggal_gabung: { gte: startOfMonth } } }),
    ]);

    return {
      total_active: totalActive,
      total_archived: totalArchived,
      by_sabuk: bySabuk.map((item) => ({ sabuk: item.sabuk, count: item._count.id })),
      by_status: byStatus.map((item) => ({ status: item.status_keanggotaan, count: item._count.id })),
      new_this_month: newThisMonth,
    };
  }

  // ==================== EXPORT ====================
  static async getExport(query: any) {
    const { search, sabuk, status, lokasi, tanggal_gabung_from, tanggal_gabung_to } = query;

    const where: any = { deleted_at: null };

    if (search) {
      where.OR = [
        { nama_lengkap: { contains: search, mode: 'insensitive' } },
        { id_anggota: { contains: search, mode: 'insensitive' } },
        { no_telepon: { contains: search } },
      ];
    }
    if (sabuk) where.sabuk = sabuk;
    if (status) where.status_keanggotaan = status;
    if (lokasi) where.tempat_latihan_saat_ini_id = lokasi;
    if (tanggal_gabung_from || tanggal_gabung_to) {
      where.tanggal_gabung = {};
      if (tanggal_gabung_from) where.tanggal_gabung.gte = new Date(tanggal_gabung_from);
      if (tanggal_gabung_to) where.tanggal_gabung.lte = new Date(tanggal_gabung_to);
    }

    const data = await prisma.anggota_profiles.findMany({
      where,
      include: {
        tempat_latihan_pertama: { select: { nama: true } },
        tempat_latihan_saat_ini: { select: { nama: true, kota: true } },
        pelatih_pertama: { select: { nama_lengkap: true } },
        pelatih_saat_ini: { select: { nama_lengkap: true } },
      },
      orderBy: { nama_lengkap: 'asc' },
    });

    await prisma.audit_logs.create({
      data: {
        aksi: 'export',
        entitas: 'anggota_profiles',
        detail: { filters: query, total_records: data.length },
      },
    });

    return data.map((a) => ({
      id_anggota: a.id_anggota,
      nama_lengkap: a.nama_lengkap,
      tempat_lahir: a.tempat_lahir,
      tanggal_lahir: a.tanggal_lahir,
      jenis_kelamin: a.jenis_kelamin,
      no_telepon: a.no_telepon,
      email_pribadi: a.email_pribadi || '',
      sabuk: a.sabuk,
      tanggal_gabung: a.tanggal_gabung,
      status_keanggotaan: a.status_keanggotaan,
      lokasi_pertama: a.tempat_latihan_pertama?.nama || '',
      lokasi_saat_ini: a.tempat_latihan_saat_ini?.nama || '',
      pelatih_pertama: a.pelatih_pertama?.nama_lengkap || '',
      pelatih_saat_ini: a.pelatih_saat_ini?.nama_lengkap || '',
    }));
  }
}

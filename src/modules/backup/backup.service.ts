import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

const BACKUP_VERSION = '1.0';

export class BackupService {
  // ==================== GET STATS ====================
  static async getStats() {
    const [users, anggota, pelatih, lokasi, jadwal, presensi, penugasan, prestasi] =
      await Promise.all([
        prisma.users.count(),
        prisma.anggota_profiles.count(),
        prisma.pelatih_profiles.count(),
        prisma.tempat_latihan.count(),
        prisma.jadwal_latihan.count(),
        prisma.presensi.count(),
        prisma.penugasan.count(),
        prisma.prestasi.count(),
      ]);

    return { users, anggota, pelatih, lokasi, jadwal, presensi, penugasan, prestasi };
  }

  // ==================== EXPORT (BACKUP) ====================
  static async export() {
    const [
      users,
      anggotaProfiles,
      pelatihProfiles,
      tempatLatihan,
      jadwalLatihan,
      presensi,
      penugasan,
      prestasi,
      notifications,
      auditLogs,
    ] = await Promise.all([
      prisma.users.findMany(),
      prisma.anggota_profiles.findMany(),
      prisma.pelatih_profiles.findMany(),
      prisma.tempat_latihan.findMany(),
      prisma.jadwal_latihan.findMany(),
      prisma.presensi.findMany(),
      prisma.penugasan.findMany(),
      prisma.prestasi.findMany(),
      prisma.notifications.findMany(),
      prisma.audit_logs.findMany(),
    ]);

    // Strip relation objects — keep only scalar fields for clean JSON
    const stripRelations = (arr: any[], relationKeys: string[]) =>
      arr.map(item => {
        const clean: any = {};
        for (const key of Object.keys(item)) {
          if (!relationKeys.includes(key)) {
            clean[key] = item[key];
          }
        }
        return clean;
      });

    return {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      app: 'SIPBM',
      data: {
        users: stripRelations(users, []),
        anggota_profiles: stripRelations(anggotaProfiles, ['user', 'tempat_latihan_pertama', 'tempat_latihan_saat_ini', 'pelatih_pertama', 'pelatih_saat_ini']),
        pelatih_profiles: stripRelations(pelatihProfiles, ['user', 'tempat_melatih', 'lokasi_pj']),
        tempat_latihan: stripRelations(tempatLatihan, ['pelatih_pj', 'pelatih_list', 'jadwal_latihan', 'penugasan', 'anggota_pertama', 'anggota_saat_ini']),
        jadwal_latihan: stripRelations(jadwalLatihan, ['tempat', 'pelatih', 'creator', 'presensi']),
        presensi: stripRelations(presensi, ['jadwal', 'anggota', 'input_by']),
        penugasan: stripRelations(penugasan, ['anggota', 'tempat', 'creator']),
        prestasi: stripRelations(prestasi, ['anggota']),
        notifications: stripRelations(notifications, ['user']),
        audit_logs: stripRelations(auditLogs, ['user']),
      },
    };
  }

  // ==================== RESTORE ====================
  static async restore(backupData: any) {
    // 1. Validate structure
    if (!backupData || typeof backupData !== 'object') {
      throw new AppError('File backup tidak valid', 400);
    }
    if (!backupData.data || typeof backupData.data !== 'object') {
      throw new AppError('Format file backup tidak sesuai', 400);
    }

    const requiredTables = ['users', 'anggota_profiles', 'pelatih_profiles', 'tempat_latihan', 'jadwal_latihan'];
    for (const table of requiredTables) {
      if (!Array.isArray(backupData.data[table])) {
        throw new AppError(`Data "${table}" tidak ditemukan atau format salah di file backup`, 400);
      }
    }

    const d = backupData.data;

    // 2. Run in transaction — all or nothing
    const result = await prisma.$transaction(async (tx) => {
      // DELETE (child → parent order)
      await tx.presensi.deleteMany();
      await tx.penugasan.deleteMany();
      await tx.prestasi.deleteMany();
      await tx.jadwal_latihan.deleteMany();
      await tx.anggota_profiles.deleteMany();
      await tx.pelatih_profiles.deleteMany();
      await tx.tempat_latihan.deleteMany();
      await tx.notifications.deleteMany();
      await tx.audit_logs.deleteMany();
      await tx.users.deleteMany();

      // INSERT (parent → child order)
      let inserted = { users: 0, lokasi: 0, pelatih: 0, anggota: 0, jadwal: 0, presensi: 0, penugasan: 0, prestasi: 0 };

      // Users
      for (const u of (d.users || [])) {
        await tx.users.create({
          data: {
            id: u.id,
            email: u.email,
            password_hash: u.password_hash,
            role: u.role,
            status: u.status,
            last_login_at: u.last_login_at ? new Date(u.last_login_at) : null,
            created_at: u.created_at ? new Date(u.created_at) : undefined,
            updated_at: u.updated_at ? new Date(u.updated_at) : undefined,
          },
        });
        inserted.users++;
      }

      // Lokasi
      for (const l of (d.tempat_latihan || [])) {
        await tx.tempat_latihan.create({
          data: {
            id: l.id,
            id_lokasi: l.id_lokasi,
            nama: l.nama,
            alamat: l.alamat,
            kota: l.kota,
            provinsi: l.provinsi,
            kecamatan: l.kecamatan,
            kelurahan: l.kelurahan,
            desa: l.desa,
            kode_pos: l.kode_pos,
            jam_operasional: l.jam_operasional,
            kapasitas: l.kapasitas,
            pelatih_pj_id: l.pelatih_pj_id,
            foto_urls: l.foto_urls || [],
            status: l.status,
            created_at: l.created_at ? new Date(l.created_at) : undefined,
            updated_at: l.updated_at ? new Date(l.updated_at) : undefined,
          },
        });
        inserted.lokasi++;
      }

      // Pelatih
      for (const p of (d.pelatih_profiles || [])) {
        await tx.pelatih_profiles.create({
          data: {
            id: p.id,
            user_id: p.user_id,
            id_pelatih: p.id_pelatih,
            nama_lengkap: p.nama_lengkap,
            tempat_lahir: p.tempat_lahir,
            tanggal_lahir: new Date(p.tanggal_lahir),
            jenis_kelamin: p.jenis_kelamin,
            alamat: p.alamat,
            no_telepon: p.no_telepon,
            email_pribadi: p.email_pribadi,
            foto_url: p.foto_url,
            sabuk: p.sabuk,
            tempat_melatih_id: p.tempat_melatih_id,
            deleted_at: p.deleted_at ? new Date(p.deleted_at) : null,
            tanggal_gabung: new Date(p.tanggal_gabung),
            created_at: p.created_at ? new Date(p.created_at) : undefined,
            updated_at: p.updated_at ? new Date(p.updated_at) : undefined,
          },
        });
        inserted.pelatih++;
      }

      // Anggota
      for (const a of (d.anggota_profiles || [])) {
        await tx.anggota_profiles.create({
          data: {
            id: a.id,
            user_id: a.user_id,
            id_anggota: a.id_anggota,
            nama_lengkap: a.nama_lengkap,
            tempat_lahir: a.tempat_lahir,
            tanggal_lahir: new Date(a.tanggal_lahir),
            jenis_kelamin: a.jenis_kelamin,
            no_telepon: a.no_telepon,
            email_pribadi: a.email_pribadi,
            foto_url: a.foto_url,
            sabuk: a.sabuk,
            tanggal_gabung: new Date(a.tanggal_gabung),
            status_keanggotaan: a.status_keanggotaan,
            tempat_latihan_pertama_id: a.tempat_latihan_pertama_id,
            tempat_latihan_saat_ini_id: a.tempat_latihan_saat_ini_id,
            pelatih_pertama_id: a.pelatih_pertama_id,
            pelatih_saat_ini_id: a.pelatih_saat_ini_id,
            deleted_at: a.deleted_at ? new Date(a.deleted_at) : null,
            created_at: a.created_at ? new Date(a.created_at) : undefined,
            updated_at: a.updated_at ? new Date(a.updated_at) : undefined,
          },
        });
        inserted.anggota++;
      }

      // Jadwal
      for (const j of (d.jadwal_latihan || [])) {
        await tx.jadwal_latihan.create({
          data: {
            id: j.id,
            judul_materi: j.judul_materi,
            tanggal: new Date(j.tanggal),
            jam_mulai: new Date(j.jam_mulai),
            jam_selesai: new Date(j.jam_selesai),
            tempat_id: j.tempat_id,
            pelatih_id: j.pelatih_id,
            tipe_latihan: j.tipe_latihan,
            target_peserta: j.target_peserta,
            hari: j.hari,
            catatan: j.catatan,
            seri_id: j.seri_id,
            status: j.status,
            created_by: j.created_by,
            created_at: j.created_at ? new Date(j.created_at) : undefined,
            updated_at: j.updated_at ? new Date(j.updated_at) : undefined,
          },
        });
        inserted.jadwal++;
      }

      // Presensi
      for (const p of (d.presensi || [])) {
        await tx.presensi.create({
          data: {
            id: p.id,
            jadwal_id: p.jadwal_id,
            anggota_id: p.anggota_id,
            tanggal: new Date(p.tanggal),
            status: p.status,
            keterangan: p.keterangan,
            catatan_umum: p.catatan_umum,
            input_oleh: p.input_oleh,
            waktu_input: p.waktu_input ? new Date(p.waktu_input) : undefined,
            created_at: p.created_at ? new Date(p.created_at) : undefined,
            updated_at: p.updated_at ? new Date(p.updated_at) : undefined,
          },
        });
        inserted.presensi++;
      }

      // Penugasan
      for (const p of (d.penugasan || [])) {
        await tx.penugasan.create({
          data: {
            id: p.id,
            anggota_id: p.anggota_id,
            tempat_id: p.tempat_id,
            tanggal_mulai: new Date(p.tanggal_mulai),
            tanggal_selesai: p.tanggal_selesai ? new Date(p.tanggal_selesai) : null,
            alasan: p.alasan,
            status: p.status,
            created_by: p.created_by,
            created_at: p.created_at ? new Date(p.created_at) : undefined,
            updated_at: p.updated_at ? new Date(p.updated_at) : undefined,
          },
        });
        inserted.penugasan++;
      }

      // Prestasi
      for (const p of (d.prestasi || [])) {
        await tx.prestasi.create({
          data: {
            id: p.id,
            anggota_id: p.anggota_id,
            nama_kejuaraan: p.nama_kejuaraan,
            tingkat: p.tingkat,
            peringkat: p.peringkat,
            tanggal: new Date(p.tanggal),
            tempat: p.tempat,
            catatan: p.catatan,
            created_at: p.created_at ? new Date(p.created_at) : undefined,
            updated_at: p.updated_at ? new Date(p.updated_at) : undefined,
          },
        });
        inserted.prestasi++;
      }

      // Notifications
      for (const n of (d.notifications || [])) {
        await tx.notifications.create({
          data: {
            id: n.id,
            user_id: n.user_id,
            judul: n.judul,
            pesan: n.pesan,
            tipe: n.tipe,
            is_read: n.is_read,
            created_at: n.created_at ? new Date(n.created_at) : undefined,
          },
        }).catch(() => {});
      }

      // Audit logs
      for (const a of (d.audit_logs || [])) {
        await tx.audit_logs.create({
          data: {
            id: a.id,
            user_id: a.user_id,
            aksi: a.aksi,
            entitas: a.entitas,
            entitas_id: a.entitas_id,
            detail: a.detail,
            ip_address: a.ip_address,
            created_at: a.created_at ? new Date(a.created_at) : undefined,
          },
        }).catch(() => {});
      }

      return inserted;
    });

    return result;
  }
}

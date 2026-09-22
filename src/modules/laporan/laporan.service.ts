import prisma from '../../config/database';

export class LaporanService {
  // Dashboard admin
  static async getDashboardAdmin() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // Total anggota aktif
    const totalAnggotaAktif = await prisma.anggota_profiles.count({
      where: { status_keanggotaan: 'Aktif' },
    });

    // Total pelatih
    const totalPelatih = await prisma.pelatih_profiles.count({
      where: { status: 'Aktif' },
    });

    // Total lokasi
    const totalLokasi = await prisma.tempat_latihan.count({
      where: { status: 'Aktif' },
    });

    // Anggota baru bulan ini
    const anggotaBaruBulanIni = await prisma.anggota_profiles.count({
      where: {
        tanggal_gabung: {
          gte: startOfMonth,
        },
      },
    });

    // Distribusi per lokasi (count from anggota_profiles.tempat_latihan_saat_ini_id)
    const distribusiLokasi = await prisma.tempat_latihan.findMany({
      where: { status: 'Aktif' },
      select: {
        id: true,
        nama: true,
        kota: true,
        _count: {
          select: {
            anggota_saat_ini: {
              where: { deleted_at: null },
            },
          },
        },
      },
      orderBy: {
        anggota_saat_ini: { _count: 'desc' },
      },
    });

    const distribusiPerLokasi = distribusiLokasi.map((lok) => ({
      id: lok.id,
      nama: lok.nama,
      kota: lok.kota,
      jumlah_anggota: lok._count.anggota_saat_ini,
    }));

    // Pertumbuhan 6 bulan
    const pertumbuhan6Bulan = await prisma.anggota_profiles.groupBy({
      by: ['tanggal_gabung'],
      where: {
        tanggal_gabung: {
          gte: sixMonthsAgo,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        tanggal_gabung: 'asc',
      },
    });

    // Aggregate by month
    const bulanMap: Record<string, number> = {};
    for (const item of pertumbuhan6Bulan) {
      const key = item.tanggal_gabung.toISOString().slice(0, 7); // YYYY-MM
      bulanMap[key] = (bulanMap[key] || 0) + item._count.id;
    }

    const pertumbuhan = Object.entries(bulanMap).map(([bulan, jumlah]) => ({
      bulan,
      jumlah,
    }));

    // Jadwal hari ini
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const jadwalHariIni = await prisma.jadwal_latihan.findMany({
      where: {
        tanggal: {
          gte: startOfDay,
          lt: endOfDay,
        },
        status: { not: 'Dibatalkan' },
      },
      include: {
        tempat: {
          select: { id: true, nama: true },
        },
        pelatih: {
          select: { id: true, nama_lengkap: true },
        },
        _count: {
          select: { presensi: true },
        },
      },
      orderBy: { jam_mulai: 'asc' },
    });

    // 5 prestasi terbaru
    const prestasiTerbaru = await prisma.prestasi.findMany({
      take: 5,
      orderBy: { tanggal: 'desc' },
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
    });

    return {
      totalAnggotaAktif,
      totalPelatih,
      totalLokasi,
      anggotaBaruBulanIni,
      distribusiPerLokasi,
      pertumbuhan,
      jadwalHariIni: jadwalHariIni.map((j) => ({
        id: j.id,
        judul_materi: j.judul_materi,
        tanggal: j.tanggal,
        jam_mulai: j.jam_mulai,
        jam_selesai: j.jam_selesai,
        tipe_latihan: j.tipe_latihan,
        status: j.status,
        tempat: j.tempat,
        pelatih: j.pelatih,
        jumlah_presensi: j._count.presensi,
      })),
      prestasiTerbaru: prestasiTerbaru.map((p) => ({
        id: p.id,
        nama_kejuaraan: p.nama_kejuaraan,
        tingkat: p.tingkat,
        tanggal: p.tanggal,
        perolehan: p.perolehan,
        anggota: p.anggota,
      })),
    };
  }

  // Dashboard pelatih
  static async getDashboardPelatih(userId: string) {
    const pelatih = await prisma.pelatih_profiles.findUnique({
      where: { user_id: userId },
    });

    if (!pelatih) {
      return null;
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    // Total anggota di lokasi pelatih
    const totalAnggota = pelatih.tempat_latihan_id
      ? await prisma.anggota_profiles.count({
          where: {
            tempat_latihan_saat_ini_id: pelatih.tempat_latihan_id,
            deleted_at: null,
          },
        })
      : 0;

    // Jadwal hari ini
    const jadwalHariIni = await prisma.jadwal_latihan.findMany({
      where: {
        pelatih_id: pelatih.id,
        tanggal: {
          gte: startOfDay,
          lt: endOfDay,
        },
        status: { not: 'Dibatalkan' },
      },
      include: {
        tempat: { select: { id: true, nama: true } },
        _count: { select: { presensi: true } },
      },
      orderBy: { jam_mulai: 'asc' },
    });

    // Jadwal mendatang
    const jadwalMendatang = await prisma.jadwal_latihan.findMany({
      where: {
        pelatih_id: pelatih.id,
        tanggal: { gt: endOfDay },
        status: 'Dijadwalkan',
      },
      include: {
        tempat: { select: { id: true, nama: true } },
      },
      orderBy: { tanggal: 'asc' },
      take: 5,
    });

    // Jumlah presensi minggu ini
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const presensiMingguIni = await prisma.presensi.count({
      where: {
        jadwal: {
          pelatih_id: pelatih.id,
          tanggal: { gte: startOfWeek },
        },
      },
    });

    return {
      profil: {
        id: pelatih.id,
        id_pelatih: pelatih.id_pelatih,
        nama_lengkap: pelatih.nama_lengkap,
      },
      totalAnggota,
      jadwalHariIni: jadwalHariIni.map((j) => ({
        id: j.id,
        judul_materi: j.judul_materi,
        jam_mulai: j.jam_mulai,
        jam_selesai: j.jam_selesai,
        tipe_latihan: j.tipe_latihan,
        status: j.status,
        tempat: j.tempat,
        jumlah_presensi: j._count.presensi,
      })),
      jadwalMendatang: jadwalMendatang.map((j) => ({
        id: j.id,
        judul_materi: j.judul_materi,
        tanggal: j.tanggal,
        jam_mulai: j.jam_mulai,
        jam_selesai: j.jam_selesai,
        tipe_latihan: j.tipe_latihan,
        tempat: j.tempat,
      })),
      presensiMingguIni,
    };
  }

  // Dashboard anggota
  static async getDashboardAnggota(userId: string) {
    const anggota = await prisma.anggota_profiles.findUnique({
      where: { user_id: userId },
    });

    if (!anggota) {
      return null;
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total presensi bulan ini
    const presensiBulanIni = await prisma.presensi.count({
      where: {
        anggota_id: anggota.id,
        created_at: { gte: startOfMonth },
      },
    });

    // Presensi hadir bulan ini
    const presensiHadir = await prisma.presensi.count({
      where: {
        anggota_id: anggota.id,
        created_at: { gte: startOfMonth },
        status: 'Hadir',
      },
    });

    // Jadwal mendatang untuk lokasi anggota
    let jadwalMendatang: any[] = [];
    if (anggota.tempat_latihan_saat_ini_id) {
      const jadwal = await prisma.jadwal_latihan.findMany({
        where: {
          tempat_id: anggota.tempat_latihan_saat_ini_id,
          tanggal: { gte: now },
          status: 'Dijadwalkan',
        },
        include: {
          tempat: { select: { id: true, nama: true } },
          pelatih: { select: { id: true, nama_lengkap: true } },
        },
        orderBy: { tanggal: 'asc' },
        take: 5,
      });

      jadwalMendatang = jadwal.map((j) => ({
        id: j.id,
        judul_materi: j.judul_materi,
        tanggal: j.tanggal,
        jam_mulai: j.jam_mulai,
        jam_selesai: j.jam_selesai,
        tipe_latihan: j.tipe_latihan,
        tempat: j.tempat,
        pelatih: j.pelatih,
      }));
    }

    // Prestasi
    const prestasi = await prisma.prestasi.findMany({
      where: { anggota_id: anggota.id },
      orderBy: { tanggal: 'desc' },
      take: 5,
    });

    return {
      profil: {
        id: anggota.id,
        id_anggota: anggota.id_anggota,
        nama_lengkap: anggota.nama_lengkap,
        sabuk: anggota.sabuk,
        status_keanggotaan: anggota.status_keanggotaan,
      },
      presensiBulanIni,
      presensiHadir,
      persentaseKehadiran: presensiBulanIni > 0
        ? Math.round((presensiHadir / presensiBulanIni) * 100)
        : 0,
      jadwalMendatang,
      prestasi: prestasi.map((p) => ({
        id: p.id,
        nama_kejuaraan: p.nama_kejuaraan,
        tingkat: p.tingkat,
        tanggal: p.tanggal,
        perolehan: p.perolehan,
      })),
    };
  }
}

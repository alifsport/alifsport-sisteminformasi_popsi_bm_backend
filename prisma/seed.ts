import { PrismaClient, UserRole, JenisKelamin, StatusKeanggotaan, StatusLokasi } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function main() {
  console.log('🌱 Seeding database...');

  // ==================== ADMIN ====================
  const adminPassword = await hashPassword('admin123');
  const admin = await prisma.users.upsert({
    where: { email: 'admin@bmayu.com' },
    update: {},
    create: {
      email: 'admin@bmayu.com',
      password_hash: adminPassword,
      role: UserRole.admin,
      status: 'active',
    },
  });
  console.log('✅ Admin created:', admin.email);

  // ==================== LOKASI ====================
  const lokasi1 = await prisma.tempat_latihan.upsert({
    where: { id_lokasi: 'LOC-0001' },
    update: {},
    create: {
      id_lokasi: 'LOC-0001',
      nama: 'Madinatul Quran',
      alamat: 'Jl. Merdeka No. 123, Kel. Sukamaju, Kec. Menteng',
      kota: 'Jakarta Pusat',
      provinsi: 'DKI Jakarta',
      jam_operasional: 'Senin-Jumat 18:00-21:00, Sabtu 08:00-11:00',
      kapasitas: 50,
      status: StatusLokasi.Aktif,
    },
  });

  const lokasi2 = await prisma.tempat_latihan.upsert({
    where: { id_lokasi: 'LOC-0002' },
    update: {},
    create: {
      id_lokasi: 'LOC-0002',
      nama: 'Padepokan Bhayu Manunggal',
      alamat: 'Jl. Pahlawan No. 45, Kel. Burangrang, Kec. Lengkong',
      kota: 'Bandung',
      provinsi: 'Jawa Barat',
      jam_operasional: 'Selasa-Kamis 19:00-21:30, Sabtu 09:00-12:00',
      kapasitas: 40,
      status: StatusLokasi.Aktif,
    },
  });

  const lokasi3 = await prisma.tempat_latihan.upsert({
    where: { id_lokasi: 'LOC-0003' },
    update: {},
    create: {
      id_lokasi: 'LOC-0003',
      nama: 'Sanggar Seni Bhayu Timur',
      alamat: 'Jl. Pemuda No. 78, Kel. Gebang Putih, Kec. Sukolilo',
      kota: 'Surabaya',
      provinsi: 'Jawa Timur',
      jam_operasional: 'Senin, Rabu, Jumat 18:30-21:00',
      kapasitas: 35,
      status: StatusLokasi.Aktif,
    },
  });
  console.log('✅ Lokasi created: 3');

  // ==================== PELATIH ====================
  const pelatihPassword = await hashPassword('pelatih123');

  const userPelatih1 = await prisma.users.upsert({
    where: { email: 'budi.santoso@bmayu.com' },
    update: {},
    create: {
      email: 'budi.santoso@bmayu.com',
      password_hash: pelatihPassword,
      role: UserRole.pelatih,
      status: 'active',
    },
  });

  const pelatih1 = await prisma.pelatih_profiles.upsert({
    where: { id_pelatih: 'PLT-2026-0001' },
    update: {},
    create: {
      user_id: userPelatih1.id,
      id_pelatih: 'PLT-2026-0001',
      nama_lengkap: 'Budi Santoso',
      tempat_lahir: 'Jakarta',
      tanggal_lahir: new Date('1985-06-15'),
      jenis_kelamin: JenisKelamin.Laki_laki,
      alamat: 'Jl. Sudirman No. 10, Jakarta Selatan',
      no_telepon: '081234567890',
      email_pribadi: 'budi.santoso@gmail.com',
      sabuk: 'Biru_Polos',
      tempat_melatih_id: lokasi1.id,
      tanggal_gabung: new Date('2020-01-15'),
    },
  });

  await prisma.tempat_latihan.update({
    where: { id: lokasi1.id },
    data: { pelatih_pj_id: pelatih1.id },
  });

  const userPelatih2 = await prisma.users.upsert({
    where: { email: 'siti.rahayu@bmayu.com' },
    update: {},
    create: {
      email: 'siti.rahayu@bmayu.com',
      password_hash: pelatihPassword,
      role: UserRole.pelatih,
      status: 'active',
    },
  });

  const pelatih2 = await prisma.pelatih_profiles.upsert({
    where: { id_pelatih: 'PLT-2026-0002' },
    update: {},
    create: {
      user_id: userPelatih2.id,
      id_pelatih: 'PLT-2026-0002',
      nama_lengkap: 'Siti Rahayu',
      tempat_lahir: 'Bandung',
      tanggal_lahir: new Date('1990-03-22'),
      jenis_kelamin: JenisKelamin.Perempuan,
      alamat: 'Jl. Asia Afrika No. 25, Bandung',
      no_telepon: '081234567891',
      email_pribadi: 'siti.rahayu@gmail.com',
      sabuk: 'Hijau_Polos',
      tempat_melatih_id: lokasi2.id,
      tanggal_gabung: new Date('2021-06-01'),
    },
  });

  await prisma.tempat_latihan.update({
    where: { id: lokasi2.id },
    data: { pelatih_pj_id: pelatih2.id },
  });

  // Pelatih 3 untuk Surabaya
  const userPelatih3 = await prisma.users.upsert({
    where: { email: 'andi.pratama@bmayu.com' },
    update: {},
    create: {
      email: 'andi.pratama@bmayu.com',
      password_hash: pelatihPassword,
      role: UserRole.pelatih,
      status: 'active',
    },
  });

  const pelatih3 = await prisma.pelatih_profiles.upsert({
    where: { id_pelatih: 'PLT-2026-0003' },
    update: {},
    create: {
      user_id: userPelatih3.id,
      id_pelatih: 'PLT-2026-0003',
      nama_lengkap: 'Andi Pratama',
      tempat_lahir: 'Surabaya',
      tanggal_lahir: new Date('1988-11-10'),
      jenis_kelamin: JenisKelamin.Laki_laki,
      alamat: 'Jl. Diponegoro No. 50, Surabaya',
      no_telepon: '081234567892',
      email_pribadi: 'andi.pratama@gmail.com',
      sabuk: 'Hijau_Strip_2',
      tempat_melatih_id: lokasi3.id,
      tanggal_gabung: new Date('2019-09-01'),
    },
  });

  await prisma.tempat_latihan.update({
    where: { id: lokasi3.id },
    data: { pelatih_pj_id: pelatih3.id },
  });
  console.log('✅ Pelatih created: 3');

  // ==================== DUAL-PROFILE: Pelatih + Anggota ====================
  // Budi Santoso juga aktif sebagai anggota (punya sabuk Biru Polos)
  await prisma.anggota_profiles.upsert({
    where: { id_anggota: 'AG006' },
    update: {},
    create: {
      user_id: userPelatih1.id, // User yang sama dengan pelatih1
      id_anggota: 'AG006',
      nama_lengkap: 'Budi Santoso',
      tempat_lahir: 'Jakarta',
      tanggal_lahir: new Date('1985-06-15'),
      jenis_kelamin: JenisKelamin.Laki_laki,
      no_telepon: '081234567890',
      sabuk: 'Biru_Polos',
      tanggal_gabung: new Date('2020-01-15'),
      status_keanggotaan: StatusKeanggotaan.Aktif,
      tempat_latihan_pertama_id: lokasi1.id,
      tempat_latihan_saat_ini_id: lokasi1.id,
      pelatih_pertama_id: pelatih1.id,
      pelatih_saat_ini_id: pelatih1.id,
    },
  });
  console.log('✅ Dual-profile created: Budi Santoso (Pelatih + Anggota AG006)');

  // ==================== ANGGOTA (New Schema) ====================
  const anggotaPassword = await hashPassword('anggota123');
  const anggotaData = [
    {
      email: 'ahmad.fauzi@bmayu.com',
      id_anggota: 'AG001',
      nama_lengkap: 'Ahmad Fauzi',
      tempat_lahir: 'Jakarta',
      tanggal_lahir: new Date('2000-05-20'),
      jenis_kelamin: JenisKelamin.Laki_laki,
      no_telepon: '081234567801',
      sabuk: 'Biru_Polos' as const,
      lokasi_pertama_id: lokasi1.id,
      lokasi_saat_ini_id: lokasi1.id,
      pelatih_pertama_id: pelatih1.id,
      pelatih_saat_ini_id: pelatih1.id,
    },
    {
      email: 'dewi.lestari@bmayu.com',
      id_anggota: 'AG002',
      nama_lengkap: 'Dewi Lestari',
      tempat_lahir: 'Bandung',
      tanggal_lahir: new Date('2001-08-14'),
      jenis_kelamin: JenisKelamin.Perempuan,
      no_telepon: '081234567802',
      sabuk: 'Hijau_Polos' as const,
      lokasi_pertama_id: lokasi2.id,
      lokasi_saat_ini_id: lokasi2.id,
      pelatih_pertama_id: pelatih2.id,
      pelatih_saat_ini_id: pelatih2.id,
    },
    {
      email: 'riko.pratama@bmayu.com',
      id_anggota: 'AG003',
      nama_lengkap: 'Riko Pratama',
      tempat_lahir: 'Surabaya',
      tanggal_lahir: new Date('1999-12-05'),
      jenis_kelamin: JenisKelamin.Laki_laki,
      no_telepon: '081234567803',
      sabuk: 'Biru_Strip_2' as const,
      lokasi_pertama_id: lokasi1.id,
      lokasi_saat_ini_id: lokasi3.id,
      pelatih_pertama_id: pelatih1.id,
      pelatih_saat_ini_id: pelatih3.id,
    },
    {
      email: 'putri.handayani@bmayu.com',
      id_anggota: 'AG004',
      nama_lengkap: 'Putri Handayani',
      tempat_lahir: 'Jakarta',
      tanggal_lahir: new Date('2002-02-28'),
      jenis_kelamin: JenisKelamin.Perempuan,
      no_telepon: '081234567804',
      sabuk: 'Merah_Strip_2' as const,
      lokasi_pertama_id: lokasi1.id,
      lokasi_saat_ini_id: lokasi1.id,
      pelatih_pertama_id: pelatih1.id,
      pelatih_saat_ini_id: pelatih1.id,
    },
    {
      email: 'farhan.maulana@bmayu.com',
      id_anggota: 'AG005',
      nama_lengkap: 'Farhan Maulana',
      tempat_lahir: 'Bandung',
      tanggal_lahir: new Date('2003-07-17'),
      jenis_kelamin: JenisKelamin.Laki_laki,
      no_telepon: '081234567805',
      sabuk: 'Belum_Sabuk' as const,
      lokasi_pertama_id: lokasi2.id,
      lokasi_saat_ini_id: lokasi2.id,
      pelatih_pertama_id: pelatih2.id,
      pelatih_saat_ini_id: pelatih2.id,
    },
  ];

  for (const data of anggotaData) {
    const user = await prisma.users.upsert({
      where: { email: data.email },
      update: {},
      create: {
        email: data.email,
        password_hash: anggotaPassword,
        role: UserRole.anggota,
        status: 'active',
      },
    });

    await prisma.anggota_profiles.upsert({
      where: { id_anggota: data.id_anggota },
      update: {},
      create: {
        user_id: user.id,
        id_anggota: data.id_anggota,
        nama_lengkap: data.nama_lengkap,
        tempat_lahir: data.tempat_lahir,
        tanggal_lahir: data.tanggal_lahir,
        jenis_kelamin: data.jenis_kelamin,
        no_telepon: data.no_telepon,
        sabuk: data.sabuk,
        tanggal_gabung: new Date('2026-01-15'),
        status_keanggotaan: StatusKeanggotaan.Aktif,
        tempat_latihan_pertama_id: data.lokasi_pertama_id,
        tempat_latihan_saat_ini_id: data.lokasi_saat_ini_id,
        pelatih_pertama_id: data.pelatih_pertama_id,
        pelatih_saat_ini_id: data.pelatih_saat_ini_id,
      },
    });
  }
  console.log('✅ Anggota created: 5');

  // ==================== JADWAL LATIHAN ====================
  const jadwalData = [
    {
      judul_materi: 'Latihan Teknik Dasar',
      tanggal: new Date('2026-09-01'),
      jam_mulai: new Date('2026-09-01T18:00:00'),
      jam_selesai: new Date('2026-09-01T20:00:00'),
      tempat_id: lokasi1.id,
      pelatih_id: pelatih1.id,
      tipe_latihan: 'Rutin' as const,
      target_peserta: 'Semua_Anggota' as const,
    },
    {
      judul_materi: 'Persiapan Kejuaraan',
      tanggal: new Date('2026-09-03'),
      jam_mulai: new Date('2026-09-03T19:00:00'),
      jam_selesai: new Date('2026-09-03T21:30:00'),
      tempat_id: lokasi2.id,
      pelatih_id: pelatih2.id,
      tipe_latihan: 'Khusus' as const,
      target_peserta: 'Semua_Anggota' as const,
    },
  ];

  for (const data of jadwalData) {
    await prisma.jadwal_latihan.create({
      data: { ...data, created_by: admin.id },
    });
  }
  console.log('✅ Jadwal latihan created: 2');

  console.log('\n🎉 Seeding completed!');
  console.log('\n📋 Login Credentials:');
  console.log('   Admin   : admin@bmayu.com / admin123');
  console.log('   Pelatih : budi.santoso@bmayu.com / pelatih123');
  console.log('   Anggota : ahmad.fauzi@bmayu.com / anggota123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

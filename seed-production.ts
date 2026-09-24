import { PrismaClient, UserRole, UserStatus, JenisKelamin, StatusKeanggotaan, StatusLokasi, TipeLatihan, TargetPeserta, StatusJadwal, StatusPresensi } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ==================== DATA LOKAL ====================
const LOCAL_USERS = [
  { email: 'ahmad.fauzi@bmayu.com', role: 'anggota', status: 'active' },
  { email: 'dewi.lestari@bmayu.com', role: 'anggota', status: 'active' },
  { email: 'riko.pratama@bmayu.com', role: 'anggota', status: 'active' },
  { email: 'putri.handayani@bmayu.com', role: 'anggota', status: 'active' },
  { email: 'farhan.maulana@bmayu.com', role: 'anggota', status: 'active' },
  { email: 'poncoteguh@gmail.com', role: 'pelatih', status: 'active' },
  { email: 'admin@bmayu.com', role: 'admin', status: 'active' },
  { email: 'ag008@sipbm.local', role: 'anggota', status: 'active' },
  { email: 'alif@bhayumanunggal.com', role: 'pelatih', status: 'inactive' },
  { email: 'ag007@sipbm.local', role: 'anggota', status: 'inactive' },
  { email: 'aliffajar486@gmail.com', role: 'pelatih', status: 'inactive' },
  { email: 'supardigudel@gmail.com', role: 'pelatih', status: 'active' },
  { email: 'admin@bhayumanunggal.com', role: 'admin', status: 'active' },
  { email: 'ag009@sipbm.local', role: 'anggota', status: 'active' },
];

const LOCAL_LOKASI = [
  { id_lokasi: 'LOC-0005', nama: 'Padepokan Bhayu Manunggal Cipayung', kota: 'Kota Administrasi Jakarta Timur', provinsi: 'DKI Jakarta', kecamatan: 'Cipayung', kapasitas: 50 },
  { id_lokasi: 'LOC-0006', nama: 'Dayeuh Kolot', kota: 'Kabupaten Bandung', provinsi: 'Jawa Barat', kecamatan: 'Dayeuhkolot', kapasitas: 41 },
  { id_lokasi: 'LOC-0004', nama: 'Madinatul Quran Jonggol', kota: 'Kota Bogor', provinsi: 'Jawa Barat', kecamatan: 'Bogor Timur', kapasitas: 50 },
  { id_lokasi: 'LOC-0002', nama: 'Padepokan Bhayu Manunggal', kota: 'Kota Bandung', provinsi: 'Jawa Barat', alamat: 'Jl. Pahlawan No. 45, Kel. Burangrang, Kec. Lengkong', kapasitas: 40 },
];

const LOCAL_ANGGOTA = [
  { email: 'ag009@sipbm.local', id_anggota: 'AG009', nama: 'Ahmad Fauzi', tl: 'Bandung', tgl: '1995-03-15', jk: 'Laki_laki', telp: '081234567890', sabuk: 'Biru_Polos', gabung: '2023-01-15' },
  { email: 'ag008@sipbm.local', id_anggota: 'AG008', nama: 'M Fajrul Hanan', tl: 'Jakarta', tgl: '2010-11-11', jk: 'Laki_laki', telp: '0882183218321', sabuk: 'Belum_Sabuk', gabung: '2024-09-19', lokasiIdx: 0 },
  { email: 'dewi.lestari@bmayu.com', id_anggota: 'AG002', nama: 'Dewi Lestari', tl: 'Bandung', tgl: '2001-08-14', jk: 'Perempuan', telp: '081234567802', sabuk: 'Hijau_Polos', gabung: '2026-01-15', lokasiIdx: 3, archived: true },
  { email: 'farhan.maulana@bmayu.com', id_anggota: 'AG005', nama: 'Farhan Maulana', tl: 'Bandung', tgl: '2003-07-17', jk: 'Laki_laki', telp: '081234567805', sabuk: 'Belum_Sabuk', gabung: '2026-01-15', lokasiIdx: 3, archived: true },
  { email: 'ag007@sipbm.local', id_anggota: 'AG007', nama: 'Alif Fajar Imannudin', tl: 'Bandar Lampung', tgl: '1997-10-11', jk: 'Laki_laki', telp: '081284101560', sabuk: 'Biru_Polos', gabung: '2014-09-01', lokasiIdx: 2 },
  { email: 'riko.pratama@bmayu.com', id_anggota: 'AG003', nama: 'Riko Pratama', tl: 'Surabaya', tgl: '1999-12-05', jk: 'Laki_laki', telp: '081234567803', sabuk: 'Biru_Strip_2', gabung: '2026-01-15', archived: true },
  { email: 'ahmad.fauzi@bmayu.com', id_anggota: 'AG001', nama: 'Ahmad Fauzi', tl: 'Jakarta', tgl: '2000-05-20', jk: 'Laki_laki', telp: '081234567801', sabuk: 'Biru_Polos', gabung: '2026-01-15', archived: true },
  { email: 'putri.handayani@bmayu.com', id_anggota: 'AG004', nama: 'Putri Handayani', tl: 'Jakarta', tgl: '2002-02-28', jk: 'Perempuan', telp: '081234567804', sabuk: 'Merah_Strip_2', gabung: '2026-01-15', archived: true },
];

const LOCAL_PELATIH = [
  { email: 'aliffajar486@gmail.com', id_pelatih: 'PLT-2026-0005', nama: 'Alif Fajar Imannudin', tl: 'Bandar Lampung', tgl: '1997-10-11', jk: 'Laki_laki', alamat: 'Kp. Tengah RT06/03, Desa Cipeucang, Kec. Cileungsi', telp: '081284101560', sabuk: 'Biru_Polos', gabung: '2014-09-18', emailPribadi: 'aliffajar486@gmail.com' },
  { email: 'alif@bhayumanunggal.com', id_pelatih: 'PLT-2026-0004', nama: 'Alif Fajar Imannudin', tl: 'Bandar Lampung', tgl: '1997-10-11', jk: 'Laki_laki', alamat: 'Jonggol', telp: '081284101560', sabuk: 'Biru_Polos', gabung: '2014-09-07', archived: true },
  { email: 'poncoteguh@gmail.com', id_pelatih: 'PLT-2026-0006', nama: 'Ponco Teguh', tl: 'Yogyakarta', tgl: '1975-11-11', jk: 'Laki_laki', alamat: 'Tes testes', telp: '0812821838123', sabuk: 'Hijau_Strip_2', gabung: '1980-09-19' },
  { email: 'supardigudel@gmail.com', id_pelatih: 'PLT-2026-0007', nama: 'Supardi Gudel', tl: 'Kota Yogyakarta', tgl: '1985-11-11', jk: 'Laki_laki', alamat: 'Dayeuh kolot', telp: '0812318231', sabuk: 'Hijau_Polos', gabung: '1990-09-21' },
];

async function main() {
  console.log('🌱 Seeding production database with local data...');

  // ==================== CLEAR ====================
  console.log('🗑️  Clearing existing data...');
  await prisma.presensi.deleteMany();
  await prisma.jadwal_latihan.deleteMany();
  await prisma.penugasan.deleteMany();
  await prisma.anggota_profiles.deleteMany();
  await prisma.pelatih_profiles.deleteMany();
  await prisma.tempat_latihan.deleteMany();
  await prisma.audit_logs.deleteMany();
  await prisma.users.deleteMany();
  console.log('✅ Cleared');

  const pw = await bcrypt.hash('pelatih123', 12);
  const adminPw = await bcrypt.hash('admin123', 12);

  // ==================== USERS ====================
  console.log('👤 Creating users...');
  const emailToUserId: Record<string, string> = {};
  for (const u of LOCAL_USERS) {
    const user = await prisma.users.create({
      data: { email: u.email, password_hash: u.email.includes('admin') ? adminPw : pw, role: u.role as UserRole, status: u.status as UserStatus },
    });
    emailToUserId[u.email] = user.id;
  }
  console.log(`✅ ${LOCAL_USERS.length} users`);

  // ==================== LOKASI ====================
  console.log('📍 Creating lokasi...');
  const lokasiIds: string[] = [];
  for (const l of LOCAL_LOKASI) {
    const lok = await prisma.tempat_latihan.create({
      data: { id_lokasi: l.id_lokasi, nama: l.nama, alamat: l.alamat || null, kota: l.kota, provinsi: l.provinsi, kecamatan: l.kecamatan || null, jam_operasional: '-', kapasitas: l.kapasitas, status: 'Aktif' },
    });
    lokasiIds.push(lok.id);
  }
  console.log(`✅ ${LOCAL_LOKASI.length} lokasi`);

  // ==================== PELATIH ====================
  console.log('🏋️ Creating pelatih...');
  const pelatihIds: string[] = [];
  for (const p of LOCAL_PELATIH) {
    const pt = await prisma.pelatih_profiles.create({
      data: {
        user_id: emailToUserId[p.email], id_pelatih: p.id_pelatih, nama_lengkap: p.nama,
        tempat_lahir: p.tl, tanggal_lahir: new Date(p.tgl), jenis_kelamin: p.jk as JenisKelamin,
        alamat: p.alamat, no_telepon: p.telp, email_pribadi: p.emailPribadi || null,
        sabuk: p.sabuk as any, tanggal_gabung: new Date(p.gabung),
      },
    });
    pelatihIds.push(pt.id);
  }
  console.log(`✅ ${LOCAL_PELATIH.length} pelatih`);

  // Set PJ
  await prisma.tempat_latihan.update({ where: { id: lokasiIds[0] }, data: { pelatih_pj_id: pelatihIds[2] } }).catch(() => {});
  await prisma.tempat_latihan.update({ where: { id: lokasiIds[1] }, data: { pelatih_pj_id: pelatihIds[3] } }).catch(() => {});

  // ==================== ANGGOTA ====================
  console.log('👥 Creating anggota...');
  for (const a of LOCAL_ANGGOTA) {
    await prisma.anggota_profiles.create({
      data: {
        user_id: emailToUserId[a.email], id_anggota: a.id_anggota, nama_lengkap: a.nama,
        tempat_lahir: a.tl, tanggal_lahir: new Date(a.tgl), jenis_kelamin: a.jk as JenisKelamin,
        no_telepon: a.telp, sabuk: a.sabuk as any, tanggal_gabung: new Date(a.gabung),
        status_keanggotaan: 'Aktif',
        tempat_latihan_pertama_id: a.lokasiIdx !== undefined ? lokasiIds[a.lokasiIdx] : null,
        tempat_latihan_saat_ini_id: a.lokasiIdx !== undefined ? lokasiIds[a.lokasiIdx] : null,
      },
    });
  }
  console.log(`✅ ${LOCAL_ANGGOTA.length} anggota`);

  // ==================== SUMMARY ====================
  const [u, a, p, l] = await Promise.all([
    prisma.users.count(), prisma.anggota_profiles.count(),
    prisma.pelatih_profiles.count(), prisma.tempat_latihan.count(),
  ]);
  console.log(`\n📊 Users: ${u} | Anggota: ${a} | Pelatih: ${p} | Lokasi: ${l}`);
  console.log('✅ Production seeding completed!');
  console.log('🔑 Login: admin@bmayu.com / admin123');
}

main().catch(e => { console.error('❌ Seeding failed:', e); process.exit(1); }).finally(() => prisma.$disconnect());

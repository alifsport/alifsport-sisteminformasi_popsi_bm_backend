import { PrismaClient, UserRole, UserStatus, JenisKelamin, StatusKeanggotaan, StatusLokasi, TipeLatihan, TargetPeserta, StatusJadwal, StatusPresensi } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding production database...');

  const localData = JSON.parse(fs.readFileSync('./local-data.json', 'utf-8'));

  // ==================== CLEAR EXISTING DATA ====================
  console.log('🗑️  Clearing existing data...');
  await prisma.presensi.deleteMany();
  await prisma.jadwal_latihan.deleteMany();
  await prisma.anggota_profiles.deleteMany();
  await prisma.pelatih_profiles.deleteMany();
  await prisma.tempat_latihan.deleteMany();
  await prisma.audit_logs.deleteMany();
  await prisma.users.deleteMany();
  console.log('✅ All data cleared');

  // ==================== USERS ====================
  console.log('👤 Creating users...');
  const passwordHash = await bcrypt.hash('admin123', 12);
  const userMap: Record<string, string> = {}; // old_id -> new_id

  for (const u of localData.users) {
    const newUser = await prisma.users.create({
      data: {
        email: u.email,
        password_hash: passwordHash,
        role: u.role as UserRole,
        status: u.status as UserStatus,
      },
    });
    userMap[u.id] = newUser.id;
  }
  console.log(`✅ Created ${localData.users.length} users`);

  // ==================== LOKASI ====================
  console.log('📍 Creating lokasi...');
  const lokasiMap: Record<string, string> = {};

  for (const l of localData.lokasi) {
    const newLokasi = await prisma.tempat_latihan.create({
      data: {
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
        foto_urls: l.foto_urls || [],
        status: l.status as StatusLokasi,
      },
    });
    lokasiMap[l.id] = newLokasi.id;
  }
  console.log(`✅ Created ${localData.lokasi.length} lokasi`);

  // ==================== PELATIH ====================
  console.log('🏋️ Creating pelatih...');
  const pelatihMap: Record<string, string> = {};

  for (const p of localData.pelatih) {
    const newPelatih = await prisma.pelatih_profiles.create({
      data: {
        user_id: userMap[p.user_id],
        id_pelatih: p.id_pelatih,
        nama_lengkap: p.nama_lengkap,
        tempat_lahir: p.tempat_lahir,
        tanggal_lahir: new Date(p.tanggal_lahir),
        jenis_kelamin: p.jenis_kelamin as JenisKelamin,
        alamat: p.alamat,
        no_telepon: p.no_telepon,
        email_pribadi: p.email_pribadi,
        foto_url: p.foto_url,
        sabuk: p.sabuk as any,
        tempat_melatih_id: p.tempat_melatih_id ? lokasiMap[p.tempat_melatih_id] || undefined : undefined,
        tanggal_gabung: new Date(p.tanggal_gabung),
      },
    });
    pelatihMap[p.id] = newPelatih.id;

    // Set pelatih PJ on lokasi
    if (p.tempat_melatih_id && lokasiMap[p.tempat_melatih_id]) {
      await prisma.tempat_latihan.update({
        where: { id: lokasiMap[p.tempat_melatih_id] },
        data: { pelatih_pj_id: newPelatih.id },
      }).catch(() => {});
    }
  }
  console.log(`✅ Created ${localData.pelatih.length} pelatih`);

  // ==================== ANGGOTA ====================
  console.log('👥 Creating anggota...');
  for (const a of localData.anggota) {
    await prisma.anggota_profiles.create({
      data: {
        user_id: userMap[a.user_id],
        id_anggota: a.id_anggota,
        nama_lengkap: a.nama_lengkap,
        tempat_lahir: a.tempat_lahir,
        tanggal_lahir: new Date(a.tanggal_lahir),
        jenis_kelamin: a.jenis_kelamin as JenisKelamin,
        no_telepon: a.no_telepon,
        email_pribadi: a.email_pribadi,
        foto_url: a.foto_url,
        sabuk: a.sabuk as any,
        tanggal_gabung: new Date(a.tanggal_gabung),
        status_keanggotaan: a.status_keanggotaan as StatusKeanggotaan,
        tempat_latihan_pertama_id: a.tempat_latihan_pertama_id ? lokasiMap[a.tempat_latihan_pertama_id] || undefined : undefined,
        tempat_latihan_saat_ini_id: a.tempat_latihan_saat_ini_id ? lokasiMap[a.tempat_latihan_saat_ini_id] || undefined : undefined,
        pelatih_pertama_id: a.pelatih_pertama_id ? pelatihMap[a.pelatih_pertama_id] || undefined : undefined,
        pelatih_saat_ini_id: a.pelatih_saat_ini_id ? pelatihMap[a.pelatih_saat_ini_id] || undefined : undefined,
      },
    });
  }
  console.log(`✅ Created ${localData.anggota.length} anggota`);

  // ==================== JADWAL ====================
  console.log('📅 Creating jadwal...');
  for (const j of localData.jadwal) {
    await prisma.jadwal_latihan.create({
      data: {
        judul_materi: j.judul_materi,
        tanggal: new Date(j.tanggal),
        jam_mulai: new Date(j.jam_mulai),
        jam_selesai: new Date(j.jam_selesai),
        tempat_id: lokasiMap[j.tempat_id],
        pelatih_id: pelatihMap[j.pelatih_id] || userMap[j.pelatih_id] || j.pelatih_id,
        tipe_latihan: j.tipe_latihan as TipeLatihan,
        target_peserta: j.target_peserta as TargetPeserta,
        hari: j.hari,
        catatan: j.catatan,
        seri_id: j.seri_id,
        status: j.status as StatusJadwal,
        created_by: userMap[j.created_by] || j.created_by,
      },
    }).catch((e: any) => console.log(`  ⚠️  Jadwal skipped: ${j.judul_materi} - ${e.message?.substring(0, 80)}`));
  }
  console.log(`✅ Created jadwal`);

  // ==================== SUMMARY ====================
  const counts = await Promise.all([
    prisma.users.count(),
    prisma.anggota_profiles.count(),
    prisma.pelatih_profiles.count(),
    prisma.tempat_latihan.count(),
    prisma.jadwal_latihan.count(),
    prisma.presensi.count(),
  ]);

  console.log('\n📊 Summary:');
  console.log(`  Users: ${counts[0]}`);
  console.log(`  Anggota: ${counts[1]}`);
  console.log(`  Pelatih: ${counts[2]}`);
  console.log(`  Lokasi: ${counts[3]}`);
  console.log(`  Jadwal: ${counts[4]}`);
  console.log(`  Presensi: ${counts[5]}`);
  console.log('\n✅ Production seeding completed!');
}

main().catch(e => { console.error('❌ Seeding failed:', e); process.exit(1); }).finally(() => prisma.$disconnect());

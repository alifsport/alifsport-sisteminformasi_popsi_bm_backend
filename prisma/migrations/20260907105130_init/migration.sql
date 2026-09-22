-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'pelatih', 'anggota');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive', 'locked');

-- CreateEnum
CREATE TYPE "Sabuk" AS ENUM ('Belum_Sabuk', 'Merah_Strip_1', 'Merah_Strip_2', 'Merah_Strip_3', 'Biru_Polos', 'Biru_Strip_1', 'Biru_Strip_2', 'Biru_Strip_3', 'Hijau_Polos', 'Hijau_Strip_1', 'Hijau_Strip_2', 'Hijau_Strip_3');

-- CreateEnum
CREATE TYPE "JenisKelamin" AS ENUM ('Laki_laki', 'Perempuan');

-- CreateEnum
CREATE TYPE "StatusKeanggotaan" AS ENUM ('Aktif', 'Tidak_Aktif', 'Pengurus', 'Pelatih');

-- CreateEnum
CREATE TYPE "TipeLatihan" AS ENUM ('Rutin', 'Khusus', 'Ujian', 'Kejuaraan', 'Peringatan');

-- CreateEnum
CREATE TYPE "TargetPeserta" AS ENUM ('Semua_Anggota', 'Sabuk_Putih_Hijau', 'Sabuk_Biru_Hitam', 'Aturan_Khusus');

-- CreateEnum
CREATE TYPE "StatusJadwal" AS ENUM ('Dijadwalkan', 'Berlangsung', 'Selesai', 'Dibatalkan');

-- CreateEnum
CREATE TYPE "StatusPresensi" AS ENUM ('Hadir', 'Izin', 'Alpa', 'Terlambat', 'Sakit');

-- CreateEnum
CREATE TYPE "StatusPenugasan" AS ENUM ('Aktif', 'Selesai', 'Dipindahkan');

-- CreateEnum
CREATE TYPE "TingkatKejuaraan" AS ENUM ('Club', 'Kabupaten', 'Provinsi', 'Nasional', 'Internasional');

-- CreateEnum
CREATE TYPE "TipeNotifikasi" AS ENUM ('jadwal', 'presensi', 'prestasi', 'sistem', 'transfer');

-- CreateEnum
CREATE TYPE "StatusLokasi" AS ENUM ('Aktif', 'Tidak_Aktif', 'Maintenance');

-- CreateEnum
CREATE TYPE "AksiAudit" AS ENUM ('create', 'update', 'delete', 'login', 'logout', 'export', 'restore');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "last_login_at" TIMESTAMPTZ,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ,
    "reset_token" VARCHAR(255),
    "reset_token_expires" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anggota_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "id_anggota" VARCHAR(20) NOT NULL,
    "nama_lengkap" VARCHAR(100) NOT NULL,
    "tempat_lahir" VARCHAR(50) NOT NULL,
    "tanggal_lahir" DATE NOT NULL,
    "jenis_kelamin" "JenisKelamin" NOT NULL,
    "no_telepon" VARCHAR(15) NOT NULL,
    "email_pribadi" VARCHAR(255),
    "foto_url" VARCHAR(500),
    "sabuk" "Sabuk" NOT NULL,
    "tanggal_gabung" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status_keanggotaan" "StatusKeanggotaan" NOT NULL DEFAULT 'Aktif',
    "tempat_latihan_pertama_id" UUID,
    "tempat_latihan_saat_ini_id" UUID,
    "pelatih_pertama_id" UUID,
    "pelatih_saat_ini_id" UUID,
    "deleted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anggota_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pelatih_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "id_pelatih" VARCHAR(20) NOT NULL,
    "nama_lengkap" VARCHAR(100) NOT NULL,
    "tempat_lahir" VARCHAR(50) NOT NULL,
    "tanggal_lahir" DATE NOT NULL,
    "jenis_kelamin" "JenisKelamin" NOT NULL,
    "alamat" TEXT NOT NULL,
    "no_telepon" VARCHAR(15) NOT NULL,
    "email_pribadi" VARCHAR(255),
    "foto_url" VARCHAR(500),
    "sabuk" "Sabuk" NOT NULL,
    "tempat_melatih_id" UUID,
    "tanggal_gabung" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pelatih_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tempat_latihan" (
    "id" UUID NOT NULL,
    "id_lokasi" VARCHAR(20) NOT NULL,
    "nama" VARCHAR(100) NOT NULL,
    "alamat" TEXT,
    "kota" VARCHAR(50) NOT NULL,
    "provinsi" VARCHAR(50) NOT NULL,
    "kecamatan" VARCHAR(50),
    "kode_pos" VARCHAR(5),
    "jam_operasional" VARCHAR(255) NOT NULL,
    "kapasitas" INTEGER NOT NULL,
    "pelatih_pj_id" UUID,
    "foto_urls" TEXT[],
    "status" "StatusLokasi" NOT NULL DEFAULT 'Aktif',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tempat_latihan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jadwal_latihan" (
    "id" UUID NOT NULL,
    "judul_materi" VARCHAR(100) NOT NULL,
    "tanggal" DATE NOT NULL,
    "jam_mulai" TIMESTAMPTZ NOT NULL,
    "jam_selesai" TIMESTAMPTZ NOT NULL,
    "tempat_id" UUID NOT NULL,
    "pelatih_id" UUID NOT NULL,
    "tipe_latihan" "TipeLatihan" NOT NULL,
    "target_peserta" "TargetPeserta" NOT NULL,
    "catatan" TEXT,
    "seri_id" UUID,
    "status" "StatusJadwal" NOT NULL DEFAULT 'Dijadwalkan',
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jadwal_latihan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presensi" (
    "id" UUID NOT NULL,
    "jadwal_id" UUID NOT NULL,
    "anggota_id" UUID NOT NULL,
    "status" "StatusPresensi" NOT NULL,
    "keterangan" TEXT,
    "catatan_umum" TEXT,
    "input_oleh" UUID NOT NULL,
    "waktu_input" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "presensi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "penugasan" (
    "id" UUID NOT NULL,
    "anggota_id" UUID NOT NULL,
    "tempat_id" UUID NOT NULL,
    "tanggal_mulai" DATE NOT NULL,
    "tanggal_selesai" DATE,
    "alasan" TEXT,
    "status" "StatusPenugasan" NOT NULL DEFAULT 'Aktif',
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "penugasan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prestasi" (
    "id" UUID NOT NULL,
    "anggota_id" UUID NOT NULL,
    "nama_kejuaraan" VARCHAR(200) NOT NULL,
    "tingkat" "TingkatKejuaraan" NOT NULL,
    "tanggal" DATE NOT NULL,
    "perolehan" VARCHAR(100) NOT NULL,
    "kategori" VARCHAR(50) NOT NULL,
    "lokasi_kejuaraan" VARCHAR(200) NOT NULL,
    "catatan" TEXT,
    "file_url" VARCHAR(500),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prestasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "judul" VARCHAR(200) NOT NULL,
    "pesan" TEXT NOT NULL,
    "tipe" "TipeNotifikasi" NOT NULL,
    "link" VARCHAR(500),
    "dibaca" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "aksi" VARCHAR(50) NOT NULL,
    "entitas" VARCHAR(50) NOT NULL,
    "entitas_id" UUID,
    "detail" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(500),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "anggota_profiles_user_id_key" ON "anggota_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "anggota_profiles_id_anggota_key" ON "anggota_profiles"("id_anggota");

-- CreateIndex
CREATE INDEX "anggota_profiles_nama_lengkap_idx" ON "anggota_profiles"("nama_lengkap");

-- CreateIndex
CREATE INDEX "anggota_profiles_id_anggota_idx" ON "anggota_profiles"("id_anggota");

-- CreateIndex
CREATE INDEX "anggota_profiles_sabuk_idx" ON "anggota_profiles"("sabuk");

-- CreateIndex
CREATE INDEX "anggota_profiles_status_keanggotaan_idx" ON "anggota_profiles"("status_keanggotaan");

-- CreateIndex
CREATE INDEX "anggota_profiles_tanggal_gabung_idx" ON "anggota_profiles"("tanggal_gabung");

-- CreateIndex
CREATE UNIQUE INDEX "pelatih_profiles_user_id_key" ON "pelatih_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "pelatih_profiles_id_pelatih_key" ON "pelatih_profiles"("id_pelatih");

-- CreateIndex
CREATE INDEX "pelatih_profiles_nama_lengkap_idx" ON "pelatih_profiles"("nama_lengkap");

-- CreateIndex
CREATE INDEX "pelatih_profiles_id_pelatih_idx" ON "pelatih_profiles"("id_pelatih");

-- CreateIndex
CREATE INDEX "pelatih_profiles_sabuk_idx" ON "pelatih_profiles"("sabuk");

-- CreateIndex
CREATE UNIQUE INDEX "tempat_latihan_id_lokasi_key" ON "tempat_latihan"("id_lokasi");

-- CreateIndex
CREATE UNIQUE INDEX "tempat_latihan_nama_key" ON "tempat_latihan"("nama");

-- CreateIndex
CREATE INDEX "tempat_latihan_nama_idx" ON "tempat_latihan"("nama");

-- CreateIndex
CREATE INDEX "tempat_latihan_kota_idx" ON "tempat_latihan"("kota");

-- CreateIndex
CREATE INDEX "tempat_latihan_status_idx" ON "tempat_latihan"("status");

-- CreateIndex
CREATE INDEX "jadwal_latihan_tanggal_idx" ON "jadwal_latihan"("tanggal");

-- CreateIndex
CREATE INDEX "jadwal_latihan_tempat_id_idx" ON "jadwal_latihan"("tempat_id");

-- CreateIndex
CREATE INDEX "jadwal_latihan_pelatih_id_idx" ON "jadwal_latihan"("pelatih_id");

-- CreateIndex
CREATE INDEX "jadwal_latihan_status_idx" ON "jadwal_latihan"("status");

-- CreateIndex
CREATE INDEX "jadwal_latihan_seri_id_idx" ON "jadwal_latihan"("seri_id");

-- CreateIndex
CREATE INDEX "presensi_jadwal_id_idx" ON "presensi"("jadwal_id");

-- CreateIndex
CREATE INDEX "presensi_anggota_id_idx" ON "presensi"("anggota_id");

-- CreateIndex
CREATE INDEX "presensi_status_idx" ON "presensi"("status");

-- CreateIndex
CREATE UNIQUE INDEX "presensi_jadwal_id_anggota_id_key" ON "presensi"("jadwal_id", "anggota_id");

-- CreateIndex
CREATE INDEX "penugasan_anggota_id_idx" ON "penugasan"("anggota_id");

-- CreateIndex
CREATE INDEX "penugasan_tempat_id_idx" ON "penugasan"("tempat_id");

-- CreateIndex
CREATE INDEX "penugasan_status_idx" ON "penugasan"("status");

-- CreateIndex
CREATE INDEX "prestasi_anggota_id_idx" ON "prestasi"("anggota_id");

-- CreateIndex
CREATE INDEX "prestasi_tingkat_idx" ON "prestasi"("tingkat");

-- CreateIndex
CREATE INDEX "prestasi_tanggal_idx" ON "prestasi"("tanggal");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_dibaca_idx" ON "notifications"("dibaca");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entitas_idx" ON "audit_logs"("entitas");

-- CreateIndex
CREATE INDEX "audit_logs_aksi_idx" ON "audit_logs"("aksi");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "anggota_profiles" ADD CONSTRAINT "anggota_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anggota_profiles" ADD CONSTRAINT "anggota_profiles_tempat_latihan_pertama_id_fkey" FOREIGN KEY ("tempat_latihan_pertama_id") REFERENCES "tempat_latihan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anggota_profiles" ADD CONSTRAINT "anggota_profiles_tempat_latihan_saat_ini_id_fkey" FOREIGN KEY ("tempat_latihan_saat_ini_id") REFERENCES "tempat_latihan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anggota_profiles" ADD CONSTRAINT "anggota_profiles_pelatih_pertama_id_fkey" FOREIGN KEY ("pelatih_pertama_id") REFERENCES "pelatih_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anggota_profiles" ADD CONSTRAINT "anggota_profiles_pelatih_saat_ini_id_fkey" FOREIGN KEY ("pelatih_saat_ini_id") REFERENCES "pelatih_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pelatih_profiles" ADD CONSTRAINT "pelatih_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pelatih_profiles" ADD CONSTRAINT "pelatih_profiles_tempat_melatih_id_fkey" FOREIGN KEY ("tempat_melatih_id") REFERENCES "tempat_latihan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tempat_latihan" ADD CONSTRAINT "tempat_latihan_pelatih_pj_id_fkey" FOREIGN KEY ("pelatih_pj_id") REFERENCES "pelatih_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal_latihan" ADD CONSTRAINT "jadwal_latihan_tempat_id_fkey" FOREIGN KEY ("tempat_id") REFERENCES "tempat_latihan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal_latihan" ADD CONSTRAINT "jadwal_latihan_pelatih_id_fkey" FOREIGN KEY ("pelatih_id") REFERENCES "pelatih_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jadwal_latihan" ADD CONSTRAINT "jadwal_latihan_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presensi" ADD CONSTRAINT "presensi_jadwal_id_fkey" FOREIGN KEY ("jadwal_id") REFERENCES "jadwal_latihan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presensi" ADD CONSTRAINT "presensi_anggota_id_fkey" FOREIGN KEY ("anggota_id") REFERENCES "anggota_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presensi" ADD CONSTRAINT "presensi_input_oleh_fkey" FOREIGN KEY ("input_oleh") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penugasan" ADD CONSTRAINT "penugasan_anggota_id_fkey" FOREIGN KEY ("anggota_id") REFERENCES "anggota_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penugasan" ADD CONSTRAINT "penugasan_tempat_id_fkey" FOREIGN KEY ("tempat_id") REFERENCES "tempat_latihan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penugasan" ADD CONSTRAINT "penugasan_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestasi" ADD CONSTRAINT "prestasi_anggota_id_fkey" FOREIGN KEY ("anggota_id") REFERENCES "anggota_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

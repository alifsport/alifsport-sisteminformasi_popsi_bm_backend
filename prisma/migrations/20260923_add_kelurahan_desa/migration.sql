-- AlterTable: Add kelurahan and desa to tempat_latihan
ALTER TABLE "tempat_latihan" ADD COLUMN "kelurahan" VARCHAR(50),
ADD COLUMN "desa" VARCHAR(50);

-- AlterTable: Add deleted_at to pelatih_profiles
ALTER TABLE "pelatih_profiles" ADD COLUMN "deleted_at" TIMESTAMPTZ;

-- AlterTable: Add tanggal to presensi
ALTER TABLE "presensi" ADD COLUMN "tanggal" DATE;

-- AlterEnum: Remove Hijau_Strip_3 from Sabuk
ALTER TYPE "Sabuk" RENAME TO "Sabuk_old";
CREATE TYPE "Sabuk" AS ENUM ('Belum_Sabuk', 'Merah_Strip_1', 'Merah_Strip_2', 'Merah_Strip_3', 'Biru_Polos', 'Biru_Strip_1', 'Biru_Strip_2', 'Biru_Strip_3', 'Hijau_Polos', 'Hijau_Strip_1', 'Hijau_Strip_2');
ALTER TABLE "anggota_profiles" ALTER COLUMN "sabuk" TYPE "Sabuk" USING "sabuk"::text::"Sabuk";
ALTER TABLE "pelatih_profiles" ALTER COLUMN "sabuk" TYPE "Sabuk" USING "sabuk"::text::"Sabuk";
DROP TYPE "Sabuk_old";

-- AlterEnum: Remove Izin from StatusPresensi
ALTER TYPE "StatusPresensi" RENAME TO "StatusPresensi_old";
CREATE TYPE "StatusPresensi" AS ENUM ('Hadir', 'Sakit', 'Alpa', 'Terlambat');
ALTER TABLE "presensi" ALTER COLUMN "status" TYPE "StatusPresensi" USING "status"::text::"StatusPresensi";
DROP TYPE "StatusPresensi_old";

-- AddUniqueConstraint: presensi jadwal_id_anggota_id_tanggal
ALTER TABLE "presensi" ADD CONSTRAINT "presensi_jadwal_id_anggota_id_tanggal_key" UNIQUE ("jadwal_id", "anggota_id", "tanggal");

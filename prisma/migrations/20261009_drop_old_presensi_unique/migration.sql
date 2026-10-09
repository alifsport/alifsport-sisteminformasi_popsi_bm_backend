-- Drop old unique constraint (without tanggal)
ALTER TABLE "presensi" DROP CONSTRAINT IF EXISTS "presensi_jadwal_id_anggota_id_key";

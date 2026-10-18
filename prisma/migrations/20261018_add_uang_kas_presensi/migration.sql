-- Fitur uang kas: kolom nominal iuran per sesi presensi anggota
ALTER TABLE "presensi" ADD COLUMN IF NOT EXISTS "uang_kas" INTEGER;

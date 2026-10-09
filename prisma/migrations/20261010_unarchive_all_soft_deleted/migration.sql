-- Fitur arsip dihapus: semua data yang pernah di-soft-delete dikembalikan aktif
UPDATE "anggota_profiles" SET "deleted_at" = NULL WHERE "deleted_at" IS NOT NULL;
UPDATE "pelatih_profiles" SET "deleted_at" = NULL WHERE "deleted_at" IS NOT NULL;

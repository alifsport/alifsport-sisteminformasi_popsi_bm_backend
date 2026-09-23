-- AlterTable: Add hari to jadwal_latihan (missing from previous migration)
ALTER TABLE "jadwal_latihan" ADD COLUMN "hari" VARCHAR(10);

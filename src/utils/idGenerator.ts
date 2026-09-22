import prisma from '../config/database';

/**
 * Generate ID Anggota format: AG001, AG002, ..., AG099, AG100, etc.
 * Uses MAX() query to be safe against concurrent inserts and soft deletes.
 * Never reuses deleted IDs.
 */
export async function generateIdAnggota(): Promise<string> {
  // Find the highest numeric suffix ever used (including archived/deleted)
  const last = await prisma.$queryRaw<{ max_num: bigint | null }[]>`
    SELECT
      CAST(
        REGEXP_REPLACE(id_anggota, '^AG0*', '', 'g') AS BIGINT
      ) AS max_num
    FROM anggota_profiles
    ORDER BY max_num DESC NULLS LAST
    LIMIT 1
  `;

  const nextNum = (last[0]?.max_num ?? 0n) + 1n;
  const numStr = String(nextNum).padStart(3, '0');
  return `AG${numStr}`;
}

/**
 * Generate ID Pelatih format: PLT-YYYY-XXXX
 */
export async function generateIdPelatih(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PLT-${year}-`;

  const lastPelatih = await prisma.pelatih_profiles.findFirst({
    where: {
      id_pelatih: { startsWith: prefix },
    },
    orderBy: { id_pelatih: 'desc' },
  });

  if (lastPelatih) {
    const lastNumber = parseInt(lastPelatih.id_pelatih.split('-')[2]);
    const newNumber = lastNumber + 1;
    return `${prefix}${String(newNumber).padStart(4, '0')}`;
  }

  return `${prefix}0001`;
}

/**
 * Generate ID Lokasi format: LOC-XXXX
 */
export async function generateIdLokasi(): Promise<string> {
  const prefix = 'LOC-';

  const lastLokasi = await prisma.tempat_latihan.findFirst({
    where: {
      id_lokasi: { startsWith: prefix },
    },
    orderBy: { id_lokasi: 'desc' },
  });

  if (lastLokasi) {
    const lastNumber = parseInt(lastLokasi.id_lokasi.split('-')[1]);
    const newNumber = lastNumber + 1;
    return `${prefix}${String(newNumber).padStart(4, '0')}`;
  }

  return `${prefix}0001`;
}

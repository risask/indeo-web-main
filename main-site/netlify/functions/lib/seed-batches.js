// Seed data awal — 1 batch contoh per program, diadaptasi dari panel-admin-batch-training.jsx
// (dateStart/dateEnd/format/venue asli dari prototipe; quotaPct lama dikonversi jadi
// maxCapacity=25 (asumsi kapasitas standar "20-30 peserta/batch") + registeredCount turunan.
// Admin bisa ubah maxCapacity per batch lewat panel kalau kapasitas sebenarnya berbeda.
function batch(programId, dateStart, dateEnd, format, venue, registeredCount, maxCapacity = 25) {
  const ym = dateStart.slice(0, 7);
  const id = `${programId}-${ym}`;
  return {
    id,
    programId,
    dateStart,
    dateEnd,
    format,
    venue,
    maxCapacity,
    registeredCount,
    formUrl: `/daftar-batch?program=${programId}&batch=${id}`,
    status: "open",
  };
}

export const SEED_BATCHES = [
  batch("tata-kelola", "2026-08-25", "2026-08-28", "online", "", 14),
  batch("kualitas-aset", "2026-08-18", "2026-08-19", "online", "", 17),
  batch("manajemen-risiko", "2026-09-01", "2026-09-03", "online", "", 8),
  batch("permodalan", "2026-09-08", "2026-09-10", "onsite", "Kantor InDeo Institute, Jakarta", 20),
  batch("bmpk-bmpd", "2026-09-22", "2026-09-24", "online", "", 10),
  batch("apolo", "2026-09-29", "2026-10-01", "online", "", 13),
  batch("kepatuhan-audit", "2026-10-06", "2026-10-08", "online", "", 9),
  batch("fit-proper", "2026-10-13", "2026-10-15", "online", "", 15),
  batch("ti", "2026-09-02", "2026-09-04", "online", "", 11),
  batch("perlindungan-konsumen", "2026-10-20", "2026-10-22", "online", "", 6),
  batch("transformasi-digital", "2026-10-27", "2026-10-29", "online", "", 10),
  batch("umkm", "2026-11-03", "2026-11-05", "online", "", 23),
];

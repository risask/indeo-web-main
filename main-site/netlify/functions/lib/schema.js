const FORMATS = new Set(["online", "onsite"]);
const STATUSES = new Set(["open", "closed", "draft"]);
const DEADLINE_TYPES = new Set(["batch", "regulatory", "overdue"]);

// Validasi satu record batch. `validProgramIds` adalah Set programId yang saat ini ada di
// Blobs (dinamis, dikelola lewat panel admin — bukan lagi konstanta statis). Melempar Error
// dengan pesan field-level kalau tidak valid.
export function validateBatch(batch, validProgramIds) {
  const errors = [];

  if (!batch.id || typeof batch.id !== "string") errors.push("id wajib diisi (slug string)");
  if (!batch.programId || !validProgramIds.has(batch.programId)) errors.push(`programId tidak valid: ${batch.programId}`);
  if (!batch.dateStart || !/^\d{4}-\d{2}-\d{2}$/.test(batch.dateStart)) errors.push("dateStart wajib format YYYY-MM-DD");
  if (!batch.dateEnd || !/^\d{4}-\d{2}-\d{2}$/.test(batch.dateEnd)) errors.push("dateEnd wajib format YYYY-MM-DD");
  if (batch.dateStart && batch.dateEnd && batch.dateEnd < batch.dateStart) errors.push("dateEnd harus >= dateStart");
  if (!FORMATS.has(batch.format)) errors.push(`format tidak valid: ${batch.format}`);
  if (batch.format === "onsite" && !batch.venue) errors.push("venue wajib diisi kalau format = onsite");
  if (!batch.formUrl || typeof batch.formUrl !== "string") errors.push("formUrl wajib diisi");
  if (!STATUSES.has(batch.status)) errors.push(`status tidak valid: ${batch.status}`);
  if (!Number.isInteger(batch.maxCapacity) || batch.maxCapacity <= 0) errors.push("maxCapacity wajib integer > 0");
  if (!Number.isInteger(batch.registeredCount) || batch.registeredCount < 0) errors.push("registeredCount wajib integer >= 0");

  if (errors.length) {
    throw new Error(errors.join("; "));
  }
  return true;
}

// quotaPct adalah computed field — jangan pernah disimpan, selalu dihitung dari registeredCount/maxCapacity.
export function computeQuotaPct(batch) {
  if (!batch.maxCapacity) return 0;
  return Math.round((batch.registeredCount / batch.maxCapacity) * 100);
}

export function daysUntil(dateStr) {
  const target = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / 86400000);
}

// Validasi satu record program. `existingIds` (Set) dipakai untuk cegah slug id bentrok saat
// bikin program baru — undefined kalau ini validasi untuk update program yang sudah ada.
export function validateProgram(program, existingIds) {
  const errors = [];

  if (!program.id || typeof program.id !== "string" || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(program.id)) {
    errors.push("id wajib diisi (slug huruf kecil, angka, strip)");
  } else if (existingIds && existingIds.has(program.id)) {
    errors.push(`id sudah dipakai program lain: ${program.id}`);
  }
  if (!program.title || typeof program.title !== "string") errors.push("title wajib diisi");
  if (!DEADLINE_TYPES.has(program.deadlineType)) errors.push(`deadlineType tidak valid: ${program.deadlineType}`);
  if (program.deadlineType === "regulatory" && (!program.regDeadline || !/^\d{4}-\d{2}-\d{2}$/.test(program.regDeadline))) {
    errors.push("regDeadline wajib format YYYY-MM-DD kalau deadlineType = regulatory");
  }

  if (errors.length) {
    throw new Error(errors.join("; "));
  }
  return true;
}

export function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

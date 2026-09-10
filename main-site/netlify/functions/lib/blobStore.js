import { getStore } from "@netlify/blobs";
import { SEED_BATCHES } from "./seed-batches.js";
import { SEED_PROGRAMS } from "./programs.js";

const STORE_NAME = "batch-training";
const BATCHES_KEY = "batches";
const PROGRAMS_KEY = "programs";

function store() {
  // consistency:"strong" supaya admin langsung lihat perubahan sendiri tanpa delay eventual-consistency.
  return getStore({ name: STORE_NAME, consistency: "strong" });
}

export async function getAllBatches() {
  const s = store();
  let batches = await s.get(BATCHES_KEY, { type: "json" });
  if (!batches) {
    batches = SEED_BATCHES;
    await s.setJSON(BATCHES_KEY, batches);
  }
  return batches;
}

export async function saveAllBatches(batches) {
  await store().setJSON(BATCHES_KEY, batches);
}

export async function getBatchById(id) {
  const batches = await getAllBatches();
  return batches.find((b) => b.id === id) || null;
}

export async function upsertBatch(batch) {
  const batches = await getAllBatches();
  const idx = batches.findIndex((b) => b.id === batch.id);
  if (idx === -1) {
    batches.push(batch);
  } else {
    batches[idx] = batch;
  }
  await saveAllBatches(batches);
  return batch;
}

export async function incrementRegisteredCount(batchId, amount = 1) {
  const batches = await getAllBatches();
  const idx = batches.findIndex((b) => b.id === batchId);
  if (idx === -1) throw new Error(`Batch tidak ditemukan: ${batchId}`);
  batches[idx].registeredCount += amount;
  await saveAllBatches(batches);
  return batches[idx];
}

export async function deleteBatch(id) {
  const batches = await getAllBatches();
  const idx = batches.findIndex((b) => b.id === id);
  if (idx === -1) throw new Error(`Batch tidak ditemukan: ${id}`);
  batches.splice(idx, 1);
  await saveAllBatches(batches);
}

export async function getAllPrograms() {
  const s = store();
  let programs = await s.get(PROGRAMS_KEY, { type: "json" });
  if (!programs) {
    programs = SEED_PROGRAMS;
    await s.setJSON(PROGRAMS_KEY, programs);
  }
  return programs;
}

export async function saveAllPrograms(programs) {
  await store().setJSON(PROGRAMS_KEY, programs);
}

export async function getProgramById(id) {
  const programs = await getAllPrograms();
  return programs.find((p) => p.id === id) || null;
}

export async function upsertProgram(program) {
  const programs = await getAllPrograms();
  const idx = programs.findIndex((p) => p.id === program.id);
  if (idx === -1) {
    programs.push(program);
  } else {
    programs[idx] = program;
  }
  await saveAllPrograms(programs);
  return program;
}

// Blokir hapus program yang masih dipakai batch — supaya tidak ada batch yatim (programId
// menunjuk ke program yang sudah hilang) yang bikin /api/batches error saat render.
export async function deleteProgram(id) {
  const [programs, batches] = await Promise.all([getAllPrograms(), getAllBatches()]);
  const inUse = batches.filter((b) => b.programId === id).length;
  if (inUse > 0) {
    throw new Error(`Program masih dipakai ${inUse} batch — hapus/pindahkan batch itu dulu`);
  }
  const idx = programs.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error(`Program tidak ditemukan: ${id}`);
  programs.splice(idx, 1);
  await saveAllPrograms(programs);
}

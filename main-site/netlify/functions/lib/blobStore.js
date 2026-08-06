import { getStore } from "@netlify/blobs";
import { SEED_BATCHES } from "./seed-batches.js";

const STORE_NAME = "batch-training";
const BATCHES_KEY = "batches";

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

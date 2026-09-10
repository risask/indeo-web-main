// GET /api/batches — publik, baca-saja. Gabung data batch (Blobs) + data program (statis),
// hitung quotaPct & hariTersisa on the fly, sembunyikan batch berstatus draft.
import { getAllBatches, getAllPrograms } from "./lib/blobStore.js";
import { computeQuotaPct, daysUntil } from "./lib/schema.js";

export default async (req) => {
  if (req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const [batches, programs] = await Promise.all([getAllBatches(), getAllPrograms()]);
  const programById = new Map(programs.map((p) => [p.id, p]));

  const result = batches
    .filter((b) => b.status !== "draft")
    .map((b) => {
      const program = programById.get(b.programId) || null;
      return {
        ...b,
        quotaPct: computeQuotaPct(b),
        program,
        daysUntilStart: daysUntil(b.dateStart),
        daysUntilRegDeadline: program?.deadlineType === "regulatory" ? daysUntil(program.regDeadline) : null,
      };
    });

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const config = { path: "/api/batches" };

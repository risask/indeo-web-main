// GET /api/batches — publik, baca-saja. Gabung data batch (Blobs) + data program (statis),
// hitung quotaPct & hariTersisa on the fly, sembunyikan batch berstatus draft.
import { getAllBatches } from "./lib/blobStore.js";
import { getProgram } from "./lib/programs.js";
import { computeQuotaPct, daysUntil } from "./lib/schema.js";

export default async (req) => {
  if (req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const batches = await getAllBatches();

  const result = batches
    .filter((b) => b.status !== "draft")
    .map((b) => {
      const program = getProgram(b.programId);
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

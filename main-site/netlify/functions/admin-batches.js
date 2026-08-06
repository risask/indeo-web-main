// GET/PUT /api/admin/batches — panel admin: baca semua batch (termasuk draft) & simpan perubahan.
// Digate Netlify Identity — lihat lib/auth.js untuk detail & catatan verifikasi.
import { getAllBatches, upsertBatch } from "./lib/blobStore.js";
import { validateBatch } from "./lib/schema.js";
import { requireAdmin, AuthError } from "./lib/auth.js";

export default async (req, context) => {
  try {
    requireAdmin(context);
  } catch (err) {
    if (err instanceof AuthError) {
      return new Response(JSON.stringify({ error: err.message }), { status: 401 });
    }
    throw err;
  }

  if (req.method === "GET") {
    const batches = await getAllBatches();
    return new Response(JSON.stringify(batches), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method === "PUT") {
    let batch;
    try {
      batch = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Body harus JSON valid" }), { status: 400 });
    }

    try {
      validateBatch(batch);
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 422 });
    }

    const saved = await upsertBatch(batch);
    return new Response(JSON.stringify(saved), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Method Not Allowed", { status: 405 });
};

export const config = { path: "/api/admin/batches" };

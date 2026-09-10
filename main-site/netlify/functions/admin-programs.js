// GET/POST/PUT/DELETE /api/admin/programs — panel admin: kelola daftar program training.
// Digate Netlify Identity — lihat lib/auth.js untuk detail & catatan verifikasi.
import { getAllPrograms, upsertProgram, deleteProgram } from "./lib/blobStore.js";
import { validateProgram, slugify } from "./lib/schema.js";
import { requireAdmin, AuthError } from "./lib/auth.js";

export default async (req) => {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof AuthError) {
      return new Response(JSON.stringify({ error: err.message }), { status: 401 });
    }
    throw err;
  }

  if (req.method === "GET") {
    const programs = await getAllPrograms();
    return new Response(JSON.stringify(programs), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method === "POST") {
    let input;
    try {
      input = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Body harus JSON valid" }), { status: 400 });
    }

    if (!input.title) {
      return new Response(JSON.stringify({ error: "title wajib diisi" }), { status: 422 });
    }
    const programs = await getAllPrograms();
    const existingIds = new Set(programs.map((p) => p.id));
    let id = slugify(input.title);
    let suffix = 2;
    while (existingIds.has(id)) {
      id = `${slugify(input.title)}-${suffix}`;
      suffix += 1;
    }

    const program = { ...input, id };
    try {
      validateProgram(program, existingIds);
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 422 });
    }

    const saved = await upsertProgram(program);
    return new Response(JSON.stringify(saved), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method === "PUT") {
    let program;
    try {
      program = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Body harus JSON valid" }), { status: 400 });
    }

    try {
      validateProgram(program);
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 422 });
    }

    const saved = await upsertProgram(program);
    return new Response(JSON.stringify(saved), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method === "DELETE") {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) {
      return new Response(JSON.stringify({ error: "Parameter id wajib diisi" }), { status: 400 });
    }
    try {
      await deleteProgram(id);
    } catch (err) {
      const status = err.message.includes("masih dipakai") ? 409 : 404;
      return new Response(JSON.stringify({ error: err.message }), { status });
    }
    return new Response(null, { status: 204 });
  }

  return new Response("Method Not Allowed", { status: 405 });
};

export const config = { path: "/api/admin/programs" };

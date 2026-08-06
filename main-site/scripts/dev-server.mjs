// Server dev sementara — HANYA untuk uji visual/fungsional lokal, BUKAN bagian dari deploy Netlify.
// Serve static file dari main-site/public/ (persis publish dir Netlify) — jadi /scripts/... dan
// /netlify/... otomatis 404 di sini juga, karena memang tidak ada di dalam public/ (allowlist by
// folder structure, bukan redirect blocklist).
//
// CARA PAKAI:
//   node scripts/dev-server.mjs
//   lalu buka http://localhost:8888 — meniru /api/batches, /api/admin/batches, /api/form-webhook
//   pakai array in-memory (reset tiap restart), jadi bisa uji form/panel-admin/card publik tanpa
//   perlu akun Netlify atau `netlify dev` sungguhan.
//
// Meniru behavior Netlify Functions + Blobs pakai array in-memory (karena @netlify/blobs butuh
// environment Netlify asli yang tidak tersedia di sandbox dev). Logic (validasi, computeQuotaPct,
// extractField webhook) sengaja disalin dari file lib/ asli supaya yang diuji representatif —
// kalau lib/ berubah, sinkronkan juga di sini.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SEED_BATCHES } from "../netlify/functions/lib/seed-batches.js";
import { getProgram } from "../netlify/functions/lib/programs.js";
import { validateBatch, computeQuotaPct, daysUntil } from "../netlify/functions/lib/schema.js";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const SITE_ROOT = path.join(SCRIPT_DIR, "..", "public"); // main-site/public/ — publish dir yang benar-benar di-deploy Netlify
const PORT = 8888;
const MIME = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".png": "image/png", ".ico": "image/x-icon", ".xml": "application/xml", ".txt": "text/plain" };

// in-memory "Blobs" — reset tiap server restart
let batches = JSON.parse(JSON.stringify(SEED_BATCHES));

function json(res, status, obj) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(obj));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let chunks = "";
    req.on("data", (c) => (chunks += c));
    req.on("end", () => {
      try { resolve(chunks ? JSON.parse(chunks) : {}); } catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}

function extractField(body, field) {
  return body?.payload?.data?.[field] ?? body?.payload?.[field] ?? body?.data?.[field] ?? body?.[field] ?? null;
}
function extractFormName(body) {
  return body?.payload?.form_name ?? body?.form_name ?? extractField(body, "form-name");
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");

  // GET /api/batches — publik, sembunyikan draft, computed fields
  if (url.pathname === "/api/batches" && req.method === "GET") {
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
    return json(res, 200, result);
  }

  // GET/PUT /api/admin/batches — panel admin.
  // Simulasi auth: dev server ini tidak bisa verifikasi JWT Identity asli, jadi cuma cek header
  // Authorization ADA atau tidak (cukup untuk uji alur UI 401 vs sukses, bukan uji keamanan JWT sungguhan —
  // itu tanggung jawab Netlify edge di production, lihat lib/auth.js).
  if (url.pathname === "/api/admin/batches") {
    if (!req.headers.authorization) {
      return json(res, 401, { error: "Unauthorized — login Identity diperlukan" });
    }
    if (req.method === "GET") {
      return json(res, 200, batches.map((b) => ({ ...b, quotaPct: computeQuotaPct(b), program: getProgram(b.programId) })));
    }
    if (req.method === "PUT") {
      let body;
      try { body = await readBody(req); } catch { return json(res, 400, { error: "Body harus JSON valid" }); }
      try { validateBatch(body); } catch (e) { return json(res, 422, { error: e.message }); }
      const idx = batches.findIndex((b) => b.id === body.id);
      if (idx === -1) batches.push(body); else batches[idx] = body;
      return json(res, 200, body);
    }
  }

  // POST /api/form-webhook — simulasi Netlify Forms outgoing webhook
  if (url.pathname === "/api/form-webhook" && req.method === "POST") {
    let body;
    try { body = await readBody(req); } catch { return json(res, 400, { error: "Body harus JSON valid" }); }
    const formName = extractFormName(body);
    if (formName !== "daftar-batch-training") return json(res, 200, { skipped: true, reason: "form_name tidak cocok", formName });
    const batchId = extractField(body, "batch");
    if (!batchId) return json(res, 400, { error: "Field 'batch' tidak ditemukan di payload" });
    const idx = batches.findIndex((b) => b.id === batchId);
    if (idx === -1) return json(res, 404, { error: `Batch tidak ditemukan: ${batchId}` });
    batches[idx].registeredCount += 1;
    return json(res, 200, { ok: true, batchId, registeredCount: batches[idx].registeredCount });
  }

  // static files — disajikan dari SITE_ROOT (main-site/), bukan dari scripts/
  let p = url.pathname;
  if (p.endsWith("/")) p = p + "index.html";
  else if (!path.extname(p)) p = p + ".html";
  const filePath = path.join(SITE_ROOT, p);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found: " + p);
      return;
    }
    res.writeHead(200, { "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream" });
    res.end(data);
  });
});

server.listen(PORT, () => console.log("dev server on http://localhost:" + PORT));

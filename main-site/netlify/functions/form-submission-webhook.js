// POST /api/form-webhook — dipanggil oleh Netlify Forms "Outgoing webhook" notification
// setiap ada submission baru ke form manapun di situs ini.
//
// SETUP MANUAL DI DASHBOARD (tidak bisa dilakukan lewat kode):
//   Project configuration → Notifications → Emails and webhooks → Form submission notifications
//   → Add notification → Outgoing webhook → arahkan ke URL function ini (/api/form-webhook),
//   scope-kan ke form "daftar-batch-training" saja (bukan semua form di situs).
//
// ⚠️ Bentuk payload persis dari Netlify (field mana yang berisi form_name/data) TIDAK didokumentasikan
// resmi lengkap di docs.netlify.com per pengecekan terakhir — kode ini menebak bentuk yang umum dipakai
// komunitas (`payload.data` / `payload.form_name`). WAJIB diverifikasi ulang dengan payload asli begitu
// webhook pertama kali live (lihat log function di Netlify dashboard), lalu sesuaikan `extractField` di bawah.
//
// ⚠️ Endpoint ini publicly reachable tanpa verifikasi signature (Netlify belum mendokumentasikan skema
// signing untuk outgoing webhook per pengecekan terakhir) — siapa saja yang tahu URL-nya bisa kirim POST
// palsu untuk menambah registeredCount. Risiko rendah (cuma menggeser angka kuota, bukan kebocoran data),
// tapi tetap dicatat sebagai open item di Tahap 6 (review keamanan).
import { getAllBatches, incrementRegisteredCount } from "./lib/blobStore.js";

const TARGET_FORM_NAME = "daftar-batch-training";

function extractField(body, field) {
  return body?.payload?.data?.[field] ?? body?.payload?.[field] ?? body?.data?.[field] ?? body?.[field] ?? null;
}

function extractFormName(body) {
  return body?.payload?.form_name ?? body?.form_name ?? extractField(body, "form-name");
}

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Body harus JSON valid" }), { status: 400 });
  }

  const formName = extractFormName(body);
  if (formName !== TARGET_FORM_NAME) {
    // Webhook di-scope ke form lain atau bentuk payload tidak dikenali — abaikan, jangan increment apa pun.
    return new Response(JSON.stringify({ skipped: true, reason: "form_name tidak cocok", formName }), { status: 200 });
  }

  const batchId = extractField(body, "batch");
  if (!batchId) {
    return new Response(JSON.stringify({ error: "Field 'batch' tidak ditemukan di payload" }), { status: 400 });
  }

  const batches = await getAllBatches();
  if (!batches.some((b) => b.id === batchId)) {
    return new Response(JSON.stringify({ error: `Batch tidak ditemukan: ${batchId}` }), { status: 404 });
  }

  const updated = await incrementRegisteredCount(batchId, 1);
  return new Response(JSON.stringify({ ok: true, batchId, registeredCount: updated.registeredCount }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const config = { path: "/api/form-webhook" };

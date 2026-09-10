// Verifikasi user Netlify Identity di dalam Function.
//
// Pola: frontend kirim header `Authorization: Bearer <identity JWT>` (dari
// netlifyIdentity.currentUser().jwt()). Function ini adalah Functions v2 (`export default`),
// dan di v2 TIDAK ADA context.clientContext — itu field khusus Functions v1/classic
// (exports.handler). Pola v2 yang benar adalah getUser() dari package @netlify/identity, yang
// membaca request context yang sama secara ambient (dikonfirmasi lewat
// docs.netlify.com/build/functions/functions-and-identity/ dan
// docs.netlify.com/manage/security/secure-access-to-sites/identity/use-identity-in-functions/,
// Agustus 2026).
//
// Siapa saja yang berhasil login Identity dianggap admin (tidak ada role granular) — KARENA ITU
// registrasi Identity WAJIB di-set "Invite only" di dashboard (Project configuration → Identity →
// Registration), supaya bukan sembarang orang bisa daftar sendiri lalu dapat akses admin.
import { getUser } from "@netlify/identity";

export class AuthError extends Error {}

export async function requireAdmin() {
  const user = await getUser();
  if (!user) {
    throw new AuthError("Unauthorized — login Identity diperlukan");
  }
  return user;
}

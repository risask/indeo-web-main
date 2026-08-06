// Verifikasi user Netlify Identity di dalam Function.
//
// Pola: frontend kirim header `Authorization: Bearer <identity JWT>` (dari
// netlifyIdentity.currentUser().jwt()). Netlify memvalidasi signature JWT di edge SEBELUM
// meneruskan request ke Function, dan mengisi context.clientContext.user kalau valid — jadi
// Function ini tidak perlu verifikasi signature manual.
//
// ⚠️ Ini pola klasik Netlify Identity + Functions (context.clientContext.user). Per pengecekan
// dokumentasi terakhir (Agustus 2026), Netlify juga mendorong paket @netlify/identity baru dengan
// getUser()+cookie session untuk Functions v2 — kemungkinan ini arah baru yang menggantikan pola
// classic. WAJIB diverifikasi dengan deploy nyata: kalau context.clientContext.user selalu kosong
// meski sudah login & kirim Bearer token, kemungkinan besar situs ini perlu migrasi ke pola
// @netlify/identity yang baru — cek docs.netlify.com/build/functions/functions-and-identity/ lagi.
//
// Siapa saja yang berhasil login Identity dianggap admin (tidak ada role granular) — KARENA ITU
// registrasi Identity WAJIB di-set "Invite only" di dashboard (Project configuration → Identity →
// Registration), supaya bukan sembarang orang bisa daftar sendiri lalu dapat akses admin.
export class AuthError extends Error {}

export function requireAdmin(context) {
  const user = context?.clientContext?.user;
  if (!user) {
    throw new AuthError("Unauthorized — login Identity diperlukan");
  }
  return user;
}

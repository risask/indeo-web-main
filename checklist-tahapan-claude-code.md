# Checklist Implementasi — Manajemen Batch Training
**Untuk: Claude Code** · Kerjakan berurutan, jangan lompat tahap tanpa verifikasi tahap sebelumnya selesai.

Dokumen ini adalah panduan urutan kerja untuk 2 spek yang sudah ada:
- `spek-teknis-batch-training-claude-code.md` (panel admin + card publik)
- `spek-teknis-form-pendaftaran-claude-code.md` (form pendaftaran)

---

## Tahap 0 — Discovery (WAJIB sebelum tulis kode apa pun)

- [ ] Cek framework/generator di atas Netlify (static site generator? Next.js? HTML statis?)
- [ ] Cek apakah form "Kirim Permintaan" di `/bpr-bprs` sudah pakai Netlify Forms — kalau ya, catat pola honeypot & struktur field-nya untuk ditiru
- [ ] Cek apakah repo sudah pernah pakai Netlify Identity atau Blobs untuk fitur lain
- [ ] **Laporkan temuan sebelum lanjut ke Tahap 1** — kalau ada asumsi di kedua spek yang ternyata salah (mis. situs ternyata tidak mendukung Netlify Functions sama sekali), stop dan diskusikan ulang pendekatan sebelum lanjut

---

## Tahap 1 — Skema Data & Netlify Blobs

- [ ] Buat struktur data batch sesuai skema (Bagian 2 spek admin), termasuk field `maxCapacity` & `registeredCount` (bukan `quotaPct` manual — lihat Bagian 6 spek form)
- [ ] Setup Netlify Blobs store
- [ ] Seed data awal: 12 program (data statis: title, regCode, trackTag, desc, deadlineType) + minimal 1 batch contoh per program (boleh pakai data dummy dari `panel-admin-batch-training.jsx` sebagai starting point)
- [ ] **Verifikasi:** tulis Netlify Function sederhana yang bisa read & write ke Blobs, test manual (curl/Postman) — pastikan data tersimpan & terbaca dengan benar sebelum lanjut

---

## Tahap 2 — Form Pendaftaran

- [ ] **Putuskan dulu:** form per-peserta atau per-institusi (Bagian 8 poin 1 spek form) — kalau belum ada jawaban dari InDeo, default ke per-peserta sesuai rekomendasi di spek, tapi catat sebagai asumsi di commit message/PR description
- [ ] Bangun halaman `/daftar-batch` yang baca query param `program` & `batch`, tampilkan ringkasan batch (read-only)
- [ ] Bangun form sesuai field di Bagian 3 spek form
- [ ] Setup `data-netlify="true"`, honeypot (tiru pola existing), notification ke `info@indeoinstitute.id`
- [ ] Bangun halaman/pesan konfirmasi (Bagian 7 spek form)
- [ ] **Verifikasi:** submit form test, cek submission muncul di dashboard Netlify Forms, cek email notifikasi masuk

---

## Tahap 3 — Function Penghubung (Kuota Otomatis)

> Boleh di-skip untuk MVP — kalau di-skip, tandai `quotaPct` sebagai manual dan lanjut ke Tahap 4 dengan field input manual di panel admin. Kembali ke tahap ini sebagai iterasi berikutnya.

- [ ] Cek dokumentasi Netlify terkini soal mekanisme trigger function dari form submission (API ini berpotensi sudah berubah dari yang tertulis di spek)
- [ ] Bangun Netlify Function yang increment `registeredCount` di Blobs saat ada submission baru untuk batch terkait
- [ ] Hitung `quotaPct` sebagai computed value: `registeredCount / maxCapacity * 100`
- [ ] **Verifikasi:** submit form test dari Tahap 2 lagi, cek `registeredCount` di Blobs bertambah, cek `quotaPct` ikut berubah

---

## Tahap 4 — Panel Admin

- [ ] Setup Netlify Identity, gate route admin di baliknya
- [ ] Bangun UI list + edit batch (tanggal, format, venue, `maxCapacity`) sesuai `panel-admin-batch-training.jsx` sebagai referensi tampilan
- [ ] Kalau Tahap 3 dikerjakan: tampilkan kuota sebagai read-only (`registeredCount`/`maxCapacity`), bukan field edit
- [ ] Kalau Tahap 3 di-skip: sediakan field edit manual untuk `quotaPct`
- [ ] **Verifikasi:** login dengan akun tidak sah harus ditolak; edit data lewat panel, cek tersimpan di Blobs dengan benar

---

## Tahap 5 — Card Publik

- [ ] Bangun grid card baca data dari Blobs (lewat Function)
- [ ] Implementasi 3 tipe logika tenggat (Bagian 3 spek admin: `batch` / `regulatory` / `overdue`)
- [ ] Wire tombol utama → `/daftar-batch?program=...&batch=...`, link sekunder → WhatsApp pre-filled
- [ ] Implementasi status `closed` (tombol nonaktif, label waiting list) & `draft` (card disembunyikan)
- [ ] **Verifikasi:** ubah data lewat panel admin (Tahap 4), cek card publik berubah sesuai tanpa perlu redeploy

---

## Tahap 6 — Uji End-to-End & Review Keamanan

- [ ] Jalur lengkap: buka card publik → klik daftar → isi form → submit → cek panel admin & card ter-update (kalau Tahap 3 jalan, kuota naik otomatis)
- [ ] Cek route admin benar-benar tidak bisa diakses tanpa login
- [ ] Cek Blobs tidak bisa ditulis langsung dari publik tanpa lewat Function/auth yang semestinya
- [ ] Review ulang pertanyaan terbuka yang masih ada di kedua spek — pastikan semua sudah ada keputusan (baik dikerjakan atau sengaja ditunda dengan alasan jelas)

---

## Catatan Umum

- Tiap tahap = idealnya 1 commit/PR terpisah, supaya gampang di-review atau di-rollback kalau ada masalah
- Kalau di tengah jalan ternyata asumsi di spek (Tahap 0 dan seterusnya) tidak sesuai kenyataan repo, **stop dan laporkan** daripada memaksakan pendekatan yang sudah tidak relevan

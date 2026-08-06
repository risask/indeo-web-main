# Spek Teknis — Manajemen Batch Training BPR/BPRS
**Untuk: Claude Code** · Target: indeoinstitute.id
**Referensi implementasi:** `panel-admin-batch-training.jsx` (prototipe fungsional, React + `window.storage` — HANYA untuk demo UX, tidak bisa dipakai langsung karena `window.storage` eksklusif untuk lingkungan artifact Claude.ai, tidak tersedia di browser produksi)

---

## 0. Konfirmasi Stack: Netlify

Situs indeoinstitute.id di-hosting di **Netlify**. Ini artinya rekomendasi Bagian 4, 5, dan 6 di bawah bisa langsung pakai primitives native Netlify — tidak perlu provisioning backend terpisah untuk skala kebutuhan ini (12 program × beberapa batch).

**Masih perlu dicek Claude Code sebelum mulai** (belum terjawab dari sisi saya):
1. Framework/generator yang dipakai di atas Netlify — static site generator (Hugo/Eleventy/Astro), Next.js, atau HTML statis biasa? (Menentukan cara panel admin di-mount sebagai route.)
2. Apakah form "Kirim Permintaan" di halaman `/bpr-bprs` saat ini sudah pakai **Netlify Forms** atau layanan lain — kalau sudah, ikuti pola yang sama untuk konsistensi.
3. Apakah repo situs ini sudah pakai Netlify Identity/Blobs untuk fitur lain, atau ini yang pertama.

---

## 1. Tujuan Fitur

Mengganti proses update manual (edit teks di banyak file/halaman tiap ada perubahan jadwal batch training) dengan **satu sumber data terpusat** yang:
- Diedit lewat panel admin sederhana (tanggal, format, venue, kuota)
- Otomatis tercermin di seluruh tempat kartu program ditampilkan (halaman program, mungkin nanti homepage)
- Menghitung "X hari lagi" secara live dari tanggal sistem — bukan angka statis yang gampang basi

---

## 2. Skema Data

Satu record per **batch** (bukan per program — satu program bisa punya banyak batch berjalan/akan datang).

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `id` | string (slug) | ya | unik per batch, mis. `kualitas-aset-2026-08` |
| `programId` | string | ya | referensi ke 12 program (lihat Bagian 3) |
| `dateStart` | date (ISO `YYYY-MM-DD`) | ya | tanggal mulai batch |
| `dateEnd` | date (ISO `YYYY-MM-DD`) | ya | tanggal selesai batch |
| `format` | enum `online` \| `onsite` | ya | menentukan tampilan lokasi di card |
| `venue` | string | kondisional | wajib diisi jika `format = onsite`; kosong/diabaikan jika `online` |
| `quotaPct` | ~~integer 0–100~~ **computed, lihat catatan** | ya | ⚠️ **Lihat `spek-teknis-form-pendaftaran-claude-code.md` Bagian 6** — direkomendasikan jadi field turunan dari `registeredCount / maxCapacity`, bukan diedit manual. Kalau versi pertama tetap manual (MVP), field ini tetap integer biasa seperti semula. |
| `maxCapacity` | integer | ya (kalau pakai opsi otomatis) | kapasitas maksimum kursi batch — field baru, lihat spek form pendaftaran |
| `formUrl` | string (URL) | ya | tujuan tombol utama "Daftar Batch Ini" |
| `status` | enum `open` \| `closed` \| `draft` | ya | `draft` = belum tampil di publik; `closed` = tombol nonaktif tapi card tetap tampil (lihat mockup awal — pola dipertahankan dari referensi Asian Tiger School) |

### Data statis per program (TIDAK diedit lewat admin batch — ini konten, bukan jadwal)

12 program dengan field: `id`, `title`, `regCode` (kode POJK/SEOJK), `trackTag`, `desc`, `deadlineType` (`batch` \| `regulatory` \| `overdue`), `regDeadline` (hanya untuk `deadlineType = regulatory`, contoh: TI = `2026-12-16`).

**Daftar 12 programId & deadlineType** (sudah final dari hasil kerja sebelumnya, lihat `panel-admin-batch-training.jsx` untuk detail lengkap tiap field):
`tata-kelola`, `kualitas-aset`, `manajemen-risiko`, `permodalan`, `bmpk-bmpd`, `apolo`, `kepatuhan-audit`, `fit-proper` (`batch`) · `ti` (`regulatory`, tenggat `2026-12-16`) · `perlindungan-konsumen`, `transformasi-digital` (`batch`) · `umkm` (`overdue`)

Kalau konten program (judul, deskripsi, kode regulasi) berubah, itu update terpisah dari data batch — jangan digabung satu form dengan data jadwal supaya admin non-teknis tidak salah edit konten regulasi.

---

## 3. Logika Tampilan "Tenggat" (deadlineType)

```
if deadlineType == "overdue":
    tampilkan badge merah: "⚠️ Tenggat kebijakan sudah lewat — program bersifat catch-up"
    (tidak ada angka hari)

elif deadlineType == "regulatory":
    hariTersisa = (regDeadline - hariIni) dalam hari, dibulatkan ke atas
    tampilkan: "Tenggat masa transisi: ~{hariTersisa} hari lagi"

else (deadlineType == "batch"):
    hariTersisa = (dateStart - hariIni) dalam hari, dibulatkan ke atas
    if hariTersisa >= 0:
        tampilkan: "Batch dimulai dalam {hariTersisa} hari"
    else:
        tampilkan: "sudah berjalan"  # atau sembunyikan card jika status masih "open" tapi tanggal lewat — perlu keputusan produk, lihat Bagian 8
```

**Referensi kode JS yang sudah teruji** (dari prototipe, boleh dipakai langsung):
```js
function daysUntil(dateStr) {
  const target = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / 86400000);
}
```

---

## 4. Penyimpanan Data — Rekomendasi: Netlify Blobs

**Prototipe pakai `window.storage`** (eksklusif Claude.ai artifacts) — **tidak bisa dipakai di produksi**, tapi pola API-nya (get/set key-value JSON) mirip banget dengan **Netlify Blobs**, jadi migrasinya tidak jauh secara konsep.

**Rekomendasi: Netlify Blobs** sebagai penyimpanan utama, karena:
- Native di platform, auto-provisioned — tidak perlu setup database eksternal terpisah untuk kebutuhan sekecil ini (skema simpel, ~12 program × beberapa batch)
- Cocok untuk key-value JSON persis seperti struktur skema di Bagian 2 (satu blob berisi array semua batch, atau satu blob per batch — Claude Code putuskan sesuai kebutuhan query)
- Diakses lewat Netlify Functions (serverless) yang dipanggil dari panel admin (write) dan halaman publik (read)

**Alternatif kalau kebutuhan berkembang** (mis. butuh query/filter kompleks, relasi antar-tabel, atau volume data besar): **Netlify DB** (managed Postgres, auto-provisioned) — tapi untuk skala saat ini, Blobs kemungkinan besar cukup dan lebih sederhana untuk di-maintain.

Kalau ternyata situs masih pakai generator static murni tanpa Netlify Functions sama sekali (cek Bagian 0), opsi fallback paling ringan: file JSON di repo yang di-commit tiap update — tapi ini berarti update jadwal butuh deploy ulang, bukan real-time seperti prototipe. Netlify Functions + Blobs lebih disarankan supaya panel admin benar-benar real-time tanpa perlu redeploy.

---

## 5. Panel Admin — Requirement

- List seluruh batch (bisa lebih dari 12 kalau ada multi-batch per program), grouped/filterable by `programId`
- Form tambah batch baru + edit batch existing
- Field yang diedit: `dateStart`, `dateEnd`, `format`, `venue` (auto-disable kalau format=online), `quotaPct`, `formUrl`, `status`
- Validasi minimum: `dateEnd >= dateStart`; `venue` wajib diisi kalau `format = onsite`
- Tombol simpan per-batch ATAU simpan massal (prototipe pakai simpan massal — keduanya valid, sesuaikan dengan UX yang InDeo mau)

---

## 6. Autentikasi Admin — Rekomendasi: Netlify Identity

**Prototipe TIDAK punya autentikasi sama sekali** — siapa saja yang buka panel bisa edit. Wajib diperbaiki sebelum produksi.

**Rekomendasi: Netlify Identity** — sempat mau di-deprecate Netlify, tapi **dibatalkan Februari 2026** dan tetap didukung untuk kebutuhan registrasi/login sederhana (bukan SSO/social login kompleks — untuk itu baru perlu Auth0/Clerk, tapi InDeo cuma butuh 1-beberapa akun staf, jadi Identity native sudah cukup). Ini pilihan paling ringan karena:
- Native di Netlify, tidak perlu provisioning layanan auth terpisah
- Tinggal gate route panel admin di belakang Identity widget, cek session sebelum render form edit

Kalau ternyata di masa depan Netlify mengubah kembali kebijakan soal Identity (statusnya sempat berubah-ubah), cek dokumentasi Netlify terbaru sebelum implementasi — jangan asumsikan info di dokumen ini otomatis masih berlaku kalau dibaca jauh setelah ditulis.

---

## 7. Public Card — Requirement Tampilan

- Grid responsif: 3 kolom desktop → 2 kolom tablet → 1 kolom mobile
- Per card: badge track (`TRACK B · TEKNIS` dst.), kode regulasi, judul, tanggal (format `18–19 Agu 2026`, otomatis dari `dateStart`/`dateEnd`), pill lokasi (isi otomatis nama venue kalau onsite, atau "WEBINAR ONLINE" kalau online), badge tenggat (Bagian 3), progress bar kuota, tombol utama "Daftar Batch Ini" (→ `formUrl`), link sekunder "Chat via WhatsApp" (→ `wa.me/6282211758899` dengan pesan pre-filled berisi nama program + tanggal batch)
- Kalau `status = closed`: tombol utama nonaktif, ganti label jadi "Batch Ini Penuh — Gabung Waiting List" (pola dipertahankan dari referensi awal)
- Kalau `status = draft`: card tidak ditampilkan sama sekali di publik

---

## 8. Pertanyaan Terbuka (perlu keputusan sebelum/​selama build)

1. ✅ **Terjawab** — lihat `spek-teknis-form-pendaftaran-claude-code.md` Bagian 6: `quotaPct` direkomendasikan jadi computed field dari `registeredCount / maxCapacity`, terhubung otomatis ke submission form pendaftaran. Keputusan MVP-vs-otomatis tetap di tangan InDeo/Claude Code.
2. Kalau `dateStart` sudah lewat tapi `status` masih `open` (lupa diupdate admin) — card disembunyikan otomatis, atau tetap tampil dengan label lain?
3. Satu program bisa punya beberapa batch aktif bersamaan (mis. 2 jadwal berbeda bulan yang sama) — apakah card publik menampilkan SEMUA batch terbuka, atau cuma batch terdekat per program?
4. ✅ **Terjawab** — lihat `spek-teknis-form-pendaftaran-claude-code.md`: form pendaftaran batch (`formUrl` → `/daftar-batch?program=...&batch=...`) sudah dispek lengkap di dokumen terpisah, pakai Netlify Forms.

---

## 9. Ringkasan Rekomendasi Stack (Netlify-native)

| Kebutuhan | Rekomendasi |
|---|---|
| Penyimpanan data batch | **Netlify Blobs** (key-value JSON) |
| Compute untuk read/write data | **Netlify Functions** |
| Autentikasi panel admin | **Netlify Identity** |
| Form pendaftaran batch | **Netlify Forms** |

Semua native ke platform yang sudah dipakai InDeo — tidak perlu tambah vendor/layanan pihak ketiga untuk fitur ini.

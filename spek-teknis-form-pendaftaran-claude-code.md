# Spek Teknis — Form Pendaftaran Batch Training
**Untuk: Claude Code** · Bagian dari paket fitur bersama `spek-teknis-batch-training-claude-code.md`
**Dikerjakan bersamaan dalam satu sesi:** Panel Admin + Form Pendaftaran (dokumen ini) + Card Publik

---

## 0. Hubungan dengan Spek Sebelumnya

Dokumen ini melengkapi `spek-teknis-batch-training-claude-code.md` — secara spesifik menjawab item yang sebelumnya masih placeholder/terbuka di sana:
- **Bagian 8, poin 4** (dulu): `formUrl` placeholder → sekarang dokumen ini yang mendefinisikan form-nya
- **Bagian 8, poin 1** (dulu): "`quotaPct` manual vs otomatis" → **dokumen ini mengusulkan solusi**: kuota dihitung otomatis dari jumlah submission form (lihat Bagian 6)

Kalau Claude Code mengerjakan kedua dokumen ini bersamaan, urutan implementasi yang disarankan: **skema data dulu (termasuk field baru di Bagian 6) → form → koneksi form ke Blobs → panel admin baca hasilnya**.

---

## 1. Tujuan

Form yang diisi calon peserta saat klik "Daftar Batch Ini" dari card publik — menangkap data pendaftaran untuk **satu batch spesifik** (bukan form konsultasi umum seperti "Kirim Permintaan" yang sudah ada di `/bpr-bprs`, yang tujuannya beda: itu untuk needs assessment awal, ini untuk konfirmasi ikut kelas).

---

## 2. Alur Pengguna

```
Card publik → klik "Daftar Batch Ini"
  → buka /daftar-batch?program={programId}&batch={batchId}
  → form menampilkan RINGKASAN batch yang dipilih (read-only: nama program, tanggal, format, venue/link)
    supaya peserta konfirmasi ini benar sebelum isi data
  → isi form → submit
  → halaman konfirmasi ("Pendaftaran diterima, tim kami akan follow up via WhatsApp/email dalam 1x24 jam")
  → (di background) notifikasi masuk ke email InDeo + counter kuota batch tsb bertambah 1
```

Query param `program` & `batch` **wajib** diteruskan dari card — supaya peserta tidak perlu pilih ulang program secara manual di form (mengurangi salah pilih/human error).

---

## 3. Field Form

| Field | Tipe | Wajib | Catatan |
|---|---|---|---|
| `program` + `batch` | hidden, dari query param | ya | ditampilkan sebagai teks read-only di atas form, bukan input yang bisa diedit peserta |
| Nama Lengkap | text | ya | |
| Jabatan | text | ya | relevan untuk tahu peserta ini masuk Track A atau B secara konteks (meski card publik saat ini fokus Track B) |
| Institusi | text | ya | |
| Jenis Lembaga | select: BPD / Bank Umum Konvensional / Bank Umum Syariah / Multifinance / BPR/BPRS | ya | **pakai daftar pilihan yang sama persis dengan form "Kirim Permintaan" di `/bpr-bprs`** — konsistensi taksonomi data antar-form |
| Email | email | ya | untuk konfirmasi & follow-up |
| No. HP/WhatsApp | tel | ya | follow-up utama InDeo selama ini lewat WA (lihat pola CTA sekunder di card) |
| Catatan tambahan | textarea | tidak | kebutuhan khusus, pertanyaan, dst. |

**Keputusan desain:** 1 form submission = **1 peserta**, bukan 1 institusi dengan banyak peserta sekaligus. Alasan: kuota batch dihitung per kursi individual (lihat outline silabus — "maks. 20–30 peserta/batch" itu jumlah orang, bukan jumlah institusi). Kalau satu institusi mau kirim beberapa staf, mereka isi form beberapa kali. **Ini asumsi saya — flag ke InDeo kalau ternyata maunya pendaftaran per-institusi** (lihat Bagian 8).

---

## 4. Validasi

- Semua field wajib tidak boleh kosong
- Email: format valid
- No. HP: minimal format angka masuk akal (tidak perlu validasi nomor Indonesia yang strict, cukup cegah input jelas salah)
- `program` & `batch` dari query param wajib ada — kalau form diakses tanpa query param (mis. orang buka URL langsung tanpa lewat card), tampilkan pesan "Pilih program dari halaman Program BPR/BPRS" dengan link balik, jangan biarkan submit form tanpa konteks batch yang jelas

---

## 5. Setup Netlify Forms

- Form pakai atribut `data-netlify="true"` standar Netlify Forms — otomatis ke-detect saat build, tidak perlu backend custom untuk terima submission
- **Honeypot field** — situs InDeo sudah punya pola ini di form "Kirim Permintaan" (`"Jangan isi ini jika Anda manusia:"`) — **pakai field honeypot dengan nama & styling yang sama** supaya konsisten dan terbukti sudah efektif dipakai
- **Notifikasi submission** — set ke email `info@indeoinstitute.id` (email yang sudah dipakai di seluruh halaman kontak situs), lewat Netlify Forms notification settings (Site settings → Forms → Form notifications)
- Nama form disarankan unik & deskriptif, mis. `daftar-batch-training`, supaya gampang dibedakan dari form "Kirim Permintaan" di dashboard Netlify

---

## 6. Otomatisasi Kuota (Rekomendasi — Menjawab Open Question dari Spek Sebelumnya)

**Masalah yang mau diselesaikan:** di spek sebelumnya, `quotaPct` diinput manual oleh admin — gampang telat update, tidak jujur secara real-time.

**Solusi yang diusulkan:**

1. Tambah field baru di skema data batch (lihat `spek-teknis-batch-training-claude-code.md` Bagian 2): **`maxCapacity`** (integer) — kapasitas maksimum kursi batch tsb, diisi admin sekali di awal (bukan field yang sering berubah)
2. Tambah counter **`registeredCount`** (integer, default 0) di record batch yang sama di Netlify Blobs
3. Setiap ada submission baru ke form ini, trigger **Netlify Function** (via [Netlify Forms submission webhook](notes: cek dokumentasi Netlify terkini untuk mekanisme trigger function dari form submission — apakah via built-in event trigger atau perlu setup webhook manual, karena ini detail yang bisa berubah) yang increment `registeredCount` untuk `batch` bersangkutan di Blobs
4. `quotaPct` yang ditampilkan di card publik **dihitung**, bukan disimpan: `quotaPct = Math.round((registeredCount / maxCapacity) * 100)`
5. Panel admin **tidak lagi punya input manual untuk kuota** — cukup tampilkan `registeredCount / maxCapacity` sebagai info read-only, plus admin cuma edit `maxCapacity` kalau kapasitas kelasnya berubah

**Dampak ke dokumen sebelumnya:** field `quotaPct` di skema Bagian 2 (`spek-teknis-batch-training-claude-code.md`) berubah dari "integer, diedit manual" jadi **field turunan (computed), bukan disimpan langsung** — ganti dengan `maxCapacity` + `registeredCount` sebagai sumber data asli.

**Kalau ini terlalu kompleks untuk versi pertama:** boleh tetap manual dulu (seperti spek awal) sebagai MVP, lalu otomatisasi ini jadi iterasi berikutnya — keputusan ada di InDeo/Claude Code, bukan sesuatu yang harus selesai sekali jalan.

---

## 7. Halaman/Pesan Konfirmasi

Setelah submit berhasil, tampilkan (bukan diam-diam redirect tanpa keterangan):
- Konfirmasi jelas: "Pendaftaran Anda untuk **[nama program] — batch [tanggal]** sudah kami terima"
- Ekspektasi langkah berikutnya: kapan & lewat kanal apa tim InDeo akan follow up (mis. "Tim kami akan menghubungi via WhatsApp/email dalam 1×24 jam untuk konfirmasi & instruksi pembayaran")
- Link kembali ke halaman program (`/bpr-bprs`) untuk yang mau lihat program lain

---

## 8. Pertanyaan Terbuka

1. **Form per-peserta vs per-institusi** — asumsi saya di Bagian 3 adalah per-peserta. Kalau InDeo maunya satu institusi daftarkan beberapa staf sekaligus dalam satu submission (field dinamis "tambah peserta"), field & logika kuota di Bagian 6 perlu disesuaikan (`registeredCount` bertambah sesuai jumlah peserta dalam 1 submission, bukan otomatis +1)
2. **Mekanisme trigger Netlify Function dari form submission** — perlu Claude Code cek dokumentasi Netlify terbaru saat implementasi, karena API/pola trigger-nya berpotensi berubah dari waktu ke waktu
3. **Pembayaran** — form ini cuma menangkap pendaftaran, belum menyentuh pembayaran. Apakah pembayaran ditangani manual oleh tim InDeo pasca-follow up (sesuai draft pesan konfirmasi di Bagian 7), atau nanti perlu diintegrasikan ke payment gateway? Kalau iya, itu scope terpisah lagi di luar dokumen ini.
4. **Apakah field "Jenis Lembaga" perlu memvalidasi/membatasi pendaftaran** — misalnya kalau ada Modul BPRS di program tertentu (Tata Kelola, Kualitas Aset), apakah sistem perlu tahu peserta ini dari BPR atau BPRS untuk keperluan lain (mis. laporan internal InDeo), atau field ini cuma informatif tanpa logika lanjutan?

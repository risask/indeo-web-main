// Seed data awal 12 program — dipakai sekali untuk isi Blobs store pertama kali (lihat
// blobStore.js getAllPrograms()). Setelah itu sumber kebenaran ada di Blobs, dikelola lewat
// panel admin — bukan array ini lagi.
// Sumber: bpr-bprs.html (reg-badge/judul existing) + panel-admin-batch-training.jsx (prototipe).
export const SEED_PROGRAMS = [
  { id: "tata-kelola", title: "Tata Kelola 12 Pilar", regCode: "POJK 9/2024 · 25/2024", trackTag: "TRACK B · TEKNIS", desc: "4 sesi + workshop self-assessment 12 pilar, termasuk Modul BPRS.", deadlineType: "batch" },
  { id: "kualitas-aset", title: "Kualitas Aset & CKPN", regCode: "POJK 1/2024 · 24/2024", trackTag: "TRACK B · TEKNIS", desc: "3 sesi workshop template penilaian aset & simulasi CKPN, plus Modul BPRS.", deadlineType: "batch" },
  { id: "manajemen-risiko", title: "Manajemen Risiko & Anti-Fraud", regCode: "POJK 13/2015 · SEOJK 1/2019", trackTag: "TRACK B · TEKNIS", desc: "3 sesi workshop profil risiko & register anti-fraud institusi.", deadlineType: "batch" },
  { id: "permodalan", title: "Permodalan & Konsolidasi", regCode: "POJK 7/2026 · 7/2024", trackTag: "TRACK B · TEKNIS", desc: "3 sesi workshop proyeksi modal inti & simulasi skenario merger.", deadlineType: "batch" },
  { id: "bmpk-bmpd", title: "BMPK/BMPD", regCode: "POJK 23/2022 · SEOJK 11/2023", trackTag: "TRACK B · TEKNIS", desc: "3 sesi workshop kertas kerja monitoring BMPK/BMPD.", deadlineType: "batch" },
  { id: "apolo", title: "Pelaporan Terintegrasi APOLO", regCode: "POJK 23/2024 · SEOJK 21/2024", trackTag: "TRACK B · TEKNIS", desc: "3 sesi workshop template rekonsiliasi laporan berkala & insidental.", deadlineType: "batch" },
  { id: "kepatuhan-audit", title: "Fungsi Kepatuhan & Audit Intern", regCode: "SEOJK 8/2025 · 9/2025", trackTag: "TRACK B · TEKNIS", desc: "3 sesi workshop working paper program kerja tahunan.", deadlineType: "batch" },
  { id: "fit-proper", title: "Kesiapan Fit & Proper Test", regCode: "POJK 27/2016", trackTag: "TRACK B · SUBSTANTIF", desc: "3 sesi simulasi wawancara & workshop checklist dokumen pribadi.", deadlineType: "batch" },
  { id: "ti", title: "Tata Kelola & Keamanan TI", regCode: "POJK 34/2025 · PADK 43/2025", trackTag: "TRACK B · TEKNIS", desc: "3 sesi workshop DRP & kebijakan tata kelola TI.", deadlineType: "regulatory", regDeadline: "2026-12-16" },
  { id: "perlindungan-konsumen", title: "Perlindungan Konsumen", regCode: "POJK 22/2023", trackTag: "TRACK B · TEKNIS", desc: "3 sesi workshop template SOP pengaduan & mitigasi risiko konsumen.", deadlineType: "batch" },
  { id: "transformasi-digital", title: "Transformasi Digital & LKD", regCode: "POJK 1/2022", trackTag: "TRACK B · TEKNIS", desc: "3 sesi workshop kertas kerja kesiapan operasional LKD.", deadlineType: "batch" },
  { id: "umkm", title: "Pembiayaan UMKM", regCode: "POJK 19/2025", trackTag: "TRACK B · TEKNIS", desc: "3 sesi workshop kebijakan pembiayaan UMKM & kertas kerja RBB 2026.", deadlineType: "overdue" },
];

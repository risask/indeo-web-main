import React, { useState, useEffect } from "react";
import { Settings, Eye, MapPin, Video, Calendar, Users, Save, Loader2, ExternalLink, MessageCircle } from "lucide-react";

const STORAGE_KEY = "indeo-batch-data-v1";

const DEFAULT_PROGRAMS = [
  { id: "tata-kelola", title: "Tata Kelola 12 Pilar", regCode: "POJK 9/2024 · 25/2024", trackTag: "TRACK B · TEKNIS", desc: "4 sesi + workshop self-assessment 12 pilar, termasuk Modul BPRS.", deadlineType: "batch", dateStart: "2026-08-25", dateEnd: "2026-08-28", format: "online", venue: "", quotaPct: 55 },
  { id: "kualitas-aset", title: "Kualitas Aset & CKPN", regCode: "POJK 1/2024 · 24/2024", trackTag: "TRACK B · TEKNIS", desc: "3 sesi workshop template penilaian aset & simulasi CKPN, plus Modul BPRS.", deadlineType: "batch", dateStart: "2026-08-18", dateEnd: "2026-08-19", format: "online", venue: "", quotaPct: 68 },
  { id: "manajemen-risiko", title: "Manajemen Risiko & Anti-Fraud", regCode: "POJK 13/2015 · SEOJK 1/2019", trackTag: "TRACK B · TEKNIS", desc: "3 sesi workshop profil risiko & register anti-fraud institusi.", deadlineType: "batch", dateStart: "2026-09-01", dateEnd: "2026-09-03", format: "online", venue: "", quotaPct: 30 },
  { id: "permodalan", title: "Permodalan & Konsolidasi", regCode: "POJK 7/2026 · 7/2024", trackTag: "TRACK B · TEKNIS", desc: "3 sesi workshop proyeksi modal inti & simulasi skenario merger.", deadlineType: "batch", dateStart: "2026-09-08", dateEnd: "2026-09-10", format: "onsite", venue: "Kantor InDeo Institute, Jakarta", quotaPct: 80 },
  { id: "bmpk-bmpd", title: "BMPK/BMPD", regCode: "POJK 23/2022 · SEOJK 11/2023", trackTag: "TRACK B · TEKNIS", desc: "3 sesi workshop kertas kerja monitoring BMPK/BMPD.", deadlineType: "batch", dateStart: "2026-09-22", dateEnd: "2026-09-24", format: "online", venue: "", quotaPct: 40 },
  { id: "apolo", title: "Pelaporan Terintegrasi APOLO", regCode: "POJK 23/2024 · SEOJK 21/2024", trackTag: "TRACK B · TEKNIS", desc: "3 sesi workshop template rekonsiliasi laporan berkala & insidental.", deadlineType: "batch", dateStart: "2026-09-29", dateEnd: "2026-10-01", format: "online", venue: "", quotaPct: 52 },
  { id: "kepatuhan-audit", title: "Fungsi Kepatuhan & Audit Intern", regCode: "SEOJK 8/2025 · 9/2025", trackTag: "TRACK B · TEKNIS", desc: "3 sesi workshop working paper program kerja tahunan.", deadlineType: "batch", dateStart: "2026-10-06", dateEnd: "2026-10-08", format: "online", venue: "", quotaPct: 35 },
  { id: "fit-proper", title: "Kesiapan Fit & Proper Test", regCode: "POJK 27/2016", trackTag: "TRACK B · SUBSTANTIF", desc: "3 sesi simulasi wawancara & workshop checklist dokumen pribadi.", deadlineType: "batch", dateStart: "2026-10-13", dateEnd: "2026-10-15", format: "online", venue: "", quotaPct: 60 },
  { id: "ti", title: "Tata Kelola & Keamanan TI", regCode: "POJK 34/2025 · PADK 43/2025", trackTag: "TRACK B · TEKNIS", desc: "3 sesi workshop DRP & kebijakan tata kelola TI.", deadlineType: "regulatory", regDeadline: "2026-12-16", dateStart: "2026-09-02", dateEnd: "2026-09-04", format: "online", venue: "", quotaPct: 45 },
  { id: "perlindungan-konsumen", title: "Perlindungan Konsumen", regCode: "POJK 22/2023", trackTag: "TRACK B · TEKNIS", desc: "3 sesi workshop template SOP pengaduan & mitigasi risiko konsumen.", deadlineType: "batch", dateStart: "2026-10-20", dateEnd: "2026-10-22", format: "online", venue: "", quotaPct: 25 },
  { id: "transformasi-digital", title: "Transformasi Digital & LKD", regCode: "POJK 1/2022", trackTag: "TRACK B · TEKNIS", desc: "3 sesi workshop kertas kerja kesiapan operasional LKD.", deadlineType: "batch", dateStart: "2026-10-27", dateEnd: "2026-10-29", format: "online", venue: "", quotaPct: 38 },
  { id: "umkm", title: "Pembiayaan UMKM", regCode: "POJK 19/2025", trackTag: "TRACK B · TEKNIS", desc: "3 sesi workshop kebijakan pembiayaan UMKM & kertas kerja RBB 2026.", deadlineType: "overdue", dateStart: "2026-11-03", dateEnd: "2026-11-05", format: "online", venue: "", quotaPct: 90 },
];

const WA_NUMBER = "6282211758899";
const FORM_URL_BASE = "https://indeoinstitute.id/daftar-batch"; // placeholder — ganti dgn URL form nyata

function fmtDateRange(start, end) {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  if (sameMonth) {
    return `${s.getDate()}–${e.getDate()} ${months[e.getMonth()]} ${e.getFullYear()}`;
  }
  return `${s.getDate()} ${months[s.getMonth()]}–${e.getDate()} ${months[e.getMonth()]} ${e.getFullYear()}`;
}

function daysUntil(dateStr) {
  const target = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / 86400000);
}

export default function App() {
  const [view, setView] = useState("public");
  const [programs, setPrograms] = useState(DEFAULT_PROGRAMS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const result = await window.storage.get(STORAGE_KEY, true);
        if (result && result.value) {
          setPrograms(JSON.parse(result.value));
        }
      } catch (e) {
        // belum ada data tersimpan — pakai default
      }
      setLoading(false);
    })();
  }, []);

  const updateProgram = (id, field, value) => {
    setPrograms((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const saveAll = async () => {
    setSaving(true);
    setSaveMsg("");
    try {
      const result = await window.storage.set(STORAGE_KEY, JSON.stringify(programs), true);
      if (result) {
        setSaveMsg("Tersimpan.");
      } else {
        setSaveMsg("Gagal menyimpan, coba lagi.");
      }
    } catch (e) {
      setSaveMsg("Gagal menyimpan, coba lagi.");
    }
    setSaving(false);
    setTimeout(() => setSaveMsg(""), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100">
        <Loader2 className="animate-spin text-amber-700" size={28} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 font-sans">
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-xs tracking-widest font-mono text-amber-700 font-semibold mb-1">INDEO INSTITUTE — PROTOTIPE</div>
            <h1 className="text-2xl font-bold text-slate-900">Manajemen Batch Training</h1>
          </div>
          <div className="flex gap-2 bg-white border border-stone-300 rounded-lg p-1">
            <button
              onClick={() => setView("public")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold transition ${
                view === "public" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-stone-100"
              }`}
            >
              <Eye size={15} /> Preview Publik
            </button>
            <button
              onClick={() => setView("admin")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold transition ${
                view === "admin" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-stone-100"
              }`}
            >
              <Settings size={15} /> Panel Admin
            </button>
          </div>
        </div>

        {view === "admin" ? (
          <AdminPanel programs={programs} updateProgram={updateProgram} saveAll={saveAll} saving={saving} saveMsg={saveMsg} />
        ) : (
          <PublicPreview programs={programs} />
        )}
      </div>
    </div>
  );
}

function AdminPanel({ programs, updateProgram, saveAll, saving, saveMsg }) {
  return (
    <div className="bg-white rounded-lg border border-stone-300 overflow-hidden">
      <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
        <p className="text-sm text-slate-600">Ubah tanggal, format, venue, dan kuota tiap batch. Perubahan langsung terlihat di tab Preview Publik setelah disimpan.</p>
        <div className="flex items-center gap-3">
          {saveMsg && <span className="text-sm text-emerald-700 font-medium">{saveMsg}</span>}
          <button
            onClick={saveAll}
            disabled={saving}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-amber-700 transition disabled:opacity-60"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Simpan Semua
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-900 text-white text-left">
              <th className="px-4 py-3 font-semibold">Program</th>
              <th className="px-4 py-3 font-semibold">Mulai</th>
              <th className="px-4 py-3 font-semibold">Selesai</th>
              <th className="px-4 py-3 font-semibold">Format</th>
              <th className="px-4 py-3 font-semibold">Venue</th>
              <th className="px-4 py-3 font-semibold">Kuota (%)</th>
            </tr>
          </thead>
          <tbody>
            {programs.map((p, i) => (
              <tr key={p.id} className={i % 2 ? "bg-stone-50" : "bg-white"}>
                <td className="px-4 py-3 align-top">
                  <div className="font-semibold text-slate-900">{p.title}</div>
                  <div className="text-xs font-mono text-slate-500">{p.regCode}</div>
                </td>
                <td className="px-4 py-3 align-top">
                  <input
                    type="date"
                    value={p.dateStart}
                    onChange={(e) => updateProgram(p.id, "dateStart", e.target.value)}
                    className="border border-stone-300 rounded px-2 py-1.5 text-sm w-36"
                  />
                </td>
                <td className="px-4 py-3 align-top">
                  <input
                    type="date"
                    value={p.dateEnd}
                    onChange={(e) => updateProgram(p.id, "dateEnd", e.target.value)}
                    className="border border-stone-300 rounded px-2 py-1.5 text-sm w-36"
                  />
                </td>
                <td className="px-4 py-3 align-top">
                  <select
                    value={p.format}
                    onChange={(e) => updateProgram(p.id, "format", e.target.value)}
                    className="border border-stone-300 rounded px-2 py-1.5 text-sm"
                  >
                    <option value="online">Online</option>
                    <option value="onsite">Onsite</option>
                  </select>
                </td>
                <td className="px-4 py-3 align-top">
                  <input
                    type="text"
                    value={p.venue}
                    disabled={p.format !== "onsite"}
                    onChange={(e) => updateProgram(p.id, "venue", e.target.value)}
                    placeholder={p.format === "onsite" ? "Nama venue / alamat" : "— (online)"}
                    className="border border-stone-300 rounded px-2 py-1.5 text-sm w-52 disabled:bg-stone-100 disabled:text-stone-400"
                  />
                </td>
                <td className="px-4 py-3 align-top">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={p.quotaPct}
                    onChange={(e) => updateProgram(p.id, "quotaPct", Math.max(0, Math.min(100, Number(e.target.value))))}
                    className="border border-stone-300 rounded px-2 py-1.5 text-sm w-20"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PublicPreview({ programs }) {
  return (
    <div>
      <div className="mb-6">
        <div className="text-xs tracking-widest font-mono text-amber-700 font-semibold mb-1">BATCH WEBINAR TERBUKA</div>
        <h2 className="text-2xl font-serif font-bold text-slate-900">Kalender Program Training BPR/BPRS</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programs.map((p) => (
          <Card key={p.id} p={p} />
        ))}
      </div>
    </div>
  );
}

function Card({ p }) {
  const waText = encodeURIComponent(
    `Halo InDeo Institute, saya ingin tanya soal batch "${p.title}" (${fmtDateRange(p.dateStart, p.dateEnd)}).`
  );
  const waLink = `https://wa.me/${WA_NUMBER}?text=${waText}`;
  const formLink = `${FORM_URL_BASE}?program=${p.id}`;

  let deadlineNode;
  if (p.deadlineType === "overdue") {
    deadlineNode = (
      <div className="bg-red-50 border-l-4 border-red-700 text-red-800 text-xs font-semibold px-3 py-2 rounded-sm">
        ⚠️ Tenggat kebijakan sudah lewat — program bersifat catch-up
      </div>
    );
  } else if (p.deadlineType === "regulatory") {
    const d = daysUntil(p.regDeadline);
    deadlineNode = (
      <div className="flex items-baseline gap-1.5 text-xs text-slate-500">
        <span>Tenggat masa transisi:</span>
        <span className="font-mono font-semibold text-amber-700 text-sm">~{d} hari lagi</span>
      </div>
    );
  } else {
    const d = daysUntil(p.dateStart);
    deadlineNode = (
      <div className="flex items-baseline gap-1.5 text-xs text-slate-500">
        <span>Batch dimulai dalam</span>
        <span className="font-mono font-semibold text-amber-700 text-sm">{d >= 0 ? `${d} hari` : "sudah berjalan"}</span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-stone-300 rounded overflow-hidden flex flex-col hover:shadow-lg hover:-translate-y-0.5 transition">
      <div className="relative h-28 px-3.5 py-3 flex flex-col justify-between bg-gradient-to-br from-slate-900 to-slate-800">
        <span className="self-start text-[10px] tracking-wider font-mono font-semibold text-slate-900 bg-amber-500 px-2 py-0.5 rounded-sm">
          {p.trackTag}
        </span>
        <div>
          <div className="text-white font-serif font-bold text-base leading-snug">{p.title}</div>
          <div className="text-slate-300 font-mono text-[10px]">{p.regCode}</div>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-2.5 flex-1">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 font-semibold text-slate-800 bg-stone-100 border border-stone-300 rounded-full px-2.5 py-0.5">
            {p.format === "onsite" ? <MapPin size={11} /> : <Video size={11} />}
            {p.format === "onsite" ? (p.venue || "Onsite") : "WEBINAR ONLINE"}
          </span>
          <span className="flex items-center gap-1 font-mono text-slate-500">
            <Calendar size={11} /> {fmtDateRange(p.dateStart, p.dateEnd)}
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed flex-1">{p.desc}</p>

        <div className="h-px bg-stone-200" />

        {deadlineNode}

        <div>
          <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1">
            <span className="flex items-center gap-1"><Users size={11} /> Kuota Terisi</span>
            <span className="font-mono text-teal-700">{p.quotaPct}%</span>
          </div>
          <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
            <div className="h-full bg-teal-700 rounded-full" style={{ width: `${p.quotaPct}%` }} />
          </div>
        </div>

        <a
          href={formLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-amber-700 text-white text-sm font-semibold py-2.5 rounded transition"
        >
          Daftar Batch Ini <ExternalLink size={13} />
        </a>
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-emerald-700 font-medium py-1 transition"
        >
          <MessageCircle size={12} /> Ada pertanyaan? Chat via WhatsApp
        </a>
      </div>
    </div>
  );
}

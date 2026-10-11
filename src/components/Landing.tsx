import React from 'react';
import { ArrowRight, Building2, ClipboardCheck, ShieldCheck, Users } from 'lucide-react';
import type { TabId } from './Header';

const DOORS: { tab: TabId; title: string; text: string; cta: string; Icon: React.FC<{ className?: string }> }[] = [
  { tab: 'report', title: 'Saya peserta', text: 'Lihat apa yang tercatat atas nama Anda, lalu jawab satu pertanyaan singkat.', cta: 'Cek layanan saya', Icon: Users },
  { tab: 'queue', title: 'Saya petugas', text: 'Antrean prioritas dengan bukti dua sisi: catatan klaim dan cerita peserta.', cta: 'Buka meja verifikasi', Icon: ClipboardCheck },
  { tab: 'faskes', title: 'Saya faskes', text: 'Terima permintaan konfirmasi dengan bahasa netral, dan jelaskan lebih dulu.', cta: 'Buka konfirmasi', Icon: Building2 }
];

export const Landing: React.FC<{ onEnter: (tab: TabId) => void }> = ({ onEnter }) => (
  <div className="min-h-screen bg-white text-slate-900 font-sans antialiased">
    <section className="hero text-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="text-xl font-extrabold tracking-tight">MATA<span className="text-emerald-300"> HATI</span></div>
          <button type="button" onClick={() => onEnter('queue')} className="text-sm font-semibold text-white/80 hover:text-white">Lihat demo petugas</button>
        </div>
        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-10 items-center py-12 lg:py-20">
          <div className="space-y-6">
            <div className="text-xs font-bold uppercase tracking-[.2em] text-matahari">Healthkathon BPJS Kesehatan 2026 · Efisiensi Risiko pada Fasilitas Kesehatan</div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.08]">Pasien tahu apa yang diterimanya. Sekarang, sistem pun tahu.</h1>
            <p className="text-lg text-white/80 max-w-xl">Analitik klaim melihat apa yang ditagihkan. MATA HATI mempertemukannya dengan pengalaman peserta, lalu menyusun antrean pemeriksaan tanpa pernah menuduh siapa pun.</p>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => onEnter('report')} className="h-12 px-6 rounded-xl bg-matahari text-tinta font-extrabold flex items-center gap-2 hover:brightness-95">Cek layanan saya <ArrowRight className="w-4 h-4" /></button>
              <button type="button" onClick={() => onEnter('queue')} className="h-12 px-6 rounded-xl border border-white/35 font-semibold hover:bg-white/10">Lihat meja petugas</button>
            </div>
          </div>
          <div className="rounded-3xl bg-white text-slate-900 p-6 shadow-2xl" aria-label="Contoh perbandingan">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Contoh · obat hipertensi</div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs text-slate-500">Tercatat</div><div className="text-4xl font-extrabold text-tinta mt-1">5</div></div>
              <div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs text-slate-500">Diterima</div><div className="text-4xl font-extrabold text-tinta mt-1">2</div></div>
              <div className="rounded-2xl bg-matahari-soft p-4"><div className="text-xs text-slate-600">Selisih</div><div className="text-4xl font-extrabold text-tinta mt-1">3</div></div>
            </div>
            <p className="mt-4 text-sm text-slate-600">Satu laporan hanyalah petunjuk. Bila tiga pelapor berbeda menyebut hal serupa pada satu faskes, faskes itu naik ke antrean pemeriksaan.</p>
          </div>
        </div>
      </div>
    </section>

    <section className="max-w-6xl mx-auto px-5 sm:px-8 py-14">
      <h2 className="text-2xl font-extrabold text-tinta">Masuk sebagai siapa?</h2>
      <div className="mt-6 grid md:grid-cols-3 gap-5">
        {DOORS.map(({ tab, title, text, cta, Icon }) => (
          <button key={tab} type="button" onClick={() => onEnter(tab)} className="text-left rounded-2xl border border-slate-200 p-6 hover:border-emerald-500 hover:shadow-lg transition group">
            <span className="grid place-items-center w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700"><Icon className="w-5 h-5" /></span>
            <div className="mt-4 text-lg font-extrabold text-tinta">{title}</div>
            <p className="mt-1 text-sm text-slate-600">{text}</p>
            <div className="mt-4 text-sm font-bold text-emerald-700 flex items-center gap-1.5">{cta}<ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition" /></div>
          </button>
        ))}
      </div>
    </section>

    <section className="bg-slate-50 border-y border-slate-200">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 grid md:grid-cols-2 gap-10">
        <div>
          <h2 className="text-2xl font-extrabold text-tinta">Cara kerjanya</h2>
          <ol className="mt-5 space-y-4">
            {['Peserta melihat layanan yang tercatat atas namanya.', 'Satu jawaban singkat dibandingkan dengan catatan klaim. Selisih dihitung oleh kode, bukan oleh AI.', 'Pola dari pelapor yang berbeda menentukan faskes mana yang diperiksa lebih dulu.'].map((t, i) => (
              <li key={i} className="flex gap-3"><span className="shrink-0 w-7 h-7 rounded-full bg-tinta text-white text-sm font-bold grid place-items-center">{i + 1}</span><span className="text-slate-700">{t}</span></li>
            ))}
          </ol>
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-tinta flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-emerald-700" />Dirancang agar adil</h2>
          <ul className="mt-5 space-y-3 text-slate-700">
            <li>Sistem tidak pernah menyimpulkan kecurangan; keputusan ada pada petugas.</li>
            <li>Setiap kasus menyertakan penjelasan alternatif yang wajar.</li>
            <li>Identitas pelapor tidak dibagikan ke faskes.</li>
          </ul>
        </div>
      </div>
    </section>

    <footer className="max-w-6xl mx-auto px-5 sm:px-8 py-8 text-xs text-slate-500">
      Prototipe peserta BPJS Kesehatan Healthkathon 2026, bukan produk resmi BPJS Kesehatan. Seluruh data di aplikasi ini adalah simulasi.
    </footer>
  </div>
);

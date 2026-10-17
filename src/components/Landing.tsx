import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Eye, Info, ShieldCheck } from 'lucide-react';
import type { TabId } from './Header';

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

const STEPS: { title: string; text: string }[] = [
  { title: 'Lihat', text: 'Anda melihat layanan, jumlah obat, atau tindakan yang tercatat atas nama Anda.' },
  { title: 'Jawab', text: 'Satu pertanyaan: berapa yang benar-benar Anda terima? Anda boleh menambahkan cerita singkat atau foto.' },
  { title: 'Diteruskan', text: 'Selisih dihitung program, bukan AI. Bila berbeda, laporan diteruskan ke petugas untuk dicek, bukan untuk menghukum siapa pun.' }
];

const ROLES: { tab: TabId; label: string; title: string; text: string; cta: string; primary?: boolean }[] = [
  { tab: 'report', label: 'PESERTA', title: 'Cek dan pantau laporan', text: 'Lihat layanan yang tercatat atas nama Anda, jawab satu pertanyaan, dan pantau perkembangan laporan Anda.', cta: 'Cek layanan saya', primary: true },
  { tab: 'queue', label: 'PETUGAS BPJS KESEHATAN', title: 'Antrean prioritas', text: 'Laporan yang sudah dicocokkan dengan klaim dan diurutkan. Keputusan akhir tetap ada pada petugas.', cta: 'Masuk sebagai petugas' },
  { tab: 'faskes', label: 'FASILITAS KESEHATAN', title: 'Konfirmasi netral', text: 'Terima pertanyaan klarifikasi dan jawab langsung, tanpa identitas peserta dan tanpa praduga.', cta: 'Masuk sebagai faskes' }
];

const PRINCIPLES: { title: string; text: string }[] = [
  { title: 'Tidak pernah menuduh', text: 'Sistem tidak menyatakan adanya kecurangan. Hasilnya selalu berupa prioritas pemeriksaan.' },
  { title: 'Satu laporan tidak cukup', text: 'Perhatian pada sebuah faskes baru naik bila beberapa pelapor berbeda menyebut hal serupa.' },
  { title: 'Manusia yang memutuskan', text: 'AI membantu membaca cerita pasien. Keputusan akhir selalu ada pada petugas.' }
];

const RECORDED = 5;

export const Landing: React.FC<{ onEnter: (tab: TabId) => void }> = ({ onEnter }) => {
  const [received, setReceived] = useState(2);
  const gap = RECORDED - received;

  return (
    <div className="min-h-screen bg-kertas text-tinta font-sans antialiased">
      <header className="max-w-[1200px] mx-auto px-5 sm:px-6 py-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-[22px] sm:text-2xl font-extrabold tracking-tight whitespace-nowrap">
          <Eye className="w-7 h-7 text-emerald-700" aria-hidden="true" />
          <span>MATA <span className="text-emerald-700">HATI</span></span>
        </div>
        <nav className="flex items-center gap-x-7 text-[15px] font-semibold text-slate-600" aria-label="Navigasi halaman">
          <button type="button" onClick={() => scrollTo('cara-kerja')} className="hidden md:block hover:text-emerald-700">Cara kerja</button>
          <button type="button" onClick={() => scrollTo('prinsip')} className="hidden md:block hover:text-emerald-700">Privasi dan prinsip</button>
          <button type="button" onClick={() => onEnter('queue')} className="h-11 px-3.5 sm:px-5 rounded-xl border-[1.5px] border-tinta text-tinta text-sm sm:text-[15px] font-bold whitespace-nowrap hover:bg-white">Masuk sebagai petugas</button>
        </nav>
      </header>

      <section className="max-w-[1200px] mx-auto px-5 sm:px-6 pt-8 pb-16 lg:pb-24 grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-center">
        <div className="space-y-6 sm:space-y-7">
          <div className="flex items-center gap-2.5 text-[15px] font-bold text-emerald-700"><span className="w-2 h-2 rounded-full bg-emerald-700" />Konfirmasi layanan JKN untuk peserta</div>
          <h1 className="text-[38px] sm:text-5xl lg:text-[64px] font-extrabold tracking-[-0.03em] leading-[1.06] max-w-[640px]">Pasien tahu apa yang diterimanya. Sekarang, sistem pun tahu.</h1>
          <p className="text-[17px] sm:text-xl leading-relaxed text-slate-600 max-w-[540px]">Lihat layanan yang tercatat atas nama Anda, lalu konfirmasi apa yang benar-benar Anda terima. Cukup dua menit, dan tidak untuk menuduh siapa pun.</p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <button type="button" onClick={() => onEnter('report')} className="h-14 px-7 rounded-2xl bg-emerald-700 text-white text-[17px] font-bold flex items-center justify-center gap-2.5 hover:bg-emerald-800">Cek layanan saya <ArrowRight className="w-5 h-5" /></button>
            <button type="button" onClick={() => scrollTo('cara-kerja')} className="text-base font-bold underline underline-offset-[5px] hover:text-emerald-700">Lihat cara kerjanya</button>
          </div>
          <div className="flex items-start gap-2.5 text-[15px] leading-normal text-slate-500 max-w-[520px]">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-px" aria-hidden="true" />
            <span>Jawaban Anda dipakai untuk memeriksa layanan, bukan untuk menghukum siapa pun.</span>
          </div>
        </div>

        <div className="w-full max-w-[520px] lg:justify-self-end bg-white border border-slate-200 rounded-[22px] shadow-[0_24px_56px_rgba(10,42,94,0.12)] p-5 sm:p-7 space-y-5" aria-label="Tampilan layanan yang tercatat">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-500">Tercatat atas nama Anda</span>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 rounded-full px-3 py-1">data simulasi</span>
          </div>
          <div>
            <div className="text-2xl font-extrabold tracking-tight">RSUD Sehat Sentosa</div>
            <div className="text-sm text-slate-500 mt-1">12 September 2026 · Rawat jalan</div>
          </div>
          <dl className="border-t border-dashed border-slate-300 text-[15px]">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 py-3.5 border-b border-dashed border-slate-300"><dt className="text-slate-500">Layanan</dt><dd className="font-bold sm:text-right">Amlodipine 10mg &amp; Candesartan 16mg · tercatat {RECORDED} item</dd></div>
            <div className="flex justify-between gap-4 py-3.5 border-b border-dashed border-slate-300"><dt className="text-slate-500">Dibayarkan program JKN</dt><dd className="font-bold">Rp 485.000</dd></div>
            <div className="flex justify-between gap-4 py-3.5"><dt className="text-slate-500">Biaya tambahan</dt><dd className="font-bold">tidak tercatat</dd></div>
          </dl>
          <div>
            <div className="text-base font-extrabold" id="landing-tanya">Berapa obat yang Anda terima?</div>
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-labelledby="landing-tanya">
              {Array.from({ length: RECORDED + 1 }, (_, n) => (
                <button key={n} type="button" aria-pressed={received === n} onClick={() => setReceived(n)}
                  className={'w-11 h-11 sm:w-12 sm:h-12 rounded-xl border-[1.5px] text-base font-bold transition ' + (received === n ? 'bg-tinta border-tinta text-white' : 'bg-white border-slate-300 text-tinta hover:border-tinta')}>{n}</button>
              ))}
            </div>
          </div>
          <div className={'rounded-2xl px-4 py-4 space-y-1 ' + (gap === 0 ? 'bg-emerald-50' : 'bg-matahari-soft')} aria-live="polite">
            <div className="text-base font-extrabold">{gap === 0 ? 'Sesuai catatan' : `Selisih ${gap} item`}</div>
            <div className="text-sm leading-normal text-slate-700">{gap === 0 ? 'Tidak ada yang perlu diteruskan.' : 'Jawaban Anda diteruskan ke petugas untuk dicek. Ini belum berarti ada yang salah.'}</div>
          </div>
        </div>
      </section>

      <section id="cara-kerja" className="bg-white">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 py-16 lg:py-20 space-y-12">
          <h2 className="text-3xl sm:text-[40px] font-extrabold tracking-[-0.02em] leading-[1.1] max-w-[640px]">Tiga langkah, kurang dari dua menit</h2>
          <ol className="grid md:grid-cols-3 gap-8 lg:gap-10">
            {STEPS.map((s, i) => (
              <li key={s.title} className="border-t-[3px] border-tinta pt-5 space-y-3.5">
                <div className="text-5xl sm:text-[56px] leading-none font-extrabold text-emerald-700" aria-hidden="true">{i + 1}</div>
                <div className="text-[22px] font-extrabold">{s.title}</div>
                <p className="text-[17px] leading-relaxed text-slate-600">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="peran" className="bg-tinta text-white">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 py-16 lg:py-20 space-y-12">
          <div className="space-y-3.5 max-w-[680px]">
            <h2 className="text-3xl sm:text-[40px] font-extrabold tracking-[-0.02em] leading-[1.1]">Satu aplikasi, tiga peran</h2>
            <p className="text-lg leading-relaxed text-[#c6d3ea]">Setiap pihak melihat hal yang ia perlukan, dan hanya itu.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 lg:gap-6">
            {ROLES.map((r) => (
              <div key={r.tab} className="bg-[#123572] rounded-[18px] p-6 sm:p-8 flex flex-col gap-3.5">
                <div className="text-[13px] font-extrabold tracking-[0.12em] text-matahari">{r.label}</div>
                <div className="text-2xl font-extrabold">{r.title}</div>
                <p className="grow text-base leading-relaxed text-[#c6d3ea]">{r.text}</p>
                <button type="button" onClick={() => onEnter(r.tab)}
                  className={'h-[52px] rounded-xl text-base font-extrabold ' + (r.primary ? 'bg-matahari text-tinta hover:brightness-95' : 'border-[1.5px] border-white text-white hover:bg-white/10')}>{r.cta}</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="prinsip">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 py-16 lg:py-20 space-y-12">
          <h2 className="text-3xl sm:text-[40px] font-extrabold tracking-[-0.02em] leading-[1.1] max-w-[640px]">Dirancang agar adil bagi semua pihak</h2>
          <ul className="grid md:grid-cols-3 gap-8 lg:gap-10">
            {PRINCIPLES.map((p) => (
              <li key={p.title} className="flex gap-4">
                <CheckCircle2 className="w-7 h-7 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="space-y-2">
                  <div className="text-xl font-extrabold">{p.title}</div>
                  <p className="text-base leading-relaxed text-slate-600">{p.text}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex items-start gap-3 bg-slate-100 rounded-2xl px-5 py-4 text-[15px] leading-relaxed text-slate-600">
            <Info className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />
            <span>Ini prototipe. Seluruh data di dalamnya adalah data simulasi dan tidak ada data peserta JKN yang nyata. Bukan produk resmi BPJS Kesehatan.</span>
          </div>
        </div>
      </section>

      <footer className="bg-white border-t border-slate-200">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 py-9 space-y-2">
          <div className="text-xl font-extrabold">MATA<span className="text-emerald-700"> HATI</span></div>
          <div className="text-sm leading-relaxed text-slate-500">Prototipe untuk Healthkathon BPJS Kesehatan 2026 · Data simulasi<br />Dikembangkan oleh Tim PUAN KARSA</div>
        </div>
      </footer>
    </div>
  );
};

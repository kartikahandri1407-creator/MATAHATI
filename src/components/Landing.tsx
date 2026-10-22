import React, { useState } from 'react';
import { ArrowRight, BrainCircuit, Calculator, CheckCircle2, ClipboardCheck, Eye, FileSearch, Info, Scale, ShieldCheck, Smartphone, Building2, UserRound, Users } from 'lucide-react';
import { ROLES, Role } from '../data/roles';

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

const STEPS: { title: string; text: string }[] = [
  { title: 'Lihat', text: 'Anda melihat layanan, jumlah obat, atau tindakan yang tercatat atas nama Anda.' },
  { title: 'Jawab', text: 'Satu pertanyaan: berapa yang benar-benar Anda terima? Anda boleh menambahkan cerita singkat atau foto.' },
  { title: 'Diteruskan', text: 'Selisih dihitung program, bukan AI. Bila berbeda, laporan diteruskan ke petugas untuk dicek, bukan untuk menghukum siapa pun.' }
];

/** Alur lengkap dari sisi sistem: siapa mengerjakan apa. */
const FLOW: { who: string; title: string; text: string; Icon: React.ElementType }[] = [
  { who: 'Peserta', title: 'Menjawab', text: 'Peserta mengecek layanannya dan menjawab satu pertanyaan.', Icon: Smartphone },
  { who: 'Program', title: 'Membandingkan', text: 'Jawaban dicocokkan dengan klaim. Selisih dihitung oleh program.', Icon: Calculator },
  { who: 'Petugas', title: 'Memeriksa', text: 'Laporan masuk antrean berurutan prioritas. Petugas meminta konfirmasi faskes.', Icon: ClipboardCheck },
  { who: 'Faskes', title: 'Menjelaskan', text: 'Faskes menjawab dengan netral: sesuai catatan, stok kosong, atau salah catat.', Icon: Building2 },
  { who: 'Peserta', title: 'Mendapat kabar', text: 'Peserta melihat perkembangan laporannya sampai selesai.', Icon: UserRound }
];

const ENTRY: { role: Role; title: string; text: string; cta: string; Icon: React.ElementType; primary?: boolean }[] = [
  { role: 'peserta', title: 'Cek dan pantau laporan', text: 'Lihat layanan atas nama Anda, jawab satu pertanyaan, lalu pantau perkembangannya.', cta: 'Masuk sebagai peserta', Icon: UserRound, primary: true },
  { role: 'petugas', title: 'Antrean prioritas', text: 'Laporan yang sudah dicocokkan dengan klaim dan diurutkan. Keputusan akhir ada pada petugas.', cta: 'Masuk sebagai petugas', Icon: ClipboardCheck },
  { role: 'faskes', title: 'Konfirmasi netral', text: 'Terima pertanyaan klarifikasi dan jawab langsung, tanpa identitas peserta dan tanpa praduga.', cta: 'Masuk sebagai faskes', Icon: Building2 }
];

const AI_DOES = [
  'Membaca cerita peserta dan mengambil faktanya (jumlah, tanggal, tindakan).',
  'Menerjemahkan pertanyaan petugas ("faskes mana yang paling perlu dilihat?") menjadi pencarian terstruktur.',
  'Membantu menyusun draf surat konfirmasi yang netral.'
];
const AI_NOT = [
  'Menghitung selisih. Itu dikerjakan program dan bisa diperiksa ulang.',
  'Menyimpulkan ada kecurangan. Hasilnya selalu berupa prioritas pemeriksaan.',
  'Memutuskan tindak lanjut. Itu hak petugas.'
];

const PRINCIPLES: { title: string; text: string }[] = [
  { title: 'Tidak pernah menuduh', text: 'Sistem tidak menyatakan adanya kecurangan. Hasilnya selalu berupa prioritas pemeriksaan.' },
  { title: 'Satu laporan tidak cukup', text: 'Perhatian pada sebuah faskes baru naik bila tiga pelapor berbeda menyebut hal serupa.' },
  { title: 'Manusia yang memutuskan', text: 'AI membantu membaca cerita pasien. Keputusan akhir selalu ada pada petugas.' }
];

const RECORDED = 5;

export const Landing: React.FC<{ onEnter: (role: Role) => void }> = ({ onEnter }) => {
  const [received, setReceived] = useState(2);
  const gap = RECORDED - received;

  return (
    <div className="min-h-screen bg-kertas text-tinta font-sans antialiased">
      <header className="max-w-[1200px] mx-auto px-5 sm:px-6 py-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-[22px] sm:text-2xl font-extrabold tracking-tight whitespace-nowrap">
          <span className="w-9 h-9 rounded-xl bg-tinta text-white grid place-items-center"><Eye className="w-5 h-5" aria-hidden="true" /></span>
          <span>MATA <span className="text-emerald-700">HATI</span></span>
        </div>
        <nav className="flex items-center gap-x-7 text-[15px] font-semibold text-slate-600" aria-label="Navigasi halaman">
          <button type="button" onClick={() => scrollTo('alur')} className="hidden md:block hover:text-emerald-700">Alur kerja</button>
          <button type="button" onClick={() => scrollTo('peran-ai')} className="hidden md:block hover:text-emerald-700">Peran AI</button>
          <button type="button" onClick={() => scrollTo('prinsip')} className="hidden md:block hover:text-emerald-700">Prinsip</button>
          <button type="button" onClick={() => scrollTo('peran')} className="h-11 px-4 sm:px-5 rounded-xl bg-tinta text-white text-sm sm:text-[15px] font-bold whitespace-nowrap hover:bg-[#0d3a80]">Coba aplikasi</button>
        </nav>
      </header>

      <section className="max-w-[1200px] mx-auto px-5 sm:px-6 pt-8 pb-16 lg:pb-24 grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-center">
        <div className="space-y-6 sm:space-y-7">
          <div className="inline-flex items-center gap-2.5 text-[14px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-full px-3.5 py-1.5"><span className="w-2 h-2 rounded-full bg-emerald-600" />Konfirmasi layanan JKN untuk peserta</div>
          <h1 className="text-[38px] sm:text-5xl lg:text-[64px] font-extrabold tracking-[-0.03em] leading-[1.06] max-w-[640px]">Pasien tahu apa yang diterimanya. Sekarang, sistem pun tahu.</h1>
          <p className="text-[17px] sm:text-xl leading-relaxed text-slate-600 max-w-[540px]">Setelah berobat, lihat layanan yang tercatat atas nama Anda dan konfirmasi apa yang benar-benar Anda terima. Cukup dua menit, dan tidak untuk menuduh siapa pun.</p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <button type="button" onClick={() => onEnter('peserta')} className="btn-primary h-14 px-7 text-[17px] flex items-center justify-center gap-2.5">Mulai sebagai peserta <ArrowRight className="w-5 h-5" /></button>
            <button type="button" onClick={() => scrollTo('alur')} className="text-base font-bold underline underline-offset-[5px] hover:text-emerald-700">Lihat alur lengkapnya</button>
          </div>
          <div className="flex items-start gap-2.5 text-[15px] leading-normal text-slate-500 max-w-[520px]">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-px" aria-hidden="true" />
            <span>Jawaban Anda dipakai untuk memeriksa layanan, bukan untuk menghukum siapa pun.</span>
          </div>
        </div>

        <div className="w-full max-w-[520px] lg:justify-self-end space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-sm font-bold text-slate-600">Contoh tampilan: begini yang Anda lihat setelah berobat</span>
            <span className="text-[11px] font-bold text-amber-900 bg-matahari-soft border border-amber-200 rounded-full px-2.5 py-1">ilustrasi</span>
          </div>
          <div className="card p-5 sm:p-7 space-y-5 shadow-[0_28px_60px_-20px_rgba(10,42,94,0.28)]" aria-label="Contoh tampilan layanan yang tercatat">
            <div>
              <div className="text-2xl font-extrabold tracking-tight">RSUD Sehat Sentosa</div>
              <div className="text-sm text-slate-500 mt-1">12 September 2026 · Rawat jalan</div>
            </div>
            <dl className="border-t border-dashed border-slate-300 text-[15px]">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 py-3.5 border-b border-dashed border-slate-300"><dt className="text-slate-500">Layanan</dt><dd className="font-bold sm:text-right">Obat tekanan darah · tercatat {RECORDED} item</dd></div>
              <div className="flex justify-between gap-4 py-3.5 border-b border-dashed border-slate-300"><dt className="text-slate-500">Dibayarkan program JKN</dt><dd className="font-bold">Rp 485.000</dd></div>
              <div className="flex justify-between gap-4 py-3.5"><dt className="text-slate-500">Biaya tambahan</dt><dd className="font-bold">tidak tercatat</dd></div>
            </dl>
            <div>
              <div className="text-base font-extrabold" id="landing-tanya">Berapa obat yang Anda terima? <span className="text-xs font-semibold text-slate-500">(coba pilih)</span></div>
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
        </div>
      </section>

      <section id="cara-kerja" className="bg-white">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 py-16 lg:py-20 space-y-12">
          <h2 className="text-3xl sm:text-[40px] font-extrabold tracking-[-0.02em] leading-[1.1] max-w-[640px]">Bagi peserta: tiga langkah, kurang dari dua menit</h2>
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

      <section id="alur" className="bg-kertas">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 py-16 lg:py-20 space-y-10">
          <div className="space-y-3 max-w-[700px]">
            <h2 className="text-3xl sm:text-[40px] font-extrabold tracking-[-0.02em] leading-[1.1]">Dari satu jawaban sampai kabar kembali</h2>
            <p className="text-lg leading-relaxed text-slate-600">Empat pihak terlibat, masing-masing hanya melihat bagiannya. Semua tahap tercatat sehingga posisi setiap laporan selalu jelas.</p>
          </div>
          <ol className="grid md:grid-cols-5 gap-4">
            {FLOW.map((f, i) => (
              <li key={i} className="card p-5 space-y-2.5 relative">
                <span className="absolute -top-3 left-5 text-[11px] font-extrabold tracking-wider bg-tinta text-white rounded-full px-2.5 py-1">{i + 1}</span>
                <f.Icon className="w-7 h-7 text-emerald-700 mt-2" aria-hidden="true" />
                <div className="text-[11px] font-extrabold tracking-[.12em] uppercase text-slate-500">{f.who}</div>
                <div className="text-lg font-extrabold leading-tight">{f.title}</div>
                <p className="text-sm leading-relaxed text-slate-600">{f.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="peran" className="bg-tinta text-white">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 py-16 lg:py-20 space-y-10">
          <div className="space-y-3.5 max-w-[720px]">
            <h2 className="text-3xl sm:text-[40px] font-extrabold tracking-[-0.02em] leading-[1.1]">Pilih peran untuk mencoba</h2>
            <p className="text-lg leading-relaxed text-[#c6d3ea]">Prototipe ini belum memakai login, jadi Anda memilih peran sendiri. Setiap peran hanya melihat menu miliknya, dan penanda di bagian atas selalu menunjukkan Anda sedang masuk sebagai siapa.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 lg:gap-6">
            {ENTRY.map((r) => {
              const d = ROLES[r.role];
              return (
                <div key={r.role} className="bg-[#123572] border border-white/10 rounded-[20px] p-6 sm:p-7 flex flex-col gap-3.5">
                  <div className="flex items-center gap-2.5"><r.Icon className="w-5 h-5 text-matahari" aria-hidden="true" /><span className="text-[13px] font-extrabold tracking-[0.12em] text-matahari uppercase">{d.label}</span></div>
                  <div className="text-2xl font-extrabold">{r.title}</div>
                  <p className="text-base leading-relaxed text-[#c6d3ea]">{r.text}</p>
                  <ul className="grow space-y-1.5 text-sm text-[#c6d3ea]">
                    {d.sees.map(x => <li key={x} className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />{x}</li>)}
                    <li className="flex gap-2 text-white/55"><span className="w-4 text-center shrink-0">✕</span>Tidak melihat: {d.notSees}</li>
                  </ul>
                  <button type="button" onClick={() => onEnter(r.role)}
                    className={'h-[52px] rounded-xl text-base font-extrabold ' + (r.primary ? 'bg-matahari text-tinta hover:brightness-95' : 'border-[1.5px] border-white text-white hover:bg-white/10')}>{r.cta}</button>
                </div>);
            })}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[#c6d3ea]">
            <Users className="w-4 h-4" aria-hidden="true" />
            <span>Tim pengelola (data klaim, uji kualitas AI, alat demo) juga punya peran sendiri.</span>
            <button type="button" onClick={() => onEnter('pengelola')} className="font-bold underline underline-offset-4 text-white hover:text-matahari">Masuk sebagai pengelola</button>
          </div>
        </div>
      </section>

      <section id="peran-ai" className="bg-white">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 py-16 lg:py-20 space-y-10">
          <div className="space-y-3 max-w-[720px]">
            <h2 className="text-3xl sm:text-[40px] font-extrabold tracking-[-0.02em] leading-[1.1]">Di mana AI bekerja, dan di mana tidak</h2>
            <p className="text-lg leading-relaxed text-slate-600">AI dipakai untuk memahami bahasa. Hal yang menentukan, seperti menghitung dan memutuskan, sengaja tidak diserahkan kepadanya.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-[20px] border border-emerald-200 bg-emerald-50/60 p-6 sm:p-7 space-y-4">
              <div className="flex items-center gap-2.5 text-xl font-extrabold text-emerald-900"><BrainCircuit className="w-6 h-6" aria-hidden="true" />AI membantu</div>
              <ul className="space-y-2.5 text-[15px] leading-relaxed text-slate-700">{AI_DOES.map(x => <li key={x} className="flex gap-2.5"><FileSearch className="w-4 h-4 text-emerald-700 shrink-0 mt-1" />{x}</li>)}</ul>
            </div>
            <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-6 sm:p-7 space-y-4">
              <div className="flex items-center gap-2.5 text-xl font-extrabold text-tinta"><Scale className="w-6 h-6" aria-hidden="true" />AI tidak dipakai untuk</div>
              <ul className="space-y-2.5 text-[15px] leading-relaxed text-slate-700">{AI_NOT.map(x => <li key={x} className="flex gap-2.5"><span className="text-slate-400 shrink-0 w-4 text-center">✕</span>{x}</li>)}</ul>
            </div>
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
            <span>Prototipe dengan data fiktif yang mengikuti sebaran Data Sampel BPJS Kesehatan 2024. Nama faskes dan semua laporan adalah rekaan; tidak ada data peserta JKN yang nyata. Bukan produk resmi BPJS Kesehatan.</span>
          </div>
        </div>
      </section>

      <footer className="bg-white border-t border-slate-200">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 py-9 space-y-2">
          <div className="text-xl font-extrabold">MATA<span className="text-emerald-700"> HATI</span></div>
          <div className="text-sm leading-relaxed text-slate-500">Prototipe Healthkathon BPJS Kesehatan 2026 · Data fiktif<br />Dikembangkan oleh Tim PUAN KARSA</div>
        </div>
      </footer>
    </div>
  );
};

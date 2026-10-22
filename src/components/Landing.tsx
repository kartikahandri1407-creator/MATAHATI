import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight, BrainCircuit, Building2, Calculator, CheckCircle2, ClipboardCheck, Clock, Eye, Lock, Scale, ShieldCheck,
  Smartphone, Sparkles, UserRound, Users, ChevronRight
} from 'lucide-react';
import { ROLES, Role } from '../data/roles';
import { LOS_REF_DEFAULT, SAMPLE_INFO } from '../data/refStats';

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

/** Muncul halus saat terlihat di layar. Tanpa gerak bila pengguna memilih mengurangi animasi. */
const Reveal: React.FC<{ children: React.ReactNode; className?: string; delay?: number }> = ({ children, className = '', delay = 0 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (typeof IntersectionObserver === 'undefined' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setOn(true); return; }
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { setOn(true); io.disconnect(); } }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    io.observe(el); return () => io.disconnect();
  }, []);
  return <div ref={ref} style={{ transitionDelay: `${delay}ms` }} className={`rv ${on ? 'rv-in' : ''} ${className}`}>{children}</div>;
};

const H2: React.FC<{ eyebrow: string; title: string; text?: string; light?: boolean }> = ({ eyebrow, title, text, light }) => (
  <div className="space-y-3 max-w-[900px]">
    <div className={`text-[12px] font-extrabold tracking-[0.18em] uppercase ${light ? 'text-matahari' : 'text-emerald-700'}`}>{eyebrow}</div>
    <h2 className={`text-[30px] sm:text-[42px] font-extrabold tracking-[-0.02em] leading-[1.1] ${light ? 'text-white' : 'text-tinta'}`}>{title}</h2>
    {text && <p className={`text-[17px] sm:text-lg leading-relaxed max-w-[720px] ${light ? 'text-[#c6d3ea]' : 'text-slate-600'}`}>{text}</p>}
  </div>
);

/** Alur lengkap: siapa mengerjakan apa. */
const FLOW: { who: string; title: string; text: string; Icon: React.ElementType; tone: string }[] = [
  { who: 'Peserta', title: 'Menjawab', text: 'Melihat layanan atas namanya, lalu menjawab satu pertanyaan: berapa yang benar-benar diterima?', Icon: Smartphone, tone: 'text-emerald-700 border-emerald-200 bg-emerald-50' },
  { who: 'Program', title: 'Membandingkan', text: 'Jawaban dicocokkan dengan klaim. Selisih dihitung oleh program, bukan ditebak AI.', Icon: Calculator, tone: 'text-sky-700 border-sky-200 bg-sky-50' },
  { who: 'Petugas', title: 'Memeriksa', text: 'Laporan masuk antrean berurutan prioritas. Petugas meminta konfirmasi faskes.', Icon: ClipboardCheck, tone: 'text-indigo-700 border-indigo-200 bg-indigo-50' },
  { who: 'Faskes', title: 'Menjelaskan', text: 'Menjawab dengan netral: sesuai catatan, stok kosong, atau salah catat.', Icon: Building2, tone: 'text-teal-700 border-teal-200 bg-teal-50' },
  { who: 'Peserta', title: 'Mendapat kabar', text: 'Memantau perkembangan laporannya sampai selesai.', Icon: UserRound, tone: 'text-emerald-700 border-emerald-200 bg-emerald-50' }
];

const ENTRY: { role: Role; title: string; text: string; cta: string; Icon: React.ElementType; primary?: boolean }[] = [
  { role: 'peserta', title: 'Cek dan pantau laporan', text: 'Lihat layanan atas nama Anda, jawab satu pertanyaan, lalu pantau perkembangannya.', cta: 'Masuk sebagai peserta', Icon: UserRound, primary: true },
  { role: 'petugas', title: 'Antrean prioritas', text: 'Laporan yang sudah dicocokkan dengan klaim dan diurutkan. Keputusan akhir ada pada petugas.', cta: 'Masuk sebagai petugas', Icon: ClipboardCheck },
  { role: 'faskes', title: 'Konfirmasi netral', text: 'Terima pertanyaan klarifikasi dan jawab langsung, tanpa identitas peserta dan tanpa praduga.', cta: 'Masuk sebagai faskes', Icon: Building2 }
];

/** Contoh cara kerja: cerita peserta -> fakta -> hitungan program -> keputusan manusia. */
type Seg = string | { hl: string };
const RECORDED = 5;
const STORIES: { id: string; label: string; segs: Seg[]; received: number | null }[] = [
  { id: 'baku', label: 'Bahasa baku', segs: ['Saya diberi resep 5 obat tetapi di apotek hanya menerima ', { hl: '2 obat' }, '.'], received: 2 },
  { id: 'santai', label: 'Bahasa santai', segs: ['resepnya 5 macam obat, tapi yang dikasih apotek ', { hl: 'cuma 2' }, ' doang'], received: 2 },
  { id: 'daerah', label: 'Bahasa daerah', segs: ['Resepnya 5 obat, tapi neng apotek aku ', { hl: 'mung entuk 2 obat' }, '.'], received: 2 },
  { id: 'lupa', label: 'Tidak ingat', segs: ['Obatnya banyak, tapi ', { hl: 'saya lupa berapa' }, ' yang dikasih apotek.'], received: null }
];

const STATS: { value: string; label: string }[] = [
  { value: '3', label: 'modus yang disasar: jumlah obat, tindakan yang tidak dilakukan, lama rawat' },
  { value: SAMPLE_INFO.rawatInapN.toLocaleString('id-ID'), label: 'kunjungan rawat inap Data Sampel 2024 sebagai pembanding lama rawat' },
  { value: '49', label: 'cerita uji untuk mengukur akurasi dan keadilan pembacaan AI' },
  { value: '0', label: 'nama atau nomor kartu peserta yang dikirim ke AI' }
];

const PRINCIPLES: { title: string; text: string; Icon: React.ElementType }[] = [
  { title: 'Tidak pernah menuduh', text: 'Sistem tidak pernah menyatakan ada kecurangan. Hasilnya selalu berupa prioritas pemeriksaan, disertai kemungkinan penjelasan lain.', Icon: ShieldCheck },
  { title: 'Satu laporan tidak cukup', text: 'Perhatian pada sebuah faskes baru naik bila tiga pelapor berbeda menyebut hal serupa. Laporan keliru atau iseng tidak menjatuhkan siapa pun.', Icon: Users },
  { title: 'Manusia yang memutuskan', text: 'AI membantu membaca cerita. Program menghitung. Keputusan tindak lanjut selalu ada pada petugas.', Icon: Scale }
];

export const Landing: React.FC<{ onEnter: (role: Role) => void }> = ({ onEnter }) => {
  const [received, setReceived] = useState<number | null>(null);
  const gap = received === null ? null : RECORDED - received;
  const [story, setStory] = useState(STORIES[0].id);
  const st = STORIES.find(s => s.id === story)!;
  const stGap = st.received === null ? null : RECORDED - st.received;

  return (
    <div className="min-h-screen bg-kertas text-tinta font-sans antialiased overflow-x-clip">
      {/* ===== Navigasi ===== */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-kertas/80 border-b border-slate-200/60">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 h-[68px] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-[21px] sm:text-2xl font-extrabold tracking-tight whitespace-nowrap">
            <span className="w-9 h-9 rounded-xl bg-tinta text-white grid place-items-center shadow-[0_8px_18px_-8px_rgba(10,42,94,.7)]"><Eye className="w-5 h-5" aria-hidden="true" /></span>
            <span>MATA <span className="text-emerald-700">HATI</span></span>
          </div>
          <nav className="flex items-center gap-x-7 text-[15px] font-semibold text-slate-600" aria-label="Navigasi halaman">
            <button type="button" onClick={() => scrollTo('alur')} className="hidden md:block hover:text-emerald-700">Alur kerja</button>
            <button type="button" onClick={() => scrollTo('ai')} className="hidden md:block hover:text-emerald-700">Peran AI</button>
            <button type="button" onClick={() => scrollTo('prinsip')} className="hidden md:block hover:text-emerald-700">Prinsip</button>
            <button type="button" onClick={() => scrollTo('peran')} className="h-11 px-4 sm:px-5 rounded-xl bg-tinta text-white text-sm sm:text-[15px] font-bold whitespace-nowrap hover:bg-[#0d3a80] transition-colors">Coba aplikasi</button>
          </nav>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section className="relative">
        <div className="absolute inset-0 -z-0 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-40 -left-40 w-[620px] h-[620px] rounded-full bg-emerald-200/40 blur-[110px]" />
          <div className="absolute -top-24 right-[-120px] w-[560px] h-[560px] rounded-full bg-matahari/25 blur-[120px]" />
          <div className="absolute inset-0 opacity-[.5] [background-image:radial-gradient(#b7c4d8_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_30%_20%,black,transparent_70%)]" />
        </div>
        <div className="relative max-w-[1200px] mx-auto px-5 sm:px-6 pt-10 sm:pt-14 pb-16 lg:pb-24 grid lg:grid-cols-[1.05fr_1fr] gap-14 lg:gap-10 items-center">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2.5 text-[13px] sm:text-[14px] font-bold text-emerald-800 bg-white/80 border border-emerald-200 rounded-full pl-3 pr-4 py-1.5 shadow-sm">
              <span className="relative flex w-2.5 h-2.5"><span className="absolute inline-flex w-full h-full rounded-full bg-emerald-500 opacity-60 animate-ping" /><span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-emerald-600" /></span>
              Konfirmasi layanan JKN untuk peserta
            </div>
            <h1 className="text-[40px] sm:text-[56px] lg:text-[66px] font-extrabold tracking-[-0.025em] leading-[1.06] [word-spacing:.04em]">
              <span className="block">Pasien tahu apa yang diterimanya.</span>
              <span className="block bg-gradient-to-r from-emerald-700 to-emerald-500 bg-clip-text text-transparent">Sekarang, sistem pun tahu.</span>
            </h1>
            <p className="text-[17px] sm:text-xl leading-relaxed text-slate-600 max-w-[540px]">
              Satu jawaban singkat dari peserta membantu BPJS Kesehatan menemukan layanan yang perlu dicek. Cukup dua menit, dan tidak untuk menuduh siapa pun.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 sm:gap-5">
              <button type="button" onClick={() => onEnter('peserta')} className="btn-primary h-14 px-8 text-[17px] flex items-center justify-center gap-2.5 hover:-translate-y-0.5 transition-transform">Mulai sebagai peserta <ArrowRight className="w-5 h-5" /></button>
              <button type="button" onClick={() => scrollTo('alur')} className="h-14 px-6 rounded-xl border-[1.5px] border-slate-300 bg-white/70 text-base font-bold hover:border-tinta flex items-center justify-center gap-2 transition-colors">Lihat cara kerjanya <ChevronRight className="w-4 h-4" /></button>
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2.5 text-[15px] text-slate-600">
              <li className="flex items-center gap-2"><Clock className="w-[18px] h-[18px] text-emerald-700" aria-hidden="true" />Dua menit</li>
              <li className="flex items-center gap-2"><Lock className="w-[18px] h-[18px] text-emerald-700" aria-hidden="true" />Identitas tidak dikirim ke AI</li>
              <li className="flex items-center gap-2"><ShieldCheck className="w-[18px] h-[18px] text-emerald-700" aria-hidden="true" />Tidak menuduh</li>
            </ul>
          </div>

          {/* Ponsel interaktif */}
          <div className="relative mx-auto w-full max-w-[350px] lg:justify-self-center">
            <span className="absolute -top-4 right-2 z-20 inline-flex items-center gap-1.5 text-[12px] font-extrabold text-tinta bg-matahari rounded-full px-3 py-1.5 shadow-[0_10px_24px_-10px_rgba(240,180,41,.9)] animate-bounce [animation-duration:2.4s]"><Sparkles className="w-3.5 h-3.5" aria-hidden="true" />Coba sendiri</span>

            <div className={`hidden xl:flex absolute -left-[170px] bottom-24 z-20 w-[210px] items-center gap-2.5 bg-white rounded-2xl px-4 py-3 shadow-[0_20px_40px_-18px_rgba(10,42,94,.45)] border border-slate-200 transition-all duration-500 ${gap !== null ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3'}`}>
              <span className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 grid place-items-center"><Calculator className="w-5 h-5" /></span>
              <span className="text-[13px] leading-tight font-bold">Selisih dihitung<br /><span className="font-medium text-slate-500">program, bukan AI</span></span>
            </div>
            <div className={`hidden xl:flex absolute -right-[170px] top-[132px] z-20 w-[210px] items-center gap-2.5 bg-white rounded-2xl px-4 py-3 shadow-[0_20px_40px_-18px_rgba(10,42,94,.45)] border border-slate-200 transition-all duration-500 delay-150 ${gap !== null ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-3'}`}>
              <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 grid place-items-center"><ClipboardCheck className="w-5 h-5" /></span>
              <span className="text-[13px] leading-tight font-bold">{gap === 0 ? 'Tidak ada tindak lanjut' : 'Diteruskan ke petugas'}<br /><span className="font-medium text-slate-500">{gap === 0 ? 'Sesuai catatan' : 'bukan untuk menuduh'}</span></span>
            </div>

            <div className="relative rounded-[2.7rem] bg-tinta p-[10px] shadow-[0_50px_90px_-30px_rgba(10,42,94,.7)]">
              <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-24 h-6 bg-tinta rounded-b-2xl z-10" aria-hidden="true" />
              <div className="rounded-[2.1rem] bg-slate-50 overflow-hidden" aria-label="Contoh layar aplikasi">
                <div className="h-8 pt-1 px-6 flex items-center justify-between text-[11px] font-bold text-slate-500 bg-white"><span>09.41</span><span className="flex gap-1" aria-hidden="true"><span className="w-3.5 h-2 rounded-sm bg-slate-400" /><span className="w-5 h-2 rounded-sm bg-slate-500" /></span></div>
                <div className="bg-emerald-700 text-white px-5 py-3.5">
                  <div className="text-[10px] font-bold tracking-[.18em] uppercase text-white/70">MATA HATI</div>
                  <div className="text-[17px] font-extrabold leading-tight">Layanan atas nama Anda</div>
                </div>
                <div className="p-4 space-y-4">
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                    <div>
                      <div className="text-lg font-extrabold leading-tight">RSUD Sehat Sentosa</div>
                      <div className="text-[13px] text-slate-500 mt-0.5">12 September 2026 · Rawat jalan</div>
                    </div>
                    <dl className="text-[13.5px] border-t border-dashed border-slate-300">
                      <div className="flex justify-between gap-3 py-2.5 border-b border-dashed border-slate-300"><dt className="text-slate-500">Layanan</dt><dd className="font-bold text-right">Obat tekanan darah · {RECORDED} item</dd></div>
                      <div className="flex justify-between gap-3 py-2.5"><dt className="text-slate-500">Dibayar program JKN</dt><dd className="font-bold">Rp 485.000</dd></div>
                    </dl>
                  </div>
                  <div>
                    <div className="text-[15px] font-extrabold" id="landing-tanya">Berapa obat yang Anda terima?</div>
                    <div className="mt-2.5 grid grid-cols-6 gap-1.5" role="group" aria-labelledby="landing-tanya">
                      {Array.from({ length: RECORDED + 1 }, (_, n) => (
                        <button key={n} type="button" aria-pressed={received === n} onClick={() => setReceived(n)}
                          className={'h-11 rounded-xl border-[1.5px] text-base font-bold transition-all active:scale-95 ' + (received === n ? 'bg-tinta border-tinta text-white shadow-[0_8px_16px_-8px_rgba(10,42,94,.8)]' : 'bg-white border-slate-300 text-tinta hover:border-tinta')}>{n}</button>
                      ))}
                    </div>
                  </div>
                  <div aria-live="polite" className={'rounded-2xl px-4 py-3.5 min-h-[88px] transition-colors duration-300 ' + (gap === null ? 'border-[1.5px] border-dashed border-slate-300 bg-white' : gap === 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-matahari-soft border border-amber-200')}>
                    {gap === null ? (
                      <div className="text-[13.5px] text-slate-500 leading-snug"><b className="block text-[15px] text-slate-700">Pilih salah satu angka</b>Hasilnya langsung terlihat di sini.</div>
                    ) : (
                      <div key={received} className="landing-pop">
                        <div className="text-[15px] font-extrabold">{gap === 0 ? 'Sesuai catatan' : `Selisih ${gap} item`}</div>
                        <div className="text-[13px] leading-snug text-slate-700 mt-0.5">{gap === 0 ? 'Tidak ada yang perlu diteruskan.' : 'Diteruskan ke petugas untuk dicek. Ini belum berarti ada yang salah.'}</div>
                      </div>
                    )}
                  </div>
                  <div className="text-[11px] text-center text-slate-400">Data contoh · prototipe</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Angka ===== */}
      <section className="bg-white border-y border-slate-200/70">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 py-10 grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 70} className="space-y-1.5">
              <div className="text-[38px] sm:text-5xl font-extrabold tracking-[-0.03em] text-tinta leading-none">{s.value}</div>
              <p className="text-[14px] leading-snug text-slate-500 max-w-[230px]">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== Alur ===== */}
      <section id="alur" className="bg-kertas scroll-mt-16">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 py-20 lg:py-28 space-y-14">
          <Reveal><H2 eyebrow="Alur kerja" title="Dari satu jawaban sampai kabar kembali" text="Lima tahap, empat pihak. Masing-masing hanya melihat bagiannya, dan setiap tahap tercatat sehingga posisi laporan selalu jelas. Bagi peserta, cukup jawab satu pertanyaan, selebihnya berjalan sendiri." /></Reveal>
          <ol className="relative grid md:grid-cols-5 gap-x-4 gap-y-8">
            <div className="hidden md:block absolute left-[10%] right-[10%] top-[34px] h-[3px] rounded-full bg-gradient-to-r from-emerald-300 via-sky-300 to-emerald-300" aria-hidden="true" />
            <div className="md:hidden absolute left-[33px] top-6 bottom-6 w-[3px] rounded-full bg-gradient-to-b from-emerald-300 via-sky-300 to-emerald-300" aria-hidden="true" />
            {FLOW.map((f, i) => (
              <li key={i}>
                <Reveal delay={i * 90} className="relative flex md:flex-col md:items-center gap-4 md:gap-3.5 md:text-center">
                  <span className={`relative z-10 shrink-0 w-[68px] h-[68px] rounded-[22px] border-2 grid place-items-center bg-white shadow-[0_14px_28px_-16px_rgba(10,42,94,.55)] ${f.tone}`}>
                    <f.Icon className="w-7 h-7" aria-hidden="true" />
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-tinta text-white text-[11px] font-extrabold grid place-items-center border-2 border-kertas">{i + 1}</span>
                  </span>
                  <div className="space-y-1 pt-1 md:pt-0">
                    <div className="text-[11px] font-extrabold tracking-[.14em] uppercase text-slate-500">{f.who}</div>
                    <div className="text-xl font-extrabold leading-tight">{f.title}</div>
                    <p className="text-[14.5px] leading-relaxed text-slate-600">{f.text}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ===== Peran AI (demo) ===== */}
      <section id="ai" className="bg-white scroll-mt-16">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 py-20 lg:py-28 space-y-12">
          <Reveal><H2 eyebrow="Peran AI" title="AI membaca cerita. Program menghitung. Manusia memutuskan." text="Pilih satu cerita peserta di bawah dan lihat bagaimana kalimat sehari-hari berubah menjadi fakta yang bisa diperiksa, tanpa AI menebak angka." /></Reveal>

          <Reveal>
            <div className="rounded-[28px] border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-5 sm:p-8 shadow-[0_30px_60px_-36px_rgba(10,42,94,.35)] space-y-7">
              <div role="tablist" aria-label="Contoh cerita peserta" className="flex flex-wrap gap-2">
                {STORIES.map(s => (
                  <button key={s.id} role="tab" aria-selected={story === s.id} type="button" onClick={() => setStory(s.id)}
                    className={'h-10 px-4 rounded-full text-sm font-bold border transition-colors ' + (story === s.id ? 'bg-tinta text-white border-tinta' : 'bg-white text-slate-600 border-slate-300 hover:border-tinta')}>{s.label}</button>
                ))}
              </div>

              <div key={story} className="grid lg:grid-cols-4 gap-4 lg:gap-6 items-stretch landing-pop">
                <div className="relative rounded-2xl bg-white border border-slate-200 p-5 space-y-2.5">
                  <div className="text-[11px] font-extrabold tracking-[.14em] uppercase text-slate-500">1 · Cerita peserta</div>
                  <p className="text-[17px] leading-relaxed text-slate-800">“{st.segs.map((x, i) => typeof x === 'string' ? <span key={i}>{x}</span> : <mark key={i} className="bg-matahari/40 rounded px-1 py-0.5 text-tinta font-bold">{x.hl}</mark>)}”</p>
                  <div className="text-xs text-slate-500">Tercatat di klaim: {RECORDED} obat</div>
                  <Arrow />
                </div>
                <div className="relative rounded-2xl bg-emerald-50/70 border border-emerald-200 p-5 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-extrabold tracking-[.14em] uppercase text-emerald-800"><BrainCircuit className="w-4 h-4" aria-hidden="true" />2 · AI membaca</div>
                  <div className="text-sm text-slate-600">Fakta yang diambil dari cerita:</div>
                  <div className="inline-flex items-center rounded-lg bg-white border border-emerald-300 px-3 py-1.5 text-[15px] font-extrabold text-emerald-900">{st.received === null ? 'jumlah diterima: tidak disebutkan' : `jumlah diterima: ${st.received} obat`}</div>
                  <Arrow />
                </div>
                <div className="relative rounded-2xl bg-sky-50/70 border border-sky-200 p-5 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-extrabold tracking-[.14em] uppercase text-sky-800"><Calculator className="w-4 h-4" aria-hidden="true" />3 · Program menghitung</div>
                  {stGap === null ? (
                    <p className="text-[15px] leading-snug text-slate-700"><b>Tidak ada angka untuk dibandingkan.</b> Selisih tidak dikarang.</p>
                  ) : (
                    <div className="font-mono text-[15px] text-tinta leading-relaxed"><div>{RECORDED} tercatat − {st.received} diterima</div><div className="text-lg font-extrabold">= selisih {stGap} obat</div></div>
                  )}
                  <Arrow />
                </div>
                <div className="rounded-2xl bg-tinta text-white p-5 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-extrabold tracking-[.14em] uppercase text-matahari"><ClipboardCheck className="w-4 h-4" aria-hidden="true" />4 · Petugas</div>
                  <p className="text-[15px] leading-snug text-[#dbe5f5]">{stGap === null ? <><b className="text-white">Info belum cukup.</b> Peserta diminta menambah keterangan.</> : <><b className="text-white">Masuk antrean prioritas.</b> Petugas memeriksa, bukan memvonis.</>}</p>
                </div>
              </div>
              <p className="text-[12.5px] text-slate-500">Contoh cara kerja dengan satu klaim fiktif. Di aplikasi, pembacaan dilakukan Gemini, lalu program menghitung ulang dan membatalkan hasil bila bertentangan.</p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-5">
            <Reveal className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-6 sm:p-7 space-y-3.5 h-full">
              <div className="flex items-center gap-2.5 text-xl font-extrabold text-emerald-900"><BrainCircuit className="w-6 h-6" aria-hidden="true" />AI dipakai untuk</div>
              <ul className="space-y-2.5 text-[15.5px] leading-relaxed text-slate-700">
                <li className="flex gap-2.5"><CheckCircle2 className="w-[18px] h-[18px] text-emerald-700 shrink-0 mt-1" />Memahami cerita peserta dalam bahasa sehari-hari, termasuk bahasa daerah.</li>
                <li className="flex gap-2.5"><CheckCircle2 className="w-[18px] h-[18px] text-emerald-700 shrink-0 mt-1" />Menerjemahkan pertanyaan petugas ("faskes mana yang paling perlu dilihat?") menjadi pencarian terstruktur.</li>
                <li className="flex gap-2.5"><CheckCircle2 className="w-[18px] h-[18px] text-emerald-700 shrink-0 mt-1" />Membantu menyusun draf surat konfirmasi yang netral.</li>
              </ul>
            </Reveal>
            <Reveal delay={90} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-7 space-y-3.5 h-full">
              <div className="flex items-center gap-2.5 text-xl font-extrabold text-tinta"><Scale className="w-6 h-6" aria-hidden="true" />AI tidak dipakai untuk</div>
              <ul className="space-y-2.5 text-[15.5px] leading-relaxed text-slate-700">
                <li className="flex gap-2.5"><span className="text-slate-400 shrink-0 w-[18px] text-center mt-px">✕</span>Menghitung selisih dan angka di layar. Itu dikerjakan program dan bisa diperiksa ulang.</li>
                <li className="flex gap-2.5"><span className="text-slate-400 shrink-0 w-[18px] text-center mt-px">✕</span>Menyimpulkan ada kecurangan. Hasilnya selalu prioritas pemeriksaan.</li>
                <li className="flex gap-2.5"><span className="text-slate-400 shrink-0 w-[18px] text-center mt-px">✕</span>Memutuskan tindak lanjut. Itu hak petugas.</li>
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===== Pilih peran ===== */}
      <section id="peran" className="relative bg-tinta text-white scroll-mt-16 overflow-hidden">
        <div className="absolute -top-32 right-[-120px] w-[520px] h-[520px] rounded-full bg-emerald-500/20 blur-[120px] pointer-events-none" aria-hidden="true" />
        <div className="relative max-w-[1200px] mx-auto px-5 sm:px-6 py-20 lg:py-28 space-y-12">
          <Reveal><H2 light eyebrow="Coba sekarang" title="Pilih peran untuk mencoba" text="Prototipe ini belum memakai login, jadi Anda memilih peran sendiri. Setiap peran hanya melihat menu miliknya, dan penanda di bagian atas selalu menunjukkan Anda sedang masuk sebagai siapa." /></Reveal>
          <div className="grid md:grid-cols-3 gap-5 lg:gap-6">
            {ENTRY.map((r, i) => {
              const d = ROLES[r.role];
              return (
                <Reveal key={r.role} delay={i * 90} className="h-full">
                  <div className="h-full bg-[#123572] hover:bg-[#15397a] transition-colors border border-white/10 rounded-[22px] p-6 sm:p-7 flex flex-col gap-3.5">
                    <div className="flex items-center gap-2.5"><span className="w-9 h-9 rounded-xl bg-white/10 grid place-items-center"><r.Icon className="w-5 h-5 text-matahari" aria-hidden="true" /></span><span className="text-[12px] font-extrabold tracking-[0.14em] text-matahari uppercase">{d.label}</span></div>
                    <div className="text-2xl font-extrabold leading-tight">{r.title}</div>
                    <p className="text-[15.5px] leading-relaxed text-[#c6d3ea]">{r.text}</p>
                    <ul className="grow space-y-1.5 text-sm text-[#c6d3ea]">
                      {d.sees.map(x => <li key={x} className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />{x}</li>)}
                      <li className="flex gap-2 text-white/55"><span className="w-4 text-center shrink-0">✕</span>Tidak melihat: {d.notSees}</li>
                    </ul>
                    <button type="button" onClick={() => onEnter(r.role)}
                      className={'h-[52px] rounded-xl text-base font-extrabold transition ' + (r.primary ? 'bg-matahari text-tinta hover:brightness-95' : 'border-[1.5px] border-white text-white hover:bg-white/10')}>{r.cta}</button>
                  </div>
                </Reveal>);
            })}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[#c6d3ea]">
            <Users className="w-4 h-4" aria-hidden="true" />
            <span>Tim pengelola (data klaim, uji kualitas AI, alat demo) punya peran sendiri.</span>
            <button type="button" onClick={() => onEnter('pengelola')} className="font-bold underline underline-offset-4 text-white hover:text-matahari">Masuk sebagai pengelola</button>
          </div>
        </div>
      </section>

      {/* ===== Prinsip ===== */}
      <section id="prinsip" className="scroll-mt-16">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 py-20 lg:py-28 space-y-12">
          <Reveal><H2 eyebrow="Prinsip" title="Dirancang agar adil bagi semua pihak" /></Reveal>
          <ul className="grid md:grid-cols-3 gap-5 lg:gap-6">
            {PRINCIPLES.map((p, i) => (
              <li key={p.title}>
                <Reveal delay={i * 90} className="card card-hover p-6 sm:p-7 space-y-3.5 h-full">
                  <span className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 grid place-items-center"><p.Icon className="w-6 h-6" aria-hidden="true" /></span>
                  <div className="text-xl font-extrabold">{p.title}</div>
                  <p className="text-[15.5px] leading-relaxed text-slate-600">{p.text}</p>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ===== Penutup ===== */}
      <section className="px-5 sm:px-6 pb-20">
        <Reveal className="max-w-[1200px] mx-auto rounded-[32px] hero text-white px-7 sm:px-14 py-12 sm:py-16 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-3 max-w-[640px]">
            <h2 className="text-[30px] sm:text-[40px] font-extrabold tracking-[-0.02em] leading-[1.1]">Dua menit untuk melihat bagaimana semuanya bekerja.</h2>
            <p className="text-lg text-white/80 leading-relaxed">Mulai sebagai peserta, lalu ganti peran untuk melihat sisi petugas dan faskes.</p>
          </div>
          <button type="button" onClick={() => onEnter('peserta')} className="shrink-0 h-14 px-8 rounded-xl bg-matahari text-tinta text-[17px] font-extrabold flex items-center justify-center gap-2.5 hover:brightness-95 hover:-translate-y-0.5 transition">Mulai sebagai peserta <ArrowRight className="w-5 h-5" /></button>
        </Reveal>
      </section>

      <footer className="bg-white border-t border-slate-200">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 py-10 grid md:grid-cols-[1fr_auto] gap-6 items-start">
          <div className="space-y-2">
            <div className="text-xl font-extrabold">MATA<span className="text-emerald-700"> HATI</span></div>
            <p className="text-sm leading-relaxed text-slate-500 max-w-[640px]">Prototipe Healthkathon BPJS Kesehatan 2026 oleh Tim PUAN KARSA. Klaim dan cerita adalah data fiktif yang mengikuti sebaran Data Sampel BPJS Kesehatan 2024; nama faskes rekaan, tidak ada data peserta JKN yang nyata. Bukan produk resmi BPJS Kesehatan.</p>
          </div>
          <div className="text-sm text-slate-500 md:text-right">Pembanding lama rawat: median {LOS_REF_DEFAULT.median} hari, persentil 90 = {LOS_REF_DEFAULT.p90} hari (seluruh diagnosis).</div>
        </div>
      </footer>
    </div>
  );
};

const Arrow: React.FC = () => (
  <span className="hidden lg:grid absolute top-1/2 -right-[22px] -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm place-items-center text-slate-400" aria-hidden="true"><ChevronRight className="w-4 h-4" /></span>
);

import React, { useMemo } from 'react';
import { ArrowRight, BarChart3, CheckCircle2, Cpu, Database, FileText, Server, Wrench } from 'lucide-react';
import { CaseRecord, DummyClaim, Facility } from '../types/matahati';
import { STAGES, STAGE_LABEL, countByStage } from '../data/stage';
import { TabId } from '../data/roles';
import { summarizeOutcomes } from '../data/outcomes';
import { PageHeader } from './PageHeader';

interface Props {
  cases: CaseRecord[]; claims: DummyClaim[]; facilities: Facility[];
  backend: 'checking' | 'database' | 'browser'; geminiConfigured: boolean | null; isDemoMode: boolean;
  go: (tab: TabId) => void;
}

const pct = (a: number, b: number) => (b === 0 ? '0%' : `${Math.round((a / b) * 100)}%`);
const STAGE_BAR: Record<string, string> = {
  SESUAI: 'bg-emerald-500', BARU: 'bg-amber-400', DIPERIKSA: 'bg-sky-400', MENUNGGU_FASKES: 'bg-indigo-400',
  JAWABAN_DITERIMA: 'bg-teal-500', DITERUSKAN: 'bg-rose-500', DITUTUP: 'bg-slate-400'
};

const Tile: React.FC<{ value: React.ReactNode; label: string; hint?: string }> = ({ value, label, hint }) => (
  <div className="card p-4">
    <div className="text-3xl font-extrabold tracking-tight text-tinta leading-none">{value}</div>
    <div className="text-sm font-semibold text-slate-800 mt-2">{label}</div>
    {hint && <div className="text-xs text-slate-500 mt-0.5 leading-snug">{hint}</div>}
  </div>
);

export const AdminOverview: React.FC<Props> = ({ cases, claims, facilities, backend, geminiConfigured, isDemoMode, go }) => {
  const by = useMemo(() => countByStage(cases), [cases]);
  const out = useMemo(() => summarizeOutcomes(cases), [cases]);
  const answeredKeys = new Set(cases.map(c => c.claim_key));
  const covered = claims.filter(c => answeredKeys.has(c.claim_key)).length;
  const differing = cases.filter(c => c.status === 'RISK_SIGNAL' || c.status === 'POTENTIAL_DISCREPANCY').length;
  const aiOn = !isDemoMode && geminiConfigured === true;

  const SHORTCUTS: { tab: TabId; title: string; text: string; Icon: React.ElementType }[] = [
    { tab: 'master', title: 'Data Klaim', text: 'Tambah, ubah, atau impor klaim dan faskes pembanding.', Icon: Database },
    { tab: 'eval', title: 'Uji Kualitas AI', text: 'Akurasi, keadilan, dan simulasi skala pembacaan AI.', Icon: BarChart3 },
    { tab: 'tools', title: 'Alat Demo', text: 'Siapkan atau ulangi peragaan, ekspor antrean.', Icon: Wrench }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-7">
      <PageHeader eyebrow="Pengelola Sistem" title="Ringkasan Sistem" text="Gambaran seluruh sistem dalam satu layar: data pembanding, partisipasi peserta, posisi setiap laporan, dan status AI. Semua angka dihitung dari data yang sedang ada." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Tile value={claims.length.toLocaleString('id-ID')} label="Klaim pembanding" hint={`dari ${facilities.length} faskes`} />
        <Tile value={cases.length.toLocaleString('id-ID')} label="Laporan peserta" hint="semua tahap" />
        <Tile value={pct(covered, claims.length)} label="Layanan yang dijawab peserta" hint={`${covered} dari ${claims.length} klaim`} />
        <Tile value={differing.toLocaleString('id-ID')} label="Berbeda dari catatan" hint={`${pct(differing, cases.length)} dari laporan; belum berarti ada yang salah`} />
      </div>

      <section className="card p-5 sm:p-6 space-y-4" aria-label="Posisi laporan">
        <div>
          <h3 className="text-lg font-extrabold text-tinta">Di mana posisi setiap laporan</h3>
          <p className="text-sm text-slate-600 mt-0.5">Satu laporan berada di tepat satu tahap. Jumlah semua tahap sama dengan total laporan ({cases.length}).</p>
        </div>
        {cases.length > 0 ? (
          <>
            <div className="flex h-3.5 rounded-full overflow-hidden bg-slate-100" role="img" aria-label="Sebaran laporan per tahap">
              {STAGES.filter(s => by[s] > 0).map(s => <span key={s} className={STAGE_BAR[s]} style={{ width: `${(by[s] / cases.length) * 100}%` }} title={`${STAGE_LABEL[s]}: ${by[s]}`} />)}
            </div>
            <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2 text-sm">
              {STAGES.map(s => (
                <li key={s} className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-slate-700"><span className={`w-2.5 h-2.5 rounded-full ${STAGE_BAR[s]}`} />{STAGE_LABEL[s]}</span><b className="text-tinta">{by[s]}</b></li>
              ))}
            </ul>
          </>
        ) : <p className="text-sm text-slate-500">Belum ada laporan.</p>}
      </section>

      <div className="grid lg:grid-cols-2 gap-5">
        <section className="card p-5 sm:p-6 space-y-3.5" aria-label="Indikator">
          <h3 className="text-lg font-extrabold text-tinta">Indikator yang akan dilacak saat uji coba</h3>
          <p className="text-sm text-slate-600">Ukuran keberhasilan sudah dihitung dari data demo, jadi tinggal diganti dengan data uji coba terbatas.</p>
          <ul className="space-y-2.5 text-sm">
            <li className="flex items-start justify-between gap-4"><span className="text-slate-700">Partisipasi peserta<br /><span className="text-xs text-slate-500">layanan yang dijawab dibanding seluruh klaim</span></span><b className="text-tinta text-lg">{pct(covered, claims.length)}</b></li>
            <li className="flex items-start justify-between gap-4"><span className="text-slate-700">Jawaban faskes yang berupa penjelasan wajar<br /><span className="text-xs text-slate-500">sesuai catatan, stok kosong, atau layanan di tempat lain</span></span><b className="text-tinta text-lg">{out.faskesAnswered ? `${out.benignAnswers}/${out.faskesAnswered}` : '–'}</b></li>
            <li className="flex items-start justify-between gap-4"><span className="text-slate-700">Kasus diteruskan ke pemeriksaan lapangan<br /><span className="text-xs text-slate-500">dibanding seluruh laporan</span></span><b className="text-tinta text-lg">{out.escalated}/{cases.length}</b></li>
            <li className="flex items-start justify-between gap-4"><span className="text-slate-700">Kasus selesai tanpa tindak lanjut<br /><span className="text-xs text-slate-500">ditutup petugas atau sesuai catatan</span></span><b className="text-tinta text-lg">{by.DITUTUP + by.SESUAI}/{cases.length}</b></li>
          </ul>
        </section>

        <section className="card p-5 sm:p-6 space-y-3.5" aria-label="Status layanan">
          <h3 className="text-lg font-extrabold text-tinta">Status layanan</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-3"><span className={`w-9 h-9 rounded-xl grid place-items-center ${aiOn ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}><Cpu className="w-5 h-5" /></span><span><b className="text-slate-900">{aiOn ? 'AI (Gemini) aktif' : 'Mesin aturan lokal'}</b><br /><span className="text-xs text-slate-500">{aiOn ? 'Cerita peserta dibaca Gemini, lalu dihitung ulang oleh program.' : isDemoMode ? 'Mode mesin aturan dipilih manual.' : 'AI belum tersedia di server ini, memakai mesin cadangan.'}</span></span></li>
            <li className="flex items-center gap-3"><span className={`w-9 h-9 rounded-xl grid place-items-center ${backend === 'database' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}><Server className="w-5 h-5" /></span><span><b className="text-slate-900">{backend === 'database' ? 'Database server' : backend === 'browser' ? 'Penyimpanan peramban' : 'Memeriksa penyimpanan...'}</b><br /><span className="text-xs text-slate-500">{backend === 'database' ? 'Data dibagikan ke semua peran dan perangkat.' : 'Data hanya tersimpan di peramban ini.'}</span></span></li>
            <li className="flex items-center gap-3"><span className="w-9 h-9 rounded-xl grid place-items-center bg-emerald-50 text-emerald-700"><CheckCircle2 className="w-5 h-5" /></span><span><b className="text-slate-900">Identitas peserta tidak dikirim ke AI</b><br /><span className="text-xs text-slate-500">Nama dan nomor kartu tidak dimasukkan ke permintaan AI.</span></span></li>
          </ul>
        </section>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {SHORTCUTS.map(x => (
          <button key={x.tab} type="button" onClick={() => go(x.tab)} className="card card-hover p-5 text-left space-y-2 group">
            <span className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 grid place-items-center"><x.Icon className="w-5 h-5" /></span>
            <div className="font-extrabold text-tinta flex items-center gap-1.5">{x.title}<ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" /></div>
            <p className="text-sm text-slate-600 leading-snug">{x.text}</p>
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />Halaman ini hanya untuk Pengelola. Tidak memuat cerita atau identitas peserta.</p>
    </div>
  );
};

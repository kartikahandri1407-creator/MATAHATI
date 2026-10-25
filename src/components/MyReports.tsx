import React from 'react';
import { CaseRecord, DummyClaim } from '../types/matahati';
import { SCENARIO_LABEL, answerText, claimSummary } from '../data/claimUtils';
import { PESERTA_STEPS, caseTimeline, caseStage, pesertaMaySeeComparison, pesertaProgress } from '../data/stage';
import { fmtTanggal, fmtWaktu } from '../data/format';
import { PageHeader } from './PageHeader';
import { Timeline } from './Timeline';
import { Check, FilePlus2, Lock } from 'lucide-react';

interface Props {
  cases: CaseRecord[];
  claims: DummyClaim[];
  onNew: () => void;
}

const Stepper: React.FC<{ step: number }> = ({ step }) => (
  <ol className="grid grid-cols-4 gap-1 mt-4" aria-label="Tahapan laporan">
    {PESERTA_STEPS.map((label, i) => {
      const done = i < step || (i === step && step === 3);
      const current = i === step && step !== 3;
      return (
        <li key={label} className="relative flex flex-col items-center text-center">
          {i > 0 && <span className={`absolute top-3.5 right-1/2 w-full h-0.5 -z-0 ${i <= step ? 'bg-emerald-600' : 'bg-slate-200'}`} />}
          <span className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${done ? 'bg-emerald-600 border-emerald-600 text-white' : current ? 'bg-white border-emerald-600 text-emerald-700 ring-4 ring-emerald-100' : 'bg-white border-slate-300 text-slate-400'}`}>
            {done ? <Check className="w-4 h-4" strokeWidth={3} /> : i + 1}
          </span>
          <span className={`mt-1.5 text-[11px] leading-tight ${current || done ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>{label}</span>
        </li>
      );
    })}
  </ol>
);

export const MyReports: React.FC<Props> = ({ cases, claims, onNew }) => {
  const list = [...cases].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <PageHeader eyebrow="Peserta JKN" title="Laporan Saya" text="Pantau apa yang terjadi setelah Anda menjawab. Anda tidak perlu menunggu di depan loket." />
      {list.length > 0 && (
        <div className="grid grid-cols-3 gap-3 text-center" aria-label="Ringkasan laporan">
          <div className="card p-3"><div className="text-2xl font-extrabold text-tinta">{list.length}</div><div className="text-xs text-slate-600">laporan</div></div>
          <div className="card p-3"><div className="text-2xl font-extrabold text-amber-700">{list.filter(c => !pesertaProgress(c).done).length}</div><div className="text-xs text-slate-600">dalam proses</div></div>
          <div className="card p-3"><div className="text-2xl font-extrabold text-emerald-700">{list.filter(c => pesertaProgress(c).done).length}</div><div className="text-xs text-slate-600">selesai</div></div>
        </div>
      )}

      {list.length === 0 ? (
        <div className="card p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto"><FilePlus2 className="w-6 h-6" /></div>
          <h3 className="font-bold text-slate-900">Belum ada laporan</h3>
          <p className="text-sm text-slate-600">Setelah berobat, cek apa yang tercatat atas nama Anda. Cukup satu pertanyaan.</p>
          <button type="button" onClick={onNew} className="btn-primary mt-2 h-11 px-5 text-sm">Cek layanan saya</button>
        </div>
      ) : (
        <ul className="space-y-4">
          {list.map(c => {
            const claim = claims.find(x => x.claim_key === c.claim_key);
            const p = pesertaProgress(c);
            const tone = p.tone === 'ok' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : p.tone === 'info' ? 'bg-matahari-soft text-amber-900 border-amber-200' : 'bg-slate-50 text-slate-800 border-slate-200';
            return (
              <li key={c.case_id} className="card card-hover p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-slate-500">{claim ? SCENARIO_LABEL[claim.scenario] : 'Layanan'} · {fmtTanggal(c.service_date)}</div>
                    <div className="font-bold text-slate-900 truncate">{c.facility_name}</div>
                  </div>
                  <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border ${tone}`}>{p.headline}</span>
                </div>
                <Stepper step={p.step} />
                <p className="mt-4 text-sm text-slate-700 leading-relaxed">{p.message}</p>
                <details className="mt-3 group">
                  <summary className="cursor-pointer text-sm font-semibold text-emerald-800 select-none list-none flex items-center gap-1"><span className="group-open:rotate-90 transition-transform inline-block">›</span>Lihat rincian dan jejak laporan</summary>
                  <div className="mt-3 space-y-4">
                    {pesertaMaySeeComparison(c) && claim ? (
                      <div>
                        <div className="text-[11px] font-extrabold tracking-[.14em] uppercase text-slate-500">Perbandingan yang diperiksa petugas</div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3"><div className="text-xs text-slate-500">Tercatat di klaim</div><div className="font-bold text-tinta mt-0.5">{claimSummary(claim)}</div></div>
                          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3"><div className="text-xs text-slate-500">Jawaban Anda</div><div className="font-bold text-tinta mt-0.5">{answerText(c.patient_evidence, claim.scenario)}</div></div>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">Perbedaan belum berarti ada yang salah. Bisa jadi salah catat atau stok kosong.</p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">Rincian perbandingan tersedia setelah petugas memeriksa laporan ini. Saat ini baru hasil perkiraan otomatis.</div>
                    )}
                    <div className="pl-1"><Timeline events={caseTimeline(c, 'peserta')} /></div>
                  </div>
                </details>
                <div className="mt-3 pt-3 border-t border-dashed border-slate-300 flex items-center justify-between text-xs text-slate-500">
                  <span>Dikirim {fmtTanggal(c.created_at)}{(() => { const ev = caseTimeline(c, 'peserta'); const last = ev[ev.length - 1]; return last && ev.length > 1 ? ` · diperbarui ${fmtWaktu(last.at)}` : ''; })()}</span>
                  <span className="font-mono">{c.case_id}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="card flex gap-3 items-start p-4 text-sm text-slate-600">
        <Lock className="w-4 h-4 mt-0.5 text-emerald-700 shrink-0" />
        <p>Prototipe ini belum memakai login, jadi semua laporan pada demo ditampilkan di sini. Pada produksi, Anda hanya melihat laporan akun Anda sendiri. Nama dan nomor kartu Anda tidak dikirim ke faskes dan tidak masuk ke AI. Laporan Anda dihitung bersama laporan lain, bukan sebagai tuduhan.</p>
      </div>
    </div>
  );
};

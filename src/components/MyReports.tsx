import React from 'react';
import { CaseRecord, DummyClaim } from '../types/matahati';
import { SCENARIO_LABEL } from '../data/claimUtils';
import { PESERTA_STEPS, pesertaProgress } from '../data/workflow';
import { Check, FilePlus2, Lock } from 'lucide-react';

interface Props {
  cases: CaseRecord[];
  claims: DummyClaim[];
  onNew: () => void;
}

const fmtDate = (iso: string) => {
  try { return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return iso; }
};

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
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-tinta">Laporan Saya</h2>
        <p className="text-slate-600 mt-1">Pantau apa yang terjadi setelah Anda menjawab. Anda tidak perlu menunggu di depan loket.</p>
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto"><FilePlus2 className="w-6 h-6" /></div>
          <h3 className="font-bold text-slate-900">Belum ada laporan</h3>
          <p className="text-sm text-slate-600">Setelah berobat, cek apa yang tercatat atas nama Anda. Cukup satu pertanyaan.</p>
          <button type="button" onClick={onNew} className="mt-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold">Cek layanan saya</button>
        </div>
      ) : (
        <ul className="space-y-4">
          {list.map(c => {
            const claim = claims.find(x => x.claim_key === c.claim_key);
            const p = pesertaProgress(c);
            const tone = p.tone === 'ok' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : p.tone === 'info' ? 'bg-matahari-soft text-amber-900 border-amber-200' : 'bg-slate-50 text-slate-800 border-slate-200';
            return (
              <li key={c.case_id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-[0_1px_0_rgba(15,46,43,.04)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-slate-500">{claim ? SCENARIO_LABEL[claim.scenario] : 'Layanan'} · {c.service_date}</div>
                    <div className="font-bold text-slate-900 truncate">{c.facility_name}</div>
                  </div>
                  <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border ${tone}`}>{p.headline}</span>
                </div>
                <Stepper step={p.step} />
                <p className="mt-4 text-sm text-slate-700 leading-relaxed">{p.message}</p>
                <div className="mt-3 pt-3 border-t border-dashed border-slate-300 flex items-center justify-between text-xs text-slate-500">
                  <span>Dikirim {fmtDate(c.created_at)}</span>
                  <span className="font-mono">{c.case_id}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex gap-3 items-start bg-white rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">
        <Lock className="w-4 h-4 mt-0.5 text-emerald-700 shrink-0" />
        <p>Nama dan nomor kartu Anda tidak dikirim ke faskes dan tidak masuk ke AI. Laporan Anda dihitung bersama laporan lain, bukan sebagai tuduhan.</p>
      </div>
    </div>
  );
};

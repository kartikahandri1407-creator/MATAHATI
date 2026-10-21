import React, { useState } from 'react';
import { Loader2, Send, Sparkles } from 'lucide-react';
import { CaseRecord, FacilityPattern } from '../types/matahati';
import { ASK_EXAMPLES } from '../services/askPlanCore';
import { AskAnswer, executePlan } from '../services/askExecute';
import { planQuestion } from '../ai/askClient';

interface Props {
  cases: CaseRecord[];
  patterns: FacilityPattern[];
  scoreOf: (caseId: string) => number;
  onOpenCase: (c: CaseRecord) => void;
}

/** Tanya-jawab untuk petugas. AI menerjemahkan pertanyaan; program menghitung jawabannya. */
export const AskPanel: React.FC<Props> = ({ cases, patterns, scoreOf, onOpenCase }) => {
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ q: string; answer: AskAnswer; source: 'AI' | 'LOKAL'; reason?: string } | null>(null);

  const ask = async (text: string) => {
    const question = text.trim();
    if (question.length < 3 || busy) return;
    setBusy(true);
    const { plan, source, reason } = await planQuestion(question);
    setRes({ q: question, answer: executePlan(plan, { cases, patterns, scoreOf }), source, reason });
    setBusy(false);
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3" aria-label="Tanya antrean">
      <div className="flex items-center gap-2">
        <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center"><Sparkles className="w-4 h-4" /></span>
        <div>
          <h3 className="text-base font-bold text-tinta leading-tight">Tanya antrean</h3>
          <p className="text-xs text-slate-500">Tulis dengan bahasa biasa. AI memahami pertanyaannya, program yang menghitung jawabannya.</p>
        </div>
      </div>
      <form className="flex gap-2" onSubmit={e => { e.preventDefault(); ask(q); }}>
        <input value={q} onChange={e => setQ(e.target.value)} maxLength={300} placeholder="Contoh: faskes mana yang laporan jumlah obatnya paling banyak?" aria-label="Pertanyaan untuk antrean"
          className="flex-1 min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-700" />
        <button type="submit" disabled={busy || q.trim().length < 3} className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-sm font-semibold flex items-center gap-1.5">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}Tanya
        </button>
      </form>
      <div className="flex flex-wrap gap-1.5">
        {ASK_EXAMPLES.map(e => (
          <button key={e} type="button" onClick={() => { setQ(e); ask(e); }} className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200">{e}</button>
        ))}
      </div>

      {res && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2" role="status" aria-live="polite">
          <div className="text-xs text-slate-500">Pertanyaan: “{res.q}”</div>
          <div className="font-bold text-tinta">{res.answer.title}</div>
          <p className="text-sm text-slate-700">{res.answer.summary}</p>
          {res.answer.rows.length > 0 && (
            <ul className="divide-y divide-slate-200 rounded-lg bg-white border border-slate-200">
              {res.answer.rows.map((r, i) => {
                const target = r.caseId ? cases.find(c => c.case_id === r.caseId) : undefined;
                return (
                  <li key={i} className="px-3 py-2 text-sm flex items-center justify-between gap-3">
                    <span className="min-w-0 text-slate-800">{r.label}</span>
                    <span className="flex items-center gap-2 shrink-0">
                      <span className="text-slate-600 text-right">{r.value}</span>
                      {target && <button type="button" onClick={() => onOpenCase(target)} className="text-xs font-semibold text-emerald-800 hover:underline">Buka</button>}
                    </span>
                  </li>);
              })}
            </ul>)}
          <p className="text-[11px] text-slate-500">
            {res.source === 'AI' ? 'Pertanyaan dipahami oleh AI.' : `Pertanyaan dipahami oleh mesin lokal (AI tidak tersedia${res.reason ? `: ${res.reason}` : ''}).`} {res.answer.method}
          </p>
        </div>
      )}
    </section>
  );
};

import React from 'react';
import { PriorityScore } from '../services/priorityScore';
import { PRIORITY_LABEL } from '../data/workflow';

const TONE = { HIGH: 'bg-rose-50 text-rose-800 border-rose-200', MEDIUM: 'bg-amber-50 text-amber-900 border-amber-200', LOW: 'bg-slate-100 text-slate-700 border-slate-200' } as const;
const BAR = { HIGH: 'bg-rose-600', MEDIUM: 'bg-amber-500', LOW: 'bg-slate-400' } as const;

export const PriorityBreakdown: React.FC<{ score: PriorityScore }> = ({ score }) => (
  <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3" aria-label="Alasan urutan kasus">
    <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100">
      <h4 className="font-bold text-slate-900">Mengapa kasus ini di urutan ini</h4>
      <div className="flex items-center gap-2">
        <span className="text-2xl font-extrabold text-slate-900 leading-none">{score.total}<span className="text-xs font-semibold text-slate-400">/100</span></span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${TONE[score.level]}`}>Prioritas {PRIORITY_LABEL[score.level].toLowerCase()}</span>
      </div>
    </div>
    <ul className="space-y-2.5">
      {score.factors.map(f => (
        <li key={f.id} className="space-y-1">
          <div className="flex items-center justify-between gap-3 text-slate-800">
            <span className="font-semibold">{f.label}</span>
            <span className="font-mono text-slate-600">{f.points}/{f.max}</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100" role="presentation"><div className={`h-1.5 rounded-full ${BAR[score.level]}`} style={{ width: `${(f.points / f.max) * 100}%` }} /></div>
          <p className="text-[11px] text-slate-500 leading-relaxed">{f.detail}</p>
        </li>
      ))}
    </ul>
    <div className="grid sm:grid-cols-2 gap-2 pt-1">
      {score.modifiers.map(m => (
        <div key={m.id} className="rounded-lg bg-slate-50 p-2.5">
          <div className="flex items-center justify-between text-slate-800"><span className="font-semibold">{m.label}</span><span className="font-mono">× {m.multiplier.toFixed(2).replace('.', ',')}</span></div>
          <p className="text-[11px] text-slate-500">{m.detail}</p>
        </div>
      ))}
    </div>
    <p className="text-[11px] text-slate-500 leading-relaxed">Dihitung oleh program: (selisih + pola + konteks klaim) × keandalan × kecukupan informasi. Indeks ini hanya mengurutkan pemeriksaan. Bukan penilaian benar atau salah, dan tidak menyatakan kecurangan. Keputusan tetap pada petugas.</p>
  </div>
);

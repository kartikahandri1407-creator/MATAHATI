import React from 'react';
import { FacilityPattern } from '../types/matahati';
import { RISK_LABEL } from '../data/claimUtils';

interface Props {
  pattern: FacilityPattern;
  onOpenCase?: (caseId: string) => void;
}

const LEVEL = {
  TINGGI: { label: 'Perhatian tinggi', dot: 'bg-rose-600', text: 'text-rose-700', card: 'border-rose-300 ring-1 ring-rose-100' },
  SEDANG: { label: 'Perhatian sedang', dot: 'bg-amber-500', text: 'text-amber-700', card: 'border-slate-200' },
  RENDAH: { label: 'Perhatian rendah', dot: 'bg-slate-400', text: 'text-slate-500', card: 'border-slate-200' }
} as const;

export const FacilityPatternCard: React.FC<Props> = ({ pattern, onOpenCase }) => {
  const lv = LEVEL[pattern.attention_level];
  return (
    <div className={`p-4 rounded-2xl border bg-white ${lv.card}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="font-bold text-slate-900 truncate">{pattern.facility_name}</h4>
          <span className="text-xs text-slate-500">{RISK_LABEL[pattern.risk_type]}</span>
        </div>
        <span className={`shrink-0 text-xs font-bold flex items-center gap-1.5 ${lv.text}`}><span className={`w-2 h-2 rounded-full ${lv.dot}`} />{lv.label}</span>
      </div>
      <div className="mt-3 flex items-end gap-1.5">
        <span className="text-3xl font-extrabold text-tinta leading-none">{pattern.signal_count}</span>
        <span className="text-xs text-slate-500 pb-0.5">pelapor berbeda dari {pattern.total_reports} laporan</span>
      </div>
      <p className="mt-2 text-sm text-slate-600 leading-relaxed">{pattern.pattern_summary}</p>
      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs">
        {pattern.case_ids.map(cid => (
          <button key={cid} type="button" onClick={() => onOpenCase?.(cid)} className="font-mono px-2 py-1 rounded-md bg-slate-100 text-slate-700 hover:bg-emerald-100 hover:text-emerald-900">{cid}</button>
        ))}
      </div>
    </div>
  );
};

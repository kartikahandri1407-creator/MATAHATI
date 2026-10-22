import React from 'react';
import { TimelineEvent } from '../data/stage';
import { fmtWaktu } from '../data/format';

const DOT: Record<TimelineEvent['tone'], string> = {
  info: 'bg-sky-500 ring-sky-100', wait: 'bg-amber-500 ring-amber-100', ok: 'bg-emerald-600 ring-emerald-100', alert: 'bg-rose-600 ring-rose-100'
};

/** Jejak waktu satu kasus. Dipakai peserta dan petugas dengan isi yang sudah disaring menurut pembacanya. */
export const Timeline: React.FC<{ events: TimelineEvent[]; showActor?: boolean }> = ({ events, showActor }) => {
  if (events.length === 0) return <p className="text-sm text-slate-500">Belum ada catatan.</p>;
  return (
    <ol className="space-y-0" aria-label="Jejak waktu">
      {events.map((e, i) => (
        <li key={i} className="relative pl-7 pb-4 last:pb-0">
          {i < events.length - 1 && <span className="tl-line" aria-hidden="true" />}
          <span className={`absolute left-1 top-1.5 w-4 h-4 rounded-full ring-4 ${DOT[e.tone]}`} aria-hidden="true" />
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span className="text-sm font-semibold text-slate-900">{e.title}</span>
            <span className="text-[11px] text-slate-500">{fmtWaktu(e.at)}</span>
          </div>
          {(showActor || e.detail) && (
            <div className="text-xs text-slate-600 mt-0.5">{showActor && <span className="font-medium text-slate-500">{e.actor}</span>}{showActor && e.detail ? ' · ' : ''}{e.detail}</div>
          )}
        </li>
      ))}
    </ol>
  );
};

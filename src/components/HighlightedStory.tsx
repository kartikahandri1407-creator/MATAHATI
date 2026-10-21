import React, { useMemo } from 'react';
import { PatientEvidence } from '../types/matahati';
import { EvidenceQuote, deriveQuotes, segmentStory, verifyQuotes } from '../services/evidenceQuotes';

/** Cerita peserta dengan bagian dasar penilaian disorot. Hanya kutipan yang benar-benar ada di cerita yang disorot. */
export const HighlightedStory: React.FC<{ story: string; quotes?: EvidenceQuote[]; evidence: PatientEvidence }> = ({ story, quotes, evidence }) => {
  const { segments, from } = useMemo(() => {
    const verified = verifyQuotes(story, quotes).kept;
    const use = verified.length ? verified : deriveQuotes(story, evidence);
    return { segments: segmentStory(story, use), from: verified.length ? 'AI' : use.length ? 'LOKAL' : '' };
  }, [story, quotes, evidence]);
  const marked = segments.filter(s => s.supports).length;

  return (
    <div className="space-y-1.5">
      <div className="p-3 bg-slate-50 rounded border border-slate-200 text-slate-800 leading-relaxed">
        “{segments.map((s, i) => s.supports
          ? <mark key={i} title={s.supports} className="bg-amber-200/80 text-slate-900 rounded px-0.5">{s.text}</mark>
          : <React.Fragment key={i}>{s.text}</React.Fragment>)}”
      </div>
      {marked > 0 && (
        <div className="text-[11px] text-slate-500">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-200 align-middle mr-1" />
          Bagian yang disorot menjadi dasar penilaian ({from === 'AI' ? 'ditunjuk AI, lalu diperiksa kode: kutipan yang tidak ada di cerita dibuang' : 'ditandai mesin lokal dari angka dan istilah di cerita'}). Arahkan kursor untuk melihat alasannya.
          <ul className="mt-1 space-y-0.5">
            {segments.filter(s => s.supports).map((s, i) => <li key={i}>• <i>{s.supports}</i></li>)}
          </ul>
        </div>
      )}
    </div>
  );
};

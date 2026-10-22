import React, { useMemo, useState } from 'react';
import { CaseRecord, DummyClaim, Facility } from '../types/matahati';
import { SCENARIO_LABEL, claimSummary } from '../data/claimUtils';
import { demoNow, waitingDays } from '../data/outcomes';
import { Building2, CalendarClock, CheckCircle2, FileCheck2, Send } from 'lucide-react';
import { PageHeader } from './PageHeader';
import { fmtTanggal, fmtWaktu } from '../data/format';

interface Props {
  cases: CaseRecord[];
  claims: DummyClaim[];
  facilities: Facility[];
  onRespond: (c: CaseRecord, reason: string, note: string) => void;
}

const QUESTION: Record<DummyClaim['scenario'], string> = {
  OBAT: 'Mohon konfirmasi jumlah obat yang diserahkan kepada pasien.',
  TINDAKAN: 'Mohon konfirmasi apakah tindakan ini dilakukan kepada pasien.',
  LOS: 'Mohon konfirmasi lama rawat inap pasien.',
  IUR_BIAYA: 'Mohon konfirmasi ada tidaknya biaya tambahan yang ditagihkan di kasir.',
  KUNJUNGAN_FIKTIF: 'Mohon konfirmasi jumlah kunjungan yang dilayani.',
  READMISI: 'Mohon konfirmasi riwayat rawat inap berulang pada periode ini.',
  UPCODING: 'Mohon konfirmasi diagnosis yang menjadi dasar tagihan.',
  UMUM: 'Mohon konfirmasi pencatatan layanan ini.'
};

/** Dokumen pendukung yang bisa disebut faskes. Prototipe hanya mencatat namanya, tidak menyimpan berkas. */
const DOCS = ['Tanda terima penyerahan obat', 'Salinan resep', 'Catatan rekam medis terkait', 'Bukti kasir'];
const DEADLINE_DAYS = 7;

const REASONS = [
  'Sesuai catatan, layanan diberikan seperti tercatat',
  'Stok kosong, obat diserahkan sebagian',
  'Salah catat, akan dikoreksi',
  'Diberikan di layanan lain atau apotek jejaring (PRB)',
  'Alasan lain (jelaskan)'
];

export const FaskesPortal: React.FC<Props> = ({ cases, claims, facilities, onRespond }) => {
  const [facilityId, setFacilityId] = useState<string>('');
  const [reason, setReason] = useState<Record<string, string>>({});
  const [note, setNote] = useState<Record<string, string>>({});
  const [docs, setDocs] = useState<Record<string, string[]>>({});
  const toggleDoc = (id: string, d: string) => setDocs(p => ({ ...p, [id]: (p[id] || []).includes(d) ? (p[id] || []).filter(x => x !== d) : [...(p[id] || []), d] }));

  const withRequests = useMemo(() => new Set(cases.filter(c => c.verification_status === 'CLARIFICATION_DRAFTED' || c.facility_response).map(c => c.facility_id)), [cases]);
  const fid = facilityId || [...withRequests][0] || facilities[0]?.facility_id || '';
  const mine = cases.filter(c => c.facility_id === fid && (c.verification_status === 'CLARIFICATION_DRAFTED' || c.facility_response));
  const pending = mine.filter(c => c.verification_status === 'CLARIFICATION_DRAFTED');
  const answered = mine.filter(c => c.verification_status !== 'CLARIFICATION_DRAFTED' && c.facility_response);
  const now = demoNow(cases);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <PageHeader eyebrow="Fasilitas Kesehatan" title="Permintaan Konfirmasi" text="Pertanyaan netral dari petugas tentang pencatatan layanan di faskes Anda. Tidak ada nama, cerita, atau identitas peserta, dan tidak ada tuduhan." />

      <div className="card flex items-center gap-3 p-3">
        <Building2 className="w-5 h-5 text-emerald-700 shrink-0" />
        <label htmlFor="faskes" className="text-sm font-semibold text-slate-700 shrink-0">Faskes Anda</label>
        <select id="faskes" value={fid} onChange={e => setFacilityId(e.target.value)} className="flex-1 min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
          {facilities.map(f => <option key={f.facility_id} value={f.facility_id}>{f.facility_name}{withRequests.has(f.facility_id) ? ' (ada permintaan)' : ''}</option>)}
        </select>
      </div>

      {(pending.length > 0 || answered.length > 0) && (
        <div className="grid grid-cols-2 gap-3 text-center" aria-label="Ringkasan permintaan">
          <div className="rounded-2xl bg-sky-50 border border-sky-200 p-3"><div className="text-2xl font-extrabold text-sky-800">{pending.length}</div><div className="text-xs text-slate-600">menunggu jawaban Anda</div></div>
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3"><div className="text-2xl font-extrabold text-emerald-800">{answered.length}</div><div className="text-xs text-slate-600">sudah dijawab</div></div>
        </div>
      )}

      {pending.length === 0 && answered.length === 0 && (
        <div className="card p-10 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
          <h3 className="font-bold text-slate-900">Tidak ada permintaan konfirmasi</h3>
          <p className="text-sm text-slate-600">Permintaan muncul di sini setelah petugas membuat surat konfirmasi dari Antrean Verifikasi.</p>
        </div>
      )}

      <ul className="space-y-4">
        {pending.map(c => {
          const claim = claims.find(x => x.claim_key === c.claim_key);
          const r = reason[c.case_id] || '';
          const needNote = r === REASONS[4];
          const ok = !!r && (!needNote || (note[c.case_id] || '').trim().length > 3);
          return (
            <li key={c.case_id} className="card border-l-[6px] border-l-sky-500 p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-500"><span className="font-mono">{claim?.sep_number || c.claim_key}</span> · {fmtTanggal(c.service_date)}</div>
                  <div className="font-bold text-slate-900">{claim ? SCENARIO_LABEL[claim.scenario] : 'Layanan'}</div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200 whitespace-nowrap">{(() => { const d = waitingDays(c, now); return d === null ? 'Menunggu jawaban' : d === 0 ? 'Masuk hari ini' : `Menunggu ${d} hari`; })()}</span>
              </div>
              {claim && (
                <dl className="bg-slate-50 rounded-xl p-3 text-sm grid grid-cols-2 gap-x-4 gap-y-2">
                  <div><dt className="text-xs text-slate-500">Nomor SEP</dt><dd className="font-semibold font-mono text-[13px]">{claim.sep_number}</dd></div>
                  <div><dt className="text-xs text-slate-500">Tanggal layanan</dt><dd className="font-semibold">{fmtTanggal(claim.service_date)}</dd></div>
                  <div className="col-span-2"><dt className="text-xs text-slate-500">Tercatat pada klaim</dt><dd className="font-semibold">{claimSummary(claim)}</dd></div>
                </dl>)}
              {(() => { const e = [...(c.audit_log || [])].reverse().find(a => a.action === 'DRAFT_CLARIFICATION_CREATED'); const t = e ? Date.parse(e.timestamp) : NaN; if (!Number.isFinite(t)) return null; return <div className="flex items-center gap-2 text-xs text-slate-600"><CalendarClock className="w-4 h-4 text-sky-700" />Diminta {fmtTanggal(e!.timestamp)} · mohon dijawab sebelum <b>{fmtTanggal(new Date(t + DEADLINE_DAYS * 86400000).toISOString())}</b></div>; })()}
              <p className="text-slate-800">{claim ? QUESTION[claim.scenario] : QUESTION.UMUM} Penjelasan Anda membantu kami memastikan pencatatan sudah benar.</p>
              <fieldset className="space-y-1.5">
                <legend className="text-sm font-semibold text-slate-700 mb-1">Jawaban faskes</legend>
                {REASONS.map(x => (
                  <label key={x} className="flex items-start gap-2.5 text-sm text-slate-800 cursor-pointer">
                    <input type="radio" name={`r-${c.case_id}`} className="mt-1 accent-emerald-700" checked={r === x} onChange={() => setReason({ ...reason, [c.case_id]: x })} />{x}
                  </label>
                ))}
              </fieldset>
              <fieldset className="space-y-1.5">
                <legend className="text-sm font-semibold text-slate-700 mb-1">Dokumen pendukung yang tersedia <span className="font-normal text-slate-500">(opsional, hanya dicatat namanya)</span></legend>
                <div className="flex flex-wrap gap-2">
                  {DOCS.map(d => { const on = (docs[c.case_id] || []).includes(d); return (
                    <button key={d} type="button" aria-pressed={on} onClick={() => toggleDoc(c.case_id, d)} className={`px-3 py-1.5 rounded-full border text-xs font-semibold ${on ? 'bg-emerald-50 border-emerald-600 text-emerald-900' : 'bg-white border-slate-300 text-slate-600 hover:border-slate-400'}`}>{on ? '✓ ' : ''}{d}</button>); })}
                </div>
              </fieldset>
              <textarea rows={2} value={note[c.case_id] || ''} onChange={e => setNote({ ...note, [c.case_id]: e.target.value })} placeholder="Catatan tambahan (misalnya nomor dokumen atau jumlah sebenarnya)" className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-emerald-700" />
              <button type="button" disabled={!ok} onClick={() => { const dl = docs[c.case_id] || []; onRespond(c, r, [(note[c.case_id] || '').trim(), dl.length ? `Dokumen tersedia: ${dl.join(', ')}` : ''].filter(Boolean).join(' · ')); }}
                className="btn-primary h-11 px-5 text-sm flex items-center gap-2"><Send className="w-4 h-4" />Kirim konfirmasi</button>
            </li>
          );
        })}
        {answered.map(c => (
          <li key={c.case_id} className="card p-4 flex items-start gap-3">
            <FileCheck2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div className="text-sm min-w-0">
              <div className="font-semibold text-slate-900">{c.claim_key} · {fmtTanggal(c.service_date)}</div>
              <div className="text-slate-700 mt-0.5">{c.facility_response?.reason}</div>
              {c.facility_response?.note && <div className="text-slate-500 text-xs mt-0.5">Catatan: {c.facility_response.note}</div>}
              <div className="text-xs text-emerald-800 font-semibold mt-1.5">Tanda terima KNF-{c.case_id.replace(/^RPT-?/, '')} · diterima {fmtWaktu(c.facility_response?.at)}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

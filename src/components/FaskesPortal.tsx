import React, { useMemo, useState } from 'react';
import { CaseRecord, DummyClaim, Facility } from '../types/matahati';
import { SCENARIO_LABEL, claimSummary } from '../data/claimUtils';
import { Building2, CheckCircle2, Send } from 'lucide-react';

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

  const withRequests = useMemo(() => new Set(cases.filter(c => c.verification_status === 'CLARIFICATION_DRAFTED' || c.facility_response).map(c => c.facility_id)), [cases]);
  const fid = facilityId || [...withRequests][0] || facilities[0]?.facility_id || '';
  const mine = cases.filter(c => c.facility_id === fid && (c.verification_status === 'CLARIFICATION_DRAFTED' || c.facility_response));
  const pending = mine.filter(c => c.verification_status === 'CLARIFICATION_DRAFTED');
  const answered = mine.filter(c => c.verification_status !== 'CLARIFICATION_DRAFTED' && c.facility_response);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-emerald-700">Ruang Faskes (simulasi)</div>
        <h2 className="text-2xl font-extrabold tracking-tight text-tinta">Permintaan Konfirmasi</h2>
        <p className="text-slate-600 mt-1">Ini yang dilihat faskes: pertanyaan netral tentang pencatatan. Tidak ada nama, cerita, atau identitas peserta, dan tidak ada tuduhan.</p>
      </div>

      <div className="flex items-center gap-3 bg-white rounded-2xl border border-slate-200 p-3">
        <Building2 className="w-5 h-5 text-emerald-700 shrink-0" />
        <label htmlFor="faskes" className="text-sm font-semibold text-slate-700 shrink-0">Masuk sebagai</label>
        <select id="faskes" value={fid} onChange={e => setFacilityId(e.target.value)} className="flex-1 min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
          {facilities.map(f => <option key={f.facility_id} value={f.facility_id}>{f.facility_name}{withRequests.has(f.facility_id) ? ' (ada permintaan)' : ''}</option>)}
        </select>
      </div>

      {pending.length === 0 && answered.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
          <h3 className="font-bold text-slate-900">Tidak ada permintaan konfirmasi</h3>
          <p className="text-sm text-slate-600">Permintaan muncul di sini setelah petugas membuat draf surat konfirmasi di Meja Verifikasi (tombol buat draf surat pada detail kasus).</p>
        </div>
      )}

      <ul className="space-y-4">
        {pending.map(c => {
          const claim = claims.find(x => x.claim_key === c.claim_key);
          const r = reason[c.case_id] || '';
          const needNote = r === REASONS[4];
          const ok = !!r && (!needNote || (note[c.case_id] || '').trim().length > 3);
          return (
            <li key={c.case_id} className="bg-white rounded-2xl border-l-8 border-sky-500 border border-slate-200 p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-500 font-mono">{claim?.sep_number || c.claim_key} · {c.service_date}</div>
                  <div className="font-bold text-slate-900">{claim ? SCENARIO_LABEL[claim.scenario] : 'Layanan'}</div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200">Menunggu jawaban</span>
              </div>
              {claim && <div className="bg-slate-50 rounded-lg p-3 text-sm"><div className="text-xs text-slate-500 mb-0.5">Tercatat pada klaim</div><b>{claimSummary(claim)}</b></div>}
              <p className="text-slate-800">{claim ? QUESTION[claim.scenario] : QUESTION.UMUM} Penjelasan Anda membantu kami memastikan pencatatan sudah benar.</p>
              <fieldset className="space-y-1.5">
                <legend className="text-sm font-semibold text-slate-700 mb-1">Jawaban faskes</legend>
                {REASONS.map(x => (
                  <label key={x} className="flex items-start gap-2.5 text-sm text-slate-800 cursor-pointer">
                    <input type="radio" name={`r-${c.case_id}`} className="mt-1 accent-emerald-700" checked={r === x} onChange={() => setReason({ ...reason, [c.case_id]: x })} />{x}
                  </label>
                ))}
              </fieldset>
              <textarea rows={2} value={note[c.case_id] || ''} onChange={e => setNote({ ...note, [c.case_id]: e.target.value })} placeholder="Catatan tambahan (misalnya nomor dokumen atau jumlah sebenarnya)" className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-emerald-700" />
              <button type="button" disabled={!ok} onClick={() => onRespond(c, r, (note[c.case_id] || '').trim())}
                className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white text-sm font-semibold flex items-center gap-2"><Send className="w-4 h-4" />Kirim konfirmasi</button>
            </li>
          );
        })}
        {answered.map(c => (
          <li key={c.case_id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div className="text-sm">
              <div className="font-semibold text-slate-900">{c.claim_key} · {c.service_date} · sudah dijawab</div>
              <div className="text-slate-600">{c.facility_response?.reason}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

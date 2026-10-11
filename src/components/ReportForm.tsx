import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CaseRecord, DummyClaim, RiskType, TriageResult } from '../types/matahati';
import { requestTriageAnalysis } from '../ai/geminiClient';
import { CORE_SCENARIOS, RISK_LABEL, SAMPLE_STORY, SCENARIO_LABEL, claimLabel, claimSummary, compressImage } from '../data/claimUtils';

type Answer = { n: string; choice: '' | 'ya' | 'tidak' | 'ragu' };
import { AlertCircle, ArrowRight, Camera, CheckCircle2, Database, HelpCircle, Loader2, Mic, MicOff, Wand2 } from 'lucide-react';

interface ReportFormProps {
  claims: DummyClaim[];
  isDemoMode: boolean;
  newCaseId: () => string;
  onCaseAnalyzed: (newCase: CaseRecord) => void;
  onOpenCaseDetail: (caseRecord: CaseRecord) => void;
  onGoToQueue: () => void;
  onGoToMine: () => void;
  onGoToDataMaster: () => void;
}

/** Ubah jawaban terarah peserta menjadi kalimat berbahasa peserta (bukan menebak isi klaim). */
function answerToStory(c: DummyClaim, a: Answer): string {
  const n = a.n.trim();
  const num = Number(n);
  const okNum = n !== '' && Number.isFinite(num) && num >= 0 && num <= 1_000_000_000;
  switch (c.scenario) {
    case 'OBAT': return okNum ? `Saya berobat ke ${c.facility_name} pada ${c.service_date}. Di apotek saya menerima ${num} obat.` : '';
    case 'TINDAKAN':
      return a.choice === 'ya' ? `Di ${c.facility_name} saya memang menjalani ${c.procedure_name || 'tindakan itu'}.`
        : a.choice === 'tidak' ? `Di ${c.facility_name} saya tidak pernah menjalani ${c.procedure_name || 'tindakan itu'}.`
        : a.choice === 'ragu' ? `Saya tidak yakin apakah saya menjalani ${c.procedure_name || 'tindakan itu'} di ${c.facility_name}.` : '';
    case 'LOS': return okNum ? `Saya dirawat di ${c.facility_name} selama ${num} hari.` : '';
    case 'KUNJUNGAN_FIKTIF': return okNum ? `Saya benar-benar datang ke ${c.facility_name} sebanyak ${num} kali.` : '';
    case 'IUR_BIAYA': return okNum ? (num === 0 ? `Di ${c.facility_name} saya tidak membayar apa pun.` : `Di ${c.facility_name} saya membayar tunai Rp ${num.toLocaleString('id-ID')} di kasir.`) : '';
    default: return '';
  }
}

const THANKS: Record<string, string> = {
  CONSISTENT: 'Jawaban Anda sesuai dengan catatan layanan. Terima kasih sudah memeriksa.',
  INSUFFICIENT_EVIDENCE: 'Informasi yang Anda berikan belum cukup untuk dibandingkan. Anda boleh menambah cerita bila ingin.',
  POTENTIAL_DISCREPANCY: 'Ada perbedaan antara jawaban Anda dan catatan layanan. Laporan Anda diteruskan ke petugas untuk dicek. Ini belum berarti ada yang salah; bisa jadi hanya perbedaan pencatatan.',
  RISK_SIGNAL: 'Ada perbedaan yang jelas antara jawaban Anda dan catatan layanan. Laporan Anda diteruskan ke petugas untuk dicek ke faskes. Ini belum berarti ada yang salah; petugas akan memastikan.'
};

const STATUS_TEXT: Record<string, { label: string; cls: string }> = {
  RISK_SIGNAL: { label: 'Perlu diverifikasi (ada ketidaksesuaian jelas)', cls: 'text-rose-700' },
  POTENTIAL_DISCREPANCY: { label: 'Mungkin ada perbedaan', cls: 'text-amber-700' },
  CONSISTENT: { label: 'Sesuai dengan catatan', cls: 'text-emerald-700' },
  INSUFFICIENT_EVIDENCE: { label: 'Informasi belum cukup', cls: 'text-slate-600' }
};

export const ReportForm: React.FC<ReportFormProps> = ({ claims, isDemoMode, newCaseId, onCaseAnalyzed, onOpenCaseDetail, onGoToQueue, onGoToMine, onGoToDataMaster }) => {
  const [claimKey, setClaimKey] = useState('');
  const [inputBy, setInputBy] = useState<'PESERTA_MANDIRI' | 'KADER_PENDAMPING'>('PESERTA_MANDIRI');
  const [storyText, setStoryText] = useState('');
  const [ans, setAns] = useState<Answer>({ n: '', choice: '' });
  const [showOfficer, setShowOfficer] = useState(false);
  const [photo, setPhoto] = useState<{ data: string; name: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<CaseRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [canDictate, setCanDictate] = useState(false);
  const recRef = useRef<any>(null);

  const claim = useMemo(() => claims.find(c => c.claim_key === claimKey) || null, [claims, claimKey]);
  const grouped = useMemo(() => {
    const core = claims.filter(c => CORE_SCENARIOS.includes(c.scenario));
    const rest = claims.filter(c => !CORE_SCENARIOS.includes(c.scenario));
    return { core, rest };
  }, [claims]);

  useEffect(() => { if (claimKey && !claims.some(c => c.claim_key === claimKey)) setClaimKey(''); }, [claims, claimKey]);
  useEffect(() => { if (!claimKey && grouped.core[0]) setClaimKey(grouped.core[0].claim_key); }, [grouped, claimKey]);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    setCanDictate(true);
    const r = new SR();
    r.continuous = true; r.interimResults = false; r.lang = 'id-ID';
    r.onresult = (ev: any) => {
      let t = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) if (ev.results[i].isFinal) t += ev.results[i][0].transcript + ' ';
      if (t) setStoryText(p => (p ? `${p} ${t}` : t).trim());
    };
    r.onerror = () => setIsRecording(false);
    r.onend = () => setIsRecording(false);
    recRef.current = r;
  }, []);

  const toggleMic = () => {
    if (!recRef.current) return;
    try { if (isRecording) { recRef.current.stop(); } else { recRef.current.start(); setIsRecording(true); } } catch { setIsRecording(false); }
  };

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try { setPhoto({ data: await compressImage(f), name: f.name }); setError(null); }
    catch { setError('Foto tidak dapat dibaca. Gunakan file JPG atau PNG.'); }
  };

  const reset = () => { setStoryText(''); setAns({ n: '', choice: '' }); setPhoto(null); setResult(null); setError(null); setShowOfficer(false); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claim) { setError('Pilih dulu klaim yang ingin dicocokkan.'); return; }
    const fromAnswer = answerToStory(claim, ans);
    const finalStory = [fromAnswer, storyText.trim()].filter(Boolean).join(' ');
    if (finalStory.length < 10) { setError('Jawab pertanyaan di atas, atau tulis sedikit cerita Anda.'); return; }
    if (finalStory.length > 3000) { setError('Cerita terlalu panjang (maksimal 3000 huruf).'); return; }
    setError(null); setIsAnalyzing(true);
    try {
      const triage: TriageResult = await requestTriageAnalysis({
        storyText: finalStory, claim, photoBase64: photo?.data,
        sourceChannel: inputBy === 'KADER_PENDAMPING' ? 'KADER_PENDAMPING' : 'SIMULATED_FORM', inputBy, forceDemoMode: isDemoMode
      });
      const now = new Date().toISOString();
      const rec: CaseRecord = {
        ...triage,
        case_id: newCaseId(),
        claim_key: claim.claim_key,
        facility_id: claim.facility_id,
        facility_name: claim.facility_name,
        service_date: claim.service_date,
        input_by: inputBy,
        input_type: 'TEXT',
        patient_statement: finalStory,
        reporter_id: `RPT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        visual_evidence: photo ? { uploaded: true, file_name: photo.name } : undefined,
        verification_status: 'NEW',
        audit_log: [{ timestamp: now, user_role: 'Sistem MATA HATI', action: 'SUBMITTED', note: `Laporan diterima untuk ${claim.facility_name}. Hasil awal: ${triage.status}.` }],
        created_at: now
      };
      setResult(rec);
      onCaseAnalyzed(rec);
    } catch (err: any) {
      setError(err?.message || 'Gagal memproses. Coba lagi.');
    } finally { setIsAnalyzing(false); }
  };

  const diffText = (r: CaseRecord) => {
    const d = r.reconciliation.computed_difference;
    if (d === undefined || d === null) return null;
    return `${d} ${r.reconciliation.difference_unit || ''}`.trim();
  };

  return (
    <div className="max-w-xl mx-auto px-5 py-8 space-y-7 text-[17px] leading-relaxed">
      <div className="hero rounded-3xl px-6 py-7 text-white space-y-3">
        <div className="text-xs font-bold uppercase tracking-[.18em] text-matahari">Cek Layanan JKN</div>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">Yang tercatat atas nama Anda, sama dengan yang Anda alami?</h2>
        <p className="text-white/80 text-base">Cukup satu jawaban singkat. Anda jadi mata bagi layanan JKN, tanpa menuduh siapa pun.</p>
      </div>

      <form onSubmit={submit} className="space-y-7">
        <div className="space-y-2">
          <label htmlFor="layanan" className="font-bold text-tinta">Layanan yang dicek</label>
          {claims.length === 0 ? (
            <div className="text-slate-600 bg-white rounded-xl p-4 border border-slate-200">Belum ada layanan di basis data. <button type="button" onClick={onGoToDataMaster} className="text-emerald-800 font-semibold underline">Tambah di Data Master</button>.</div>
          ) : (
            <select id="layanan" aria-label="Pilih klaim" value={claimKey} onChange={e => { setClaimKey(e.target.value); setResult(null); setAns({ n: '', choice: '' }); }} className="w-full rounded-xl border-2 border-slate-300 bg-white p-3.5 text-base focus:border-emerald-700">
              <option value="">Pilih layanan lain</option>
              {grouped.core.length > 0 && <optgroup label="Obat, tindakan, lama rawat">{grouped.core.map(c => <option key={c.claim_key} value={c.claim_key}>{c.facility_name} · {c.service_date} · {SCENARIO_LABEL[c.scenario]}</option>)}</optgroup>}
              {grouped.rest.length > 0 && <optgroup label="Jenis lain (masih eksperimen)">{grouped.rest.map(c => <option key={c.claim_key} value={c.claim_key}>{c.facility_name} · {c.service_date} · {SCENARIO_LABEL[c.scenario]}</option>)}</optgroup>}
            </select>
          )}
        </div>

        {!claim && claims.length > 0 && (
          <ol className="grid gap-3 sm:grid-cols-3 pt-2" aria-label="Cara kerja">
            {[['Lihat', 'Apa yang tercatat atas nama Anda di klaim faskes.'], ['Jawab', 'Satu pertanyaan singkat: sama atau berbeda dengan yang Anda alami?'], ['Pantau', 'Lihat perkembangannya di Laporan Saya. Tanpa perlu antre.']].map(([t, d], i) => (
              <li key={t} className="bg-white rounded-2xl border border-slate-200 p-4">
                <span className="w-7 h-7 rounded-full bg-emerald-700 text-white text-sm font-bold flex items-center justify-center mb-2">{i + 1}</span>
                <div className="font-bold text-tinta">{t}</div>
                <p className="text-sm text-slate-600 mt-0.5">{d}</p>
              </li>
            ))}
          </ol>
        )}

        {claim && (
          <section className="struk" aria-label="Yang tercatat atas nama Anda">
            <div className="bg-tinta text-white rounded-t-[14px] px-5 py-3 flex items-center justify-between gap-3">
              <span className="font-bold">Tercatat atas nama Anda</span>
              <span className="text-xs text-white/70">simulasi</span>
            </div>
            <div className="px-5 pt-4 pb-6">
              <div className="text-xl font-extrabold text-tinta leading-snug">{claim.facility_name}</div>
              <div className="text-sm text-slate-500 mb-3">{claim.service_date} · {claim.sep_number}</div>
              <div className="struk-row"><span className="text-slate-600">Layanan</span><span className="font-semibold text-right">{claimSummary(claim)}</span></div>
              <div className="struk-row"><span className="text-slate-600">Dibayarkan program JKN</span><span className="font-semibold">Rp {claim.claim_amount.toLocaleString('id-ID')}</span></div>
              <div className="struk-row"><span className="text-slate-600">Biaya tambahan untuk Anda</span><span className="font-semibold">tidak tercatat</span></div>
            </div>
          </section>
        )}

        {claim && (
          <section className="space-y-4 pt-2">
            {(() => {
              const step = (d: number) => setAns({ ...ans, n: String(Math.max(0, (Number(ans.n) || 0) + d)) });
              const num = (q: string, unit: string) => (
                <div className="space-y-3">
                  <div className="text-xl font-bold text-tinta leading-snug">{q}</div>
                  <div className="flex items-center gap-3">
                    <button type="button" aria-label="Kurangi" onClick={() => step(-1)} className="w-14 h-14 rounded-full border-2 border-emerald-700 text-emerald-800 text-3xl font-bold leading-none hover:bg-emerald-50 active:bg-emerald-100">−</button>
                    <input aria-label={q} type="number" min={0} inputMode="numeric" value={ans.n} placeholder="0" onChange={e => setAns({ ...ans, n: e.target.value })} className="w-28 h-14 rounded-xl border-2 border-slate-300 bg-white text-center text-3xl font-extrabold text-tinta focus:border-emerald-700" />
                    <button type="button" aria-label="Tambah" onClick={() => step(1)} className="w-14 h-14 rounded-full bg-emerald-700 text-white text-3xl font-bold leading-none hover:bg-emerald-800 active:bg-emerald-900">+</button>
                    <span className="text-slate-600">{unit}</span>
                  </div>
                </div>);
              if (claim.scenario === 'OBAT') return num('Berapa obat yang Anda terima di apotek?', 'obat');
              if (claim.scenario === 'LOS') return num('Berapa hari Anda dirawat inap?', 'hari');
              if (claim.scenario === 'KUNJUNGAN_FIKTIF') return num('Berapa kali Anda benar-benar datang?', 'kali');
              if (claim.scenario === 'IUR_BIAYA') return num('Berapa rupiah yang Anda bayar tunai? Isi 0 bila tidak membayar.', 'rupiah');
              if (claim.scenario === 'TINDAKAN') return (
                <fieldset className="space-y-3"><legend className="text-xl font-bold text-tinta leading-snug mb-1">Apakah "{claim.procedure_name}" benar dilakukan pada Anda?</legend>
                  {([['ya', 'Ya, dilakukan'], ['tidak', 'Tidak pernah dilakukan'], ['ragu', 'Saya tidak yakin']] as const).map(([v, t]) => (
                    <label key={v} className={`flex items-center gap-3 rounded-xl border-2 p-4 cursor-pointer font-semibold ${ans.choice === v ? 'border-emerald-700 bg-emerald-50 text-emerald-900' : 'border-slate-300 bg-white'}`}><input type="radio" name="tindakan" className="w-5 h-5 accent-emerald-700" checked={ans.choice === v} onChange={() => setAns({ ...ans, choice: v })} />{t}</label>))}
                </fieldset>);
              return <p className="text-slate-700 font-semibold">Untuk jenis layanan ini, ceritakan dengan kata-kata Anda di bawah.</p>;
            })()}

            <details className="group rounded-xl border border-slate-200 bg-white" open={!!storyText || !!photo}>
              <summary className="cursor-pointer list-none p-4 font-semibold text-slate-700 flex items-center justify-between">Tambah cerita atau foto (boleh dilewati)<span className="text-slate-400 group-open:rotate-180 transition-transform">⌄</span></summary>
              <div className="px-4 pb-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => setStoryText(SAMPLE_STORY[claim.scenario](claim))} className="text-sm px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 flex items-center gap-1.5"><Wand2 className="w-4 h-4" />Isi contoh</button>
                  {canDictate && <button type="button" onClick={toggleMic} className={`text-sm px-3 py-2 rounded-lg border flex items-center gap-1.5 ${isRecording ? 'bg-rose-50 border-rose-200 text-rose-700' : 'border-slate-300 hover:bg-slate-50'}`}>{isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}{isRecording ? 'Berhenti' : 'Bicara'}</button>}
                  <label className="text-sm px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"><Camera className="w-4 h-4" />{photo ? 'Ganti foto' : 'Foto'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={onPhoto} className="hidden" /></label>
                </div>
                <textarea rows={4} value={storyText} onChange={e => setStoryText(e.target.value)} maxLength={3000} placeholder="Tulis dengan kata-kata Anda sendiri." className="w-full rounded-xl border-2 border-slate-300 p-3 text-base focus:border-emerald-700" />
                <div className="flex justify-between text-sm text-slate-500"><span>{photo ? <>Foto: {photo.name} <button type="button" className="underline ml-1" onClick={() => setPhoto(null)}>hapus</button></> : 'Jangan tulis nama atau nomor kartu.'}</span><span>{storyText.length}/3000</span></div>
              </div>
            </details>

            <label className="flex items-center gap-3 text-slate-700 cursor-pointer"><input type="checkbox" className="w-5 h-5 accent-emerald-700" checked={inputBy === 'KADER_PENDAMPING'} onChange={e => setInputBy(e.target.checked ? 'KADER_PENDAMPING' : 'PESERTA_MANDIRI')} />Saya mengisi untuk anggota keluarga atau sebagai pendamping</label>
          </section>
        )}

        {error && <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2" role="alert"><AlertCircle className="w-5 h-5 shrink-0" />{error}</div>}

        {claim && (
          <div className="flex items-center gap-4">
            <button type="submit" disabled={isAnalyzing} className="flex-1 h-14 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-lg flex items-center justify-center gap-2 disabled:opacity-60">
              {isAnalyzing ? <><Loader2 className="w-5 h-5 animate-spin" />Mengirim...</> : 'Kirim jawaban'}
            </button>
            {(storyText || ans.n || ans.choice || result) && <button type="button" onClick={reset} className="text-slate-600 underline">Ulangi</button>}
          </div>
        )}
      </form>

      {result && (
        <section className={`relative rounded-2xl p-6 border-l-8 bg-white shadow-sm ${result.status === 'CONSISTENT' ? 'border-emerald-600' : 'border-matahari'}`} aria-live="polite">
          <div className="cap absolute right-5 top-6 border-[3px] border-emerald-700 text-emerald-700 rounded-md px-3 py-1 font-extrabold text-lg">Diterima</div>
          <p className="text-xl font-bold text-tinta leading-snug pr-28 min-h-[3.5rem]">{result.status === 'CONSISTENT' ? 'Terima kasih, sudah sesuai.' : result.status === 'INSUFFICIENT_EVIDENCE' ? 'Terima kasih. Kami butuh sedikit tambahan.' : 'Terima kasih. Jawaban Anda kami teruskan.'}</p>
          <p className="mt-2 text-slate-700">{THANKS[result.status]}</p>
          {result.status !== 'CONSISTENT' && diffText(result) && (
            <div className="mt-4 grid grid-cols-3 gap-2 text-center" aria-label="Perbandingan catatan dan jawaban">
              <div className="rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-500">Tercatat</div><div className="text-sm font-bold text-tinta mt-1">{claimSummary(claim!)}</div></div>
              <div className="rounded-xl bg-slate-50 p-3"><div className="text-xs text-slate-500">Menurut Anda</div><div className="text-sm font-bold text-tinta mt-1">{result.patient_evidence.received_quantity ?? result.patient_evidence.actual_visits_count ?? result.patient_evidence.length_of_stay_days ?? '-'}</div></div>
              <div className="rounded-xl bg-matahari-soft p-3"><div className="text-xs text-slate-600">Selisih</div><div className="text-2xl font-extrabold text-tinta leading-none mt-1">{diffText(result)}</div></div>
            </div>
          )}
          <p className="mt-3 text-sm text-slate-500">Nomor laporan <span className="font-mono font-semibold text-slate-800">{result.case_id}</span>. Simpan bila ingin menanyakan perkembangannya. Laporan ini dipakai untuk memeriksa pelayanan, bukan untuk menghukum siapa pun.</p>
          <div className="flex flex-wrap gap-2 pt-4">
            <button type="button" onClick={() => setShowOfficer(v => !v)} className="px-4 py-2.5 rounded-lg border border-slate-300 font-semibold hover:bg-slate-50">{showOfficer ? 'Sembunyikan' : 'Lihat tampilan petugas'}</button>
            <button type="button" onClick={onGoToMine} className="px-4 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold">Pantau laporan saya</button>
            <button type="button" onClick={reset} className="px-4 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50">Cek layanan lain</button>
          </div>
        </section>
      )}

      {result && showOfficer && (
        <section className="bg-white rounded-xl border-2 border-emerald-700/30 p-5 space-y-4" aria-live="polite">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800"><CheckCircle2 className="w-4 h-4" />Tampilan petugas · <span className="font-mono">{result.case_id}</span></div>
          <div>
            <div className={`text-lg font-bold ${STATUS_TEXT[result.status].cls}`}>{STATUS_TEXT[result.status].label}</div>
            <div className="text-sm text-slate-600">Jenis: {RISK_LABEL[result.risk_type as RiskType]}{result.processing_source ? ` · diproses oleh: ${result.processing_source.startsWith('GEMINI') ? 'Gemini (via server)' : 'mesin lokal (cadangan)'}` : ''}</div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <div className="bg-slate-50 rounded-lg p-3"><div className="text-xs text-slate-500 mb-1">Menurut cerita peserta</div><div className="font-semibold">{result.patient_evidence.received_quantity != null ? `${result.patient_evidence.received_quantity} item diterima` : result.patient_evidence.actual_visits_count != null ? `${result.patient_evidence.actual_visits_count} kunjungan` : result.patient_evidence.length_of_stay_days != null ? `${result.patient_evidence.length_of_stay_days} hari rawat` : result.patient_evidence.stated_procedure_performed === false ? 'Tindakan tidak dialami' : 'Lihat cerita'}</div></div>
            <div className="bg-slate-50 rounded-lg p-3"><div className="text-xs text-slate-500 mb-1">Menurut klaim</div><div className="font-semibold">{claimSummary(claim!)}</div></div>
            <div className="bg-slate-50 rounded-lg p-3"><div className="text-xs text-slate-500 mb-1">Selisih (dihitung kode)</div><div className="font-semibold font-mono">{diffText(result) || 'Tidak dihitung'}</div></div>
          </div>
          <p className="text-sm text-slate-700">{result.reconciliation.finding}</p>
          {result.alternative_explanations.length > 0 && (
            <div className="rounded-lg border border-slate-200 p-3">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1"><HelpCircle className="w-3.5 h-3.5" />Kemungkinan penjelasan lain (harus dicek ke faskes)</div>
              <ul className="list-disc pl-5 text-sm text-slate-700 space-y-0.5">{result.alternative_explanations.map((a, i) => <li key={i}>{a}</li>)}</ul>
            </div>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <button type="button" onClick={onGoToQueue} className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold hover:bg-slate-50">Lihat di Antrean Verifikasi</button>
            <button type="button" onClick={() => onOpenCaseDetail(result)} className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 flex items-center gap-1.5">Buka detail <ArrowRight className="w-3.5 h-3.5" /></button>
          </div>
        </section>
      )}
    </div>
  );
};

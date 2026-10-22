import React, { useMemo, useRef, useState } from 'react';
import { DummyClaim, EvalCase, TriageResult } from '../types/matahati';
import { analyzeLocally } from '../services/localEngine';
import { requestTriageAnalysis } from '../ai/geminiClient';
import { CORE_SCENARIOS } from '../data/claimUtils';
import evalCasesData from '../data/evalCases.json';
import claimsSeed from '../data/dummyClaims.json';
import { buildFairnessSets, runFairnessSet, summarizeFairness, FairnessSetResult } from '../services/fairness';
import { PageHeader } from './PageHeader';
import { Info, Loader2, Play, Scale } from 'lucide-react';

type Engine = 'LOCAL' | 'GEMINI';
interface Row { ec: EvalCase; claim: DummyClaim; core: boolean; status: TriageResult['status'] | null; source: string; excluded: boolean; ruleOk: boolean }

const STATUS_ID: Record<string, string> = { RISK_SIGNAL: 'Perlu diverifikasi', POTENTIAL_DISCREPANCY: 'Mungkin berbeda', CONSISTENT: 'Sesuai catatan', INSUFFICIENT_EVIDENCE: 'Info belum cukup' };
const pct = (a: number, b: number) => (b === 0 ? '–' : `${Math.round((a / b) * 100)}%`);
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export const EvaluationModal: React.FC = () => {
  const cases = evalCasesData as EvalCase[];
  const claims = claimsSeed as DummyClaim[];
  const [engine, setEngine] = useState<Engine>('LOCAL');
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [ranEngine, setRanEngine] = useState<Engine | null>(null);
  const stop = useRef(false);
  const [fair, setFair] = useState<FairnessSetResult[]>([]);
  const [fairRunning, setFairRunning] = useState(false);
  const [fairEngine, setFairEngine] = useState<Engine | null>(null);
  const fairSets = useMemo(() => buildFairnessSets(claims), [claims]);

  const runFair = async () => {
    setFairRunning(true); setFair([]);
    const out: FairnessSetResult[] = [];
    let first = true;
    const analyze = async (v: { story: string; claim: DummyClaim }): Promise<TriageResult> => {
      if (engine === 'LOCAL') return analyzeLocally({ storyText: v.story, claim: v.claim, sourceChannel: 'EVAL_DATASET', inputBy: 'PESERTA_MANDIRI' });
      if (!first) await sleep(6500);
      first = false;
      return requestTriageAnalysis({ storyText: v.story, claim: v.claim, sourceChannel: 'EVAL_DATASET', inputBy: 'PESERTA_MANDIRI' });
    };
    for (const set of fairSets) { out.push(await runFairnessSet(set, analyze)); setFair([...out]); }
    setFairEngine(engine); setFairRunning(false);
  };
  const fairSum = summarizeFairness(fair);

  const missing = useMemo(() => cases.filter(c => !claims.some(x => x.claim_key === (c.dummy_claim_key || c.claim_key))), [cases, claims]);

  const run = async () => {
    stop.current = false; setRunning(true); setRows([]); setProgress(0);
    const out: Row[] = [];
    for (let i = 0; i < cases.length; i++) {
      if (stop.current) break;
      const ec = cases[i];
      const claim = claims.find(c => c.claim_key === (ec.dummy_claim_key || ec.claim_key));
      if (!claim) { setProgress(i + 1); continue; }
      let t: TriageResult;
      if (engine === 'LOCAL') {
        t = analyzeLocally({ storyText: ec.patient_story, claim, sourceChannel: 'EVAL_DATASET', inputBy: 'PESERTA_MANDIRI' });
      } else {
        if (i > 0) await sleep(6500); // batas 10 permintaan/menit di server
        t = await requestTriageAnalysis({ storyText: ec.patient_story, claim, sourceChannel: 'EVAL_DATASET', inputBy: 'PESERTA_MANDIRI' });
      }
      const viaModel = (t.processing_source || '').startsWith('GEMINI');
      out.push({
        ec, claim, core: CORE_SCENARIOS.includes(claim.scenario), status: t.status, source: t.processing_source || 'LOCAL',
        excluded: engine === 'GEMINI' && !viaModel,
        ruleOk: t.fraud_determination === 'NOT_DETERMINED' && !(t.reliability_flag === 'LOW' && t.status === 'RISK_SIGNAL')
      });
      setRows([...out]); setProgress(i + 1);
    }
    setRanEngine(engine); setRunning(false);
  };

  const valid = rows.filter(r => !r.excluded);
  const core = valid.filter(r => r.core);
  const ok = (r: Row) => r.status === r.ec.expected_status;
  const shouldNotFlag = valid.filter(r => r.ec.expected_status === 'CONSISTENT' || r.ec.expected_status === 'INSUFFICIENT_EVIDENCE');
  const wrongFlags = shouldNotFlag.filter(r => r.status === 'RISK_SIGNAL');
  const insufficient = valid.filter(r => r.ec.expected_status === 'INSUFFICIENT_EVIDENCE');
  const excluded = rows.filter(r => r.excluded).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <PageHeader eyebrow="Pengelola" title="Uji Kualitas AI" text="Bukti terukur bahwa pembacaan cerita akurat, konsisten, dan adil. Tiga bagian di bawah menjawab tiga pertanyaan juri." />
      <ol className="grid md:grid-cols-3 gap-4 text-sm">
        {[
          ['Akurat?', `Sistem menilai ${cases.length} cerita contoh yang labelnya sudah kami tentukan. Semakin banyak hasil yang sama dengan label, semakin akurat.`],
          ['Adil?', 'Fakta yang sama diuji ulang dengan wilayah dan gaya bahasa berbeda. Hasil yang adil tidak berubah karena hal itu.'],
          ['Mengapa tiga pelapor?', 'Simulasi skala menunjukkan bahwa ambang tiga pelapor berbeda menekan faskes baik yang salah ditandai.']
        ].map(([t, x], i) => (
          <li key={t} className="card p-4"><div className="text-[11px] font-extrabold tracking-wider uppercase text-emerald-700">Bagian {i + 1}</div><div className="font-bold text-slate-900 mt-0.5">{t}</div><p className="text-slate-600 mt-1 leading-relaxed">{x}</p></li>
        ))}
      </ol>

      <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-sm text-amber-950 flex gap-3">
        <Info className="w-5 h-5 shrink-0 text-amber-700 mt-0.5" />
        <div>Angka di bawah dihitung dari <strong>{cases.length} cerita fiktif</strong> yang dibuat dan diberi label oleh tim pengembang, jadi hanya gambaran awal. Ini bukan perkiraan kinerja di lapangan, dan tidak menyatakan adanya penghematan atau kecurangan.{missing.length > 0 && <> {missing.length} kasus tidak punya klaim pembanding dan dilewati.</>}</div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg" role="group" aria-label="Mesin analisis">
          <button type="button" disabled={running} onClick={() => setEngine('LOCAL')} className={`px-3 py-1.5 rounded-md text-sm font-semibold ${engine === 'LOCAL' ? 'bg-white shadow-xs' : 'text-slate-600'}`}>Mesin aturan lokal (pembanding dasar)</button>
          <button type="button" disabled={running} onClick={() => setEngine('GEMINI')} className={`px-3 py-1.5 rounded-md text-sm font-semibold ${engine === 'GEMINI' ? 'bg-white shadow-xs' : 'text-slate-600'}`}>Gemini lewat server</button>
        </div>
        <button type="button" onClick={run} disabled={running} className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
          {running ? <><Loader2 className="w-4 h-4 animate-spin" />Berjalan {progress}/{cases.length}</> : <><Play className="w-4 h-4" />Jalankan</>}
        </button>
        {running && <button type="button" onClick={() => { stop.current = true; }} className="text-sm underline text-slate-600">Hentikan</button>}
        {engine === 'GEMINI' && <span className="text-xs text-slate-500">Gemini butuh sekitar {Math.ceil(cases.length * 6.5 / 60)} menit (batas 10 permintaan/menit).</span>}
      </div>

      {rows.length > 0 && (
        <>
          <div className="text-xs text-slate-500">Mesin: {ranEngine === 'GEMINI' ? 'Gemini lewat server' : 'aturan lokal'} · n = {valid.length}{excluded > 0 && <> · {excluded} kasus dikeluarkan karena Gemini tidak menjawab (memakai mesin cadangan)</>}</div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card title="Hasil sama dengan label" value={pct(valid.filter(ok).length, valid.length)} sub={`${valid.filter(ok).length} dari ${valid.length} kasus`} />
            <Card title="Jenis utama saja (obat, tindakan, lama rawat)" value={pct(core.filter(ok).length, core.length)} sub={`${core.filter(ok).length} dari ${core.length} kasus`} />
            <Card title="Salah menandai" value={pct(wrongFlags.length, shouldNotFlag.length)} sub={`${wrongFlags.length} dari ${shouldNotFlag.length} kasus yang seharusnya tidak ditandai`} />
            <Card title="Tepat bilang 'info belum cukup'" value={pct(insufficient.filter(ok).length, insufficient.length)} sub={`${insufficient.filter(ok).length} dari ${insufficient.length} kasus`} />
          </div>
          <p className="text-xs text-slate-500">Aturan keamanan (tidak pernah memvonis; reliabilitas rendah tidak jadi sinyal) dijaga oleh kode validator dan lulus pada {valid.filter(r => r.ruleOk).length} dari {valid.length} kasus.</p>

          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 text-left"><tr><th className="p-3">Kasus</th><th className="p-3">Cerita</th><th className="p-3">Label</th><th className="p-3">Hasil</th></tr></thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.ec.id} className="border-t border-slate-100 align-top">
                    <td className="p-3 whitespace-nowrap"><span className="font-mono text-xs">{r.ec.id}</span>{r.core ? '' : <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">eksperimen</span>}</td>
                    <td className="p-3 text-slate-600 max-w-md"><span className="line-clamp-2">{r.ec.patient_story}</span></td>
                    <td className="p-3 whitespace-nowrap">{STATUS_ID[String(r.ec.expected_status)] || r.ec.expected_status}</td>
                    <td className={`p-3 whitespace-nowrap font-semibold ${r.excluded ? 'text-slate-400' : ok(r) ? 'text-emerald-700' : 'text-rose-700'}`}>{r.excluded ? 'dikeluarkan' : `${STATUS_ID[r.status!]} ${ok(r) ? '✓' : '✗'}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-start gap-3">
          <Scale className="w-5 h-5 text-slate-700 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-bold text-slate-900">Uji keadilan: apakah hasilnya tetap sama?</h3>
            <p className="text-sm text-slate-600 mt-1">Fakta yang sama diuji ulang dengan hal yang tidak relevan diubah: wilayah dan jenis faskes, serta cara pasien bercerita (baku, santai, angka dengan huruf, campur bahasa daerah, singkatan). Hasil yang adil tidak berubah karena hal-hal itu. Mesin yang dipakai mengikuti pilihan di atas.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={runFair} disabled={fairRunning || running} className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
            {fairRunning ? <><Loader2 className="w-4 h-4 animate-spin" />Berjalan</> : <><Play className="w-4 h-4" />Jalankan uji keadilan</>}
          </button>
          {engine === 'GEMINI' && <span className="text-xs text-slate-500">Dengan Gemini sekitar 2 menit (batas 10 permintaan/menit).</span>}
        </div>
        {fair.length > 0 && (
          <>
            <div className="text-xs text-slate-500">Mesin: {fairEngine === 'GEMINI' ? 'Gemini lewat server' : fairEngine === 'LOCAL' ? 'aturan lokal' : 'berjalan'} · {fairSum.total} varian diuji</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card title="Semua varian" value={pct(fairSum.same, fairSum.total)} sub={`${fairSum.same} dari ${fairSum.total} hasilnya sama`} />
              <Card title="Wilayah dan jenis faskes" value={pct(fairSum.wilayah.same, fairSum.wilayah.total)} sub={`${fairSum.wilayah.same} dari ${fairSum.wilayah.total}`} />
              <Card title="Gaya bahasa pasien" value={pct(fairSum.gaya.same, fairSum.gaya.total)} sub={`${fairSum.gaya.same} dari ${fairSum.gaya.total}`} />
            </div>
            <div className="space-y-3">
              {fair.map(r => (
                <div key={r.set.id} className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-slate-50 text-sm font-semibold text-slate-800 flex flex-wrap justify-between gap-2">
                    <span>{r.set.title}</span>
                    <span className={r.consistent ? 'text-emerald-700' : 'text-rose-700'}>{r.consistent ? 'konsisten' : 'ada yang berbeda'}</span>
                  </div>
                  <div className="px-3 py-2 text-xs text-slate-500">Dasar ({r.set.base.label}): {STATUS_ID[r.base.status]}, selisih {r.base.difference ?? '–'}</div>
                  <ul className="divide-y divide-slate-100 text-sm">
                    {r.outcomes.map(o => (
                      <li key={o.label} className="px-3 py-1.5 flex justify-between gap-3">
                        <span className="text-slate-700">{o.label}</span>
                        <span className={o.same ? 'text-emerald-700' : 'text-rose-700 font-semibold'}>{STATUS_ID[o.status]}, selisih {o.difference ?? '–'} {o.same ? '✓' : '✗'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500">Ini uji konsistensi pada cerita contoh, bukan bukti keadilan menyeluruh di lapangan. Hasil yang berbeda ditampilkan apa adanya.</p>
          </>
        )}
      </section>
    </div>
  );
};

const Card: React.FC<{ title: string; value: string; sub: string }> = ({ title, value, sub }) => (
  <div className="bg-white p-4 rounded-xl border border-slate-200">
    <div className="text-xs text-slate-500 font-semibold mb-1">{title}</div>
    <div className="text-3xl font-extrabold text-slate-900 font-mono">{value}</div>
    <div className="text-xs text-slate-500 mt-1">{sub}</div>
  </div>
);

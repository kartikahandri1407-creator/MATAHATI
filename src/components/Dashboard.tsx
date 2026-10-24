import React, { useMemo, useState } from 'react';
import { CaseRecord, Facility, FacilityPattern, TriageStatus } from '../types/matahati';
import { FacilityPatternCard } from './FacilityPatternCard';
import { AskPanel } from './AskPanel';
import { RISK_LABEL } from '../data/claimUtils';
import { PriorityScore } from '../services/priorityScore';
import { summarizeOutcomes } from '../data/outcomes';
import { PRIORITY_LABEL, TRIAGE_LABEL, sortQueue } from '../data/workflow';
import { STAGES, STAGE_HINT, STAGE_LABEL, Stage, caseStage, stageGroup } from '../data/stage';
import { PageHeader } from './PageHeader';
import { fmtTanggal } from '../data/format';
import { Building2, ChevronRight, Download, FileSpreadsheet, Search } from 'lucide-react';

interface DashboardProps {
  cases: CaseRecord[];
  facilityPatterns: FacilityPattern[];
  facilities: Facility[];
  scores?: Record<string, PriorityScore>;
  onOpenCaseDetail: (caseRecord: CaseRecord) => void;
  onExportJSON?: () => void;
}

const TRIAGE_CHIP: Record<TriageStatus, string> = {
  RISK_SIGNAL: 'bg-rose-50 text-rose-800 border-rose-200',
  POTENTIAL_DISCREPANCY: 'bg-amber-50 text-amber-900 border-amber-200',
  CONSISTENT: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  INSUFFICIENT_EVIDENCE: 'bg-slate-100 text-slate-700 border-slate-200'
};
const PRIORITY_BAR = { HIGH: 'bg-rose-600', MEDIUM: 'bg-amber-500', LOW: 'bg-slate-300' } as const;
const PRIORITY_TEXT = { HIGH: 'text-rose-700', MEDIUM: 'text-amber-700', LOW: 'text-slate-500' } as const;

const Chip: React.FC<{ className: string; children: React.ReactNode }> = ({ className, children }) => (
  <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${className}`}>{children}</span>
);

const Kpi: React.FC<{ icon: React.ReactNode; label: string; value: number; hint: string; tone: string; active?: boolean; onClick?: () => void }> = ({ icon, label, value, hint, tone, active, onClick }) => (
  <button type="button" onClick={onClick} aria-pressed={active}
    className={`text-left bg-white rounded-2xl border p-4 transition-shadow hover:shadow-md ${active ? 'border-emerald-600 ring-2 ring-emerald-100' : 'border-slate-200'}`}>
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${tone}`}>{icon}</span>
    </div>
    <div className="text-3xl font-extrabold text-tinta mt-2 tracking-tight">{value}</div>
    <div className="text-xs text-slate-500 mt-0.5">{hint}</div>
  </button>
);

export const Dashboard: React.FC<DashboardProps> = ({ cases, facilityPatterns, scores, onOpenCaseDetail, onExportJSON }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [stageF, setStageF] = useState<'ALL' | Stage>('ALL');
  const [filterRiskType, setFilterRiskType] = useState('ALL');
  const [quick, setQuick] = useState<'ALL' | 'ACT' | 'HIGH' | 'WAIT' | 'DONE'>('ALL');
  const [prioF, setPrioF] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [sortBy, setSortBy] = useState<'PRIORITAS' | 'TERBARU' | 'FASKES'>('PRIORITAS');
  const [limit, setLimit] = useState(10);
  const levelOf = (c: CaseRecord) => scores?.[c.case_id]?.level ?? c.verification_priority;
  const isAct = (c: CaseRecord) => ['BARU', 'DIPERIKSA', 'JAWABAN_DITERIMA'].includes(caseStage(c));
  const matchQuick = (c: CaseRecord, q: typeof quick) =>
    q === 'ALL' ? true : q === 'ACT' ? isAct(c) : q === 'HIGH' ? levelOf(c) === 'HIGH' && stageGroup(caseStage(c)) !== 'DONE' : q === 'WAIT' ? caseStage(c) === 'MENUNGGU_FASKES' : stageGroup(caseStage(c)) === 'DONE';
  const quickCount = (q: typeof quick) => cases.filter(c => matchQuick(c, q)).length;
  const anyFilter = quick !== 'ALL' || stageF !== 'ALL' || filterRiskType !== 'ALL' || prioF !== 'ALL' || searchTerm !== '';
  const resetFilters = () => { setQuick('ALL'); setStageF('ALL'); setFilterRiskType('ALL'); setPrioF('ALL'); setSearchTerm(''); setSortBy('PRIORITAS'); setLimit(10); };
  const outcomes = useMemo(() => summarizeOutcomes(cases), [cases]);

  const verifyOpen = useMemo(() => cases.filter(c => c.status === 'RISK_SIGNAL' && stageGroup(caseStage(c)) !== 'DONE').length, [cases]);

  const visible = useMemo(() => {
    const base = sortQueue(cases, scores ? (x => scores[x.case_id]?.total ?? 0) : undefined).filter(c => {
      if (!matchQuick(c, quick)) return false;
      if (stageF !== 'ALL' && caseStage(c) !== stageF) return false;
      if (filterRiskType !== 'ALL' && c.risk_type !== filterRiskType) return false;
      if (prioF !== 'ALL' && levelOf(c) !== prioF) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return c.case_id.toLowerCase().includes(q) || c.facility_name.toLowerCase().includes(q) || c.patient_statement.toLowerCase().includes(q) || c.reconciliation.finding.toLowerCase().includes(q);
      }
      return true;
    });
    if (sortBy === 'TERBARU') return [...base].sort((a, b) => (b.service_date || '').localeCompare(a.service_date || ''));
    if (sortBy === 'FASKES') return [...base].sort((a, b) => a.facility_name.localeCompare(b.facility_name, 'id'));
    return base;
  }, [cases, scores, quick, stageF, filterRiskType, prioF, searchTerm, sortBy]);

  const top = [...facilityPatterns].sort((a, b) => b.signal_count - a.signal_count)[0];
  const topCases = top ? cases.filter(c => top.case_ids.includes(c.case_id)) : [];
  // Satu klaim dihitung sekali, walau dilaporkan lebih dari satu kali.
  const topClaims = Array.from(new Map(topCases.map(c => [c.claim_key || c.case_id, c])).values());
  const topValue = topClaims.reduce((n, c) => n + (Number((c.claim_evidence as any)?.total_claim_amount) || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <PageHeader eyebrow="Petugas BPJS Kesehatan" title="Antrean Verifikasi"
        text="Laporan peserta yang sudah dibandingkan dengan catatan klaim. Kerjakan dari atas; yang paling perlu diperiksa sudah diurutkan."
        actions={cases.length > 0 && onExportJSON ? <button type="button" onClick={onExportJSON} className="btn-ghost h-10 px-3.5 text-sm flex items-center gap-1.5"><Download className="w-4 h-4" />Ekspor</button> : undefined} />

      {cases.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4 my-8">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto"><FileSpreadsheet className="w-7 h-7" /></div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Antrean kosong</h3>
            <p className="text-sm text-slate-600 mt-1">Belum ada laporan. Antrean terisi saat peserta mengirim jawabannya lewat Cek Layanan. Pengelola dapat mengembalikan data contoh dari Alat Demo.</p>
          </div>
        </div>
      ) : (
        <>
          {top && top.attention_level !== 'RENDAH' && (
            <section className="hero rounded-3xl p-6 sm:p-8 text-white grid gap-6 md:grid-cols-[1.4fr_1fr] md:items-center" aria-label="Sinyal terkuat">
              <div className="space-y-2 relative z-10">
                <div className="text-xs font-bold uppercase tracking-[.18em] text-matahari">Sinyal terkuat · 30 hari terakhir</div>
                <div className="text-5xl sm:text-6xl font-extrabold leading-none">{top.signal_count} <span className="text-2xl sm:text-3xl font-bold text-white/80">pelapor berbeda</span></div>
                <div className="text-lg font-semibold">{top.facility_name} · {RISK_LABEL[top.risk_type]}</div>
                <p className="text-sm text-white/70 max-w-md">Satu laporan lemah, tetapi beberapa pelapor yang tidak saling kenal menyebut hal serupa. Ini prioritas pemeriksaan, bukan kesimpulan kecurangan.</p>
              </div>
              <div className="relative z-10 rounded-2xl bg-white/10 border border-white/15 p-5 space-y-3">
                <div><div className="text-xs text-white/70">Total nilai klaim terkait (bukan kerugian)</div><div className="text-3xl font-extrabold">Rp {topValue.toLocaleString('id-ID')}</div><div className="text-xs text-white/70 mt-1">dari {topClaims.length} klaim, jumlah yang dibayarkan program</div></div>
                <button type="button" onClick={() => topCases[0] && onOpenCaseDetail(topCases[0])} className="w-full h-11 rounded-xl bg-matahari text-tinta font-extrabold hover:brightness-95">Periksa kasus pertama</button>
              </div>
            </section>
          )}

          <AskPanel cases={cases} patterns={facilityPatterns} scoreOf={id => scores?.[id]?.total ?? 0} onOpenCase={onOpenCaseDetail} />

          <section className="card p-5 space-y-4" aria-label="Posisi laporan">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-tinta">Di mana posisi setiap laporan</h3>
                <p className="text-xs text-slate-500 mt-0.5">{outcomes.total} laporan, masing-masing berada di tepat satu tahap. Klik sebuah tahap untuk menyaring daftar di bawah.</p>
              </div>
              {verifyOpen > 0 && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200">{verifyOpen} perlu diverifikasi dan belum selesai</span>}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {STAGES.map(st => {
                const n = outcomes.stages[st]; const on = stageF === st;
                return (
                  <button key={st} type="button" aria-pressed={on} onClick={() => setStageF(on ? 'ALL' : st)} title={STAGE_HINT[st]}
                    className={`text-left rounded-xl border p-3 transition ${on ? 'border-tinta bg-tinta text-white' : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'}`}>
                    <div className={`text-2xl font-extrabold tracking-tight ${on ? 'text-white' : n === 0 ? 'text-slate-300' : 'text-tinta'}`}>{n}</div>
                    <div className={`text-[11px] leading-tight font-semibold mt-0.5 ${on ? 'text-white/80' : 'text-slate-600'}`}>{STAGE_LABEL[st]}</div>
                  </button>);
              })}
            </div>
          </section>

          {facilityPatterns.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-base font-bold text-tinta flex items-center gap-2"><Building2 className="w-4 h-4 text-emerald-700" />Faskes dengan laporan serupa <span className="text-xs font-medium text-slate-500">30 hari terakhir</span></h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {facilityPatterns.map((pat, idx) => (
                  <FacilityPatternCard key={`${pat.facility_id}_${pat.risk_type}_${idx}`} pattern={pat}
                    onOpenCase={(caseId) => { const t = cases.find(c => c.case_id === caseId); if (t) onOpenCaseDetail(t); }} />
                ))}
              </div>
            </section>
          )}

          {outcomes.faskesAnswered > 0 && (
            <section className="card p-5 space-y-3" aria-label="Jawaban faskes">
              <div>
                <h3 className="text-base font-bold text-tinta">Apa kata faskes</h3>
                <p className="text-xs text-slate-500 mt-0.5">{outcomes.faskesAnswered} dari {outcomes.total} laporan sudah dijawab faskes. <b>{outcomes.benignAnswers}</b> berupa penjelasan wajar (sesuai catatan, stok kosong, atau layanan di tempat lain).</p>
              </div>
              <ul className="space-y-1.5">
                {outcomes.reasons.map(r => (
                  <li key={r.reason} className="flex items-center gap-3 text-sm">
                    <span className="w-6 text-right font-bold text-tinta">{r.count}</span>
                    <span className="flex-1 min-w-0"><span className="block h-2 rounded-full bg-emerald-600/80" style={{ width: `${Math.max(6, (r.count / outcomes.faskesAnswered) * 100)}%` }} /></span>
                    <span className="w-1/2 text-slate-700">{r.reason}</span>
                  </li>))}
              </ul>
              <p className="text-xs text-slate-500">Jawaban faskes belum diverifikasi lapangan. Angka ini membantu petugas melihat pola, bukan menyimpulkan.</p>
            </section>
          )}

          <section className="card overflow-hidden">
            <div className="p-4 border-b border-slate-100 space-y-3">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Saring cepat">
                {([['ALL', 'Semua'], ['ACT', 'Perlu ditindaklanjuti'], ['HIGH', 'Prioritas tinggi'], ['WAIT', 'Menunggu faskes'], ['DONE', 'Selesai']] as const).map(([k, t]) => {
                  const on = quick === k;
                  return <button key={k} type="button" aria-pressed={on} onClick={() => { setQuick(k); setLimit(10); }} className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition ${on ? 'bg-tinta text-white border-tinta' : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'}`}>{t} <span className={on ? 'text-white/80' : 'text-slate-400'}>{quickCount(k)}</span></button>;
                })}
              </div>
              <div className="flex flex-col gap-3">
                <div className="text-sm text-slate-600"><b className="text-tinta">{visible.length}</b> dari {cases.length} laporan{stageF !== 'ALL' && <> · tahap <b>{STAGE_LABEL[stageF]}</b></>}{anyFilter && <button type="button" onClick={resetFilters} className="ml-2 underline text-emerald-800 font-semibold">hapus semua filter</button>}</div>
                <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                  <div className="relative sm:flex-1 sm:min-w-[15rem] sm:max-w-sm">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="search" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setLimit(10); }} placeholder="Cari faskes atau nomor kasus" aria-label="Cari kasus"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-700" />
                  </div>
                  <select value={prioF} onChange={e => { setPrioF(e.target.value as any); setLimit(10); }} aria-label="Filter prioritas" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
                    <option value="ALL">Semua prioritas</option><option value="HIGH">Prioritas tinggi</option><option value="MEDIUM">Prioritas sedang</option><option value="LOW">Prioritas rendah</option>
                  </select>
                  <select value={filterRiskType} onChange={e => { setFilterRiskType(e.target.value); setLimit(10); }} aria-label="Filter jenis"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
                    <option value="ALL">Semua jenis</option>
                    {(['PENGURANGAN_JUMLAH_OBAT', 'TINDAKAN_TIDAK_DILAKUKAN', 'PROLONGED_LOS', 'IUR_BIAYA_ILEGAL', 'KUNJUNGAN_FIKTIF', 'READMISI_MANIPULATIF', 'UPCODING_DIAGNOSIS'] as const).map(k => <option key={k} value={k}>{RISK_LABEL[k]}</option>)}
                  </select>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} aria-label="Urutkan" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
                    <option value="PRIORITAS">Urut: prioritas</option><option value="TERBARU">Urut: tanggal layanan terbaru</option><option value="FASKES">Urut: nama faskes</option>
                  </select>
                </div>
              </div>
            </div>

            {visible.length === 0 ? (
              <div className="py-14 text-center text-sm text-slate-500">Tidak ada laporan yang cocok dengan filter ini. <button type="button" onClick={resetFilters} className="underline text-emerald-800 font-semibold">Hapus semua filter</button></div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {visible.slice(0, limit).map(c => (
                  <li key={c.case_id} className="group relative flex items-stretch hover:bg-slate-50 transition-colors">
                    <span className={`w-1.5 shrink-0 ${PRIORITY_BAR[scores?.[c.case_id]?.level ?? c.verification_priority]} ${stageGroup(caseStage(c)) === 'DONE' ? 'opacity-30' : ''}`} aria-hidden="true" />
                    <button type="button" onClick={() => onOpenCaseDetail(c)} className="flex-1 min-w-0 text-left px-4 py-3.5 grid gap-x-4 gap-y-1 md:grid-cols-[1.4fr_1.1fr_1fr_.9fr_auto] md:items-center">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate">{c.facility_name}</div>
                        <div className="text-xs text-slate-500"><span className="font-mono">{c.case_id}</span> · {fmtTanggal(c.service_date)}</div>
                      </div>
                      <div className="text-sm text-slate-700">{RISK_LABEL[c.risk_type]}{c.reconciliation.computed_difference != null && c.status !== 'CONSISTENT' && <div className="text-xs font-bold text-tinta mt-0.5"><span className="px-1.5 py-0.5 rounded bg-matahari-soft">selisih {c.reconciliation.computed_difference} {c.reconciliation.difference_unit || ''}</span></div>}</div>
                      <div><Chip className={TRIAGE_CHIP[c.status]}>{TRIAGE_LABEL[c.status]}</Chip></div>
                      <div className="text-sm">
                        <span className={`font-semibold ${PRIORITY_TEXT[scores?.[c.case_id]?.level ?? c.verification_priority]}`}>Prioritas {PRIORITY_LABEL[scores?.[c.case_id]?.level ?? c.verification_priority].toLowerCase()}</span>
                        <div className="text-xs text-slate-500">{STAGE_LABEL[caseStage(c)]}{scores?.[c.case_id] ? ` · indeks ${scores[c.case_id].total}` : ''}</div>
                      </div>
                      <ChevronRight className="hidden md:block w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {visible.length > limit && (
              <div className="p-4 border-t border-slate-100 text-center"><button type="button" onClick={() => setLimit(n => n + 10)} className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold hover:bg-slate-50">Tampilkan 10 lagi ({visible.length - limit} tersisa)</button></div>
            )}
          </section>
        </>
      )}

    </div>
  );
};

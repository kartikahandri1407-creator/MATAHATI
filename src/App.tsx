import React, { useEffect, useState } from 'react';
import { Header, TabId } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { ReportForm } from './components/ReportForm';
import { DataMaster } from './components/DataMaster';
import { EvaluationModal } from './components/EvaluationModal';
import { AboutModal } from './components/AboutModal';
import { CaseDetailModal } from './components/CaseDetailModal';
import { DraftClarificationModal } from './components/DraftClarificationModal';
import { CaseRecord, DummyClaim, Facility } from './types/matahati';
import { computeFacilityPatterns } from './services/aggregation';
import { nextCaseId, useCollection } from './data/store';
import { FaskesPortal } from './components/FaskesPortal';
import { MyReports } from './components/MyReports';
import { SimulasiSkala } from './components/SimulasiSkala';
import { Toast, Toasts } from './components/Toasts';
import { queueGroup } from './data/workflow';

const MINE_KEY = 'matahati_v7_mine';
const DEFAULT_MINE = ['RPT-001', 'RPT-005'];
const readMine = (): string[] => { try { const v = JSON.parse(localStorage.getItem(MINE_KEY) || 'null'); return Array.isArray(v) ? v : DEFAULT_MINE; } catch { return DEFAULT_MINE; } };
const readLarge = () => { try { return localStorage.getItem('matahati_v7_large') === '1'; } catch { return false; } };

export default function App() {
  const cases = useCollection<CaseRecord>('cases');
  const claims = useCollection<DummyClaim>('claims');
  const facilities = useCollection<Facility>('facilities');

  const [activeTab, setActiveTab] = useState<TabId>('report');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [geminiConfigured, setGeminiConfigured] = useState<boolean | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [draftCaseId, setDraftCaseId] = useState<string | null>(null);
  const [mineIds, setMineIds] = useState<string[]>(readMine);
  const [largeText, setLargeTextState] = useState<boolean>(readLarge);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = (text: string) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, text }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  };
  const setLargeText = (v: boolean) => {
    setLargeTextState(v);
    try { localStorage.setItem('matahati_v7_large', v ? '1' : '0'); } catch { /* abaikan */ }
  };
  useEffect(() => { document.documentElement.classList.toggle('teks-besar', largeText); }, [largeText]);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [activeTab]);

  useEffect(() => {
    fetch('/api/health').then(r => r.json()).then(j => setGeminiConfigured(!!j.geminiConfigured)).catch(() => setGeminiConfigured(false));
  }, []);

  const selectedCase = cases.items.find(c => c.case_id === selectedCaseId) || null;
  const draftCase = cases.items.find(c => c.case_id === draftCaseId) || null;

  const facilityPatterns = computeFacilityPatterns(cases.items, facilities.items);
  const mine = cases.items.filter(c => c.reporter_id && mineIds.includes(c.reporter_id));
  const openCount = cases.items.filter(c => queueGroup(c.verification_status) === 'OPEN').length;
  const highAttentionCount = facilityPatterns.filter(p => p.attention_level === 'TINGGI').length;

  const handleExportJSON = () => {
    const a = document.createElement('a');
    a.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(cases.items, null, 2));
    a.download = `Antrean_MATAHATI_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
  };

  const open = (c: CaseRecord) => setSelectedCaseId(c.case_id);
  const dbError = cases.error || claims.error || facilities.error;

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900 antialiased">
      <Header
        activeTab={activeTab} setActiveTab={setActiveTab}
        isDemoMode={isDemoMode} setIsDemoMode={setIsDemoMode}
        highAttentionCount={highAttentionCount} openCount={openCount}
        largeText={largeText} setLargeText={setLargeText}
        backend={cases.mode} geminiConfigured={geminiConfigured}
      />
      {dbError && <div className="bg-rose-50 border-b border-rose-200 text-rose-800 text-sm px-4 py-2" role="alert">{dbError}</div>}

      <main className="flex-1 pb-16" key={activeTab}>
        <div className="page">
        {cases.loading || claims.loading || facilities.loading ? (
          <div className="max-w-2xl mx-auto px-4 py-10 space-y-4" aria-busy="true" aria-label="Memuat data">
            {[0, 1, 2].map(i => <div key={i} className="h-24 rounded-2xl bg-slate-200/70 animate-pulse" />)}
          </div>
        ) : activeTab === 'report' ? (
          <ReportForm
            claims={claims.items} isDemoMode={isDemoMode}
            newCaseId={() => nextCaseId(cases.items)}
            onCaseAnalyzed={c => {
              cases.add(c);
              if (c.reporter_id) { const next = [...mineIds, c.reporter_id]; setMineIds(next); try { localStorage.setItem(MINE_KEY, JSON.stringify(next)); } catch { /* abaikan */ } }
              notify('Laporan diterima. Pantau di Laporan Saya.');
            }}
            onOpenCaseDetail={open}
            onGoToQueue={() => setActiveTab('queue')}
            onGoToMine={() => setActiveTab('mine')}
            onGoToDataMaster={() => setActiveTab('master')}
          />
        ) : activeTab === 'mine' ? (
          <MyReports cases={mine} claims={claims.items} onNew={() => setActiveTab('report')} />
        ) : activeTab === 'queue' ? (
          <Dashboard
            cases={cases.items} facilityPatterns={facilityPatterns} facilities={facilities.items}
            onOpenCaseDetail={open} onOpenNewReport={() => setActiveTab('report')}
            onResetSeedData={() => { cases.clear(); notify('Antrean dikosongkan'); }}
            onDeleteCase={id => { cases.remove(id); if (selectedCaseId === id) setSelectedCaseId(null); notify(`Kasus ${id} dihapus`); }}
            onExportJSON={handleExportJSON}
            onLoadHeroCase={() => { cases.reset(); notify('Data contoh dikembalikan'); }}
            onSimulateReporter={t => {
              const at = new Date().toISOString();
              cases.add({ ...t, case_id: nextCaseId(cases.items), reporter_id: `RPT-SIM-${Math.random().toString(36).slice(2, 6).toUpperCase()}`, verification_status: 'NEW', facility_response: undefined, created_at: at,
                audit_log: [{ timestamp: at, user_role: 'Sistem MATA HATI', action: 'SUBMITTED', note: 'Pelapor simulasi untuk demo pola faskes.' }] });
              notify('Pelapor simulasi ditambahkan. Perhatikan tingkat perhatian faskes.');
            }}
          />
        ) : activeTab === 'faskes' ? (
          <FaskesPortal cases={cases.items} claims={claims.items} facilities={facilities.items}
            onRespond={(c, reason, note) => {
              const at = new Date().toISOString();
              cases.update({ ...c, verification_status: 'UNDER_REVIEW', facility_response: { reason, note, at },
                audit_log: [...c.audit_log, { timestamp: at, user_role: 'Faskes (simulasi)', action: 'FACILITY_RESPONDED', note: `${reason}${note ? ` — ${note}` : ''}` }] });
              notify('Konfirmasi terkirim ke petugas');
            }} />
        ) : activeTab === 'master' ? (
          <DataMaster facilities={facilities} claims={claims} />
        ) : activeTab === 'eval' ? (
          <><EvaluationModal /><SimulasiSkala /></>
        ) : (
          <AboutModal />
        )}
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-5 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span><b className="text-slate-800">MATA HATI</b> · Monitoring &amp; Audit Tindakan FAskes Berbasis Hak &amp; Aspirasi PeserTa Integratif · Prototipe Healthkathon BPJS Kesehatan 2026 · semua data fiktif</span>
          <span>Hasil hanya prioritas pemeriksaan; keputusan ada pada petugas.</span>
        </div>
      </footer>

      {selectedCase && (
        <CaseDetailModal
          caseRecord={selectedCase}
          facilityPattern={facilityPatterns.find(p => p.facility_id === selectedCase.facility_id && p.risk_type === selectedCase.risk_type)}
          onClose={() => setSelectedCaseId(null)}
          onUpdateStatus={c => { cases.update(c); notify('Perubahan disimpan'); }}
          onOpenDraftModal={c => setDraftCaseId(c.case_id)}
        />
      )}
      {draftCase && (
        <DraftClarificationModal caseRecord={draftCase} onClose={() => setDraftCaseId(null)} onSaveDraft={c => { cases.update(c); notify('Draf surat disimpan'); }} />
      )}
      <Toasts items={toasts} />
    </div>
  );
}

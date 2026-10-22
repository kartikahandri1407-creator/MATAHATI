import React, { useEffect, useMemo, useState } from 'react';
import { Header } from './components/Header';
import { RoleBanner } from './components/RoleBanner';
import { DemoTools } from './components/DemoTools';
import { ROLES, Role, TabId, roleOfTab } from './data/roles';
import { Landing } from './components/Landing';
import { Dashboard } from './components/Dashboard';
import { ReportForm } from './components/ReportForm';
import { DataMaster } from './components/DataMaster';
import { EvaluationModal } from './components/EvaluationModal';
import { AboutModal } from './components/AboutModal';
import { CaseDetailModal } from './components/CaseDetailModal';
import { DraftClarificationModal } from './components/DraftClarificationModal';
import { CaseRecord, DummyClaim, Facility } from './types/matahati';
import { computeFacilityPatterns } from './services/aggregation';
import { scoreCase } from './services/priorityScore';
import { nextCaseId, useCollection } from './data/store';
import { FaskesPortal } from './components/FaskesPortal';
import { MyReports } from './components/MyReports';
import { SimulasiSkala } from './components/SimulasiSkala';
import { Toast, Toasts } from './components/Toasts';
import { caseGroup } from './data/stage';

const ROLE_KEY = 'matahati_v8_role';
const readRole = (): Role => { try { const v = localStorage.getItem(ROLE_KEY) as Role | null; return v && v in ROLES ? v : 'peserta'; } catch { return 'peserta'; } };
const readLarge = () => { try { return localStorage.getItem('matahati_v7_large') === '1'; } catch { return false; } };

export default function App() {
  const cases = useCollection<CaseRecord>('cases');
  const claims = useCollection<DummyClaim>('claims');
  const facilities = useCollection<Facility>('facilities');

  const [activeTab, setActiveTabRaw] = useState<TabId>('home');
  const [role, setRoleState] = useState<Role>(readRole);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [geminiConfigured, setGeminiConfigured] = useState<boolean | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [draftCaseId, setDraftCaseId] = useState<string | null>(null);
  const [largeText, setLargeTextState] = useState<boolean>(readLarge);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = (text: string) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, text }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  };
  const setRole = (r: Role) => { setRoleState(r); try { localStorage.setItem(ROLE_KEY, r); } catch { /* abaikan */ } };
  /** Pindah halaman; bila halaman itu milik peran lain, peran ikut berganti dan penanda di atas ikut berubah. */
  const setActiveTab = (tab: TabId) => { const r = roleOfTab(tab, role); if (r !== role) setRole(r); setActiveTabRaw(tab); };
  const enterAs = (r: Role) => { setRole(r); setActiveTabRaw(ROLES[r].home); };
  const switchRole = (r: Role) => { setRole(r); setActiveTabRaw(ROLES[r].home); notify(`Anda sekarang masuk sebagai ${ROLES[r].label}`); };
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
  const scores = useMemo(() => Object.fromEntries(cases.items.map(c => [c.case_id, scoreCase(c, facilityPatterns, claims.items)])), [cases.items, claims.items, facilityPatterns]);
  const answeredKeys = useMemo(() => cases.items.map(c => c.claim_key), [cases.items]);
  const openCount = cases.items.filter(c => caseGroup(c) === 'OPEN').length;
  const highAttentionCount = facilityPatterns.filter(p => p.attention_level === 'TINGGI').length;

  const handleExportJSON = () => {
    const a = document.createElement('a');
    a.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(cases.items, null, 2));
    a.download = `Antrean_MATAHATI_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
  };

  const open = (c: CaseRecord) => setSelectedCaseId(c.case_id);
  const dbError = cases.error || claims.error || facilities.error;

  if (activeTab === 'home') return <Landing onEnter={enterAs} />;

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900 antialiased">
      <Header
        activeTab={activeTab} setActiveTab={setActiveTab} role={role}
        isDemoMode={isDemoMode} setIsDemoMode={setIsDemoMode}
        highAttentionCount={highAttentionCount} openCount={openCount}
        largeText={largeText} setLargeText={setLargeText}
        backend={cases.mode} geminiConfigured={geminiConfigured}
      />
      <div className="md:pl-64 sticky top-14 md:top-0 z-30"><RoleBanner role={role} onChange={switchRole} /></div>
      {dbError && <div className="bg-rose-50 border-b border-rose-200 text-rose-800 text-sm px-4 py-2" role="alert">{dbError}</div>}

      <main className="flex-1 pb-16 md:pl-64" key={activeTab}>
        <div className="page">
        {cases.loading || claims.loading || facilities.loading ? (
          <div className="max-w-2xl mx-auto px-4 py-10 space-y-4" aria-busy="true" aria-label="Memuat data">
            {[0, 1, 2].map(i => <div key={i} className="h-24 rounded-2xl bg-slate-200/70 animate-pulse" />)}
          </div>
        ) : activeTab === 'report' ? (
          <ReportForm
            claims={claims.items} answeredKeys={answeredKeys} isDemoMode={isDemoMode}
            newCaseId={() => nextCaseId(cases.items)}
            onCaseAnalyzed={c => {
              cases.add(c);
              notify('Laporan diterima. Pantau di Laporan Saya.');
            }}
            onOpenCaseDetail={open}
            onGoToQueue={() => setActiveTab('queue')}
            onGoToMine={() => setActiveTab('mine')}
            onGoToDataMaster={() => setActiveTab('master')}
          />
        ) : activeTab === 'mine' ? (
          <MyReports cases={cases.items} claims={claims.items} onNew={() => setActiveTab('report')} />
        ) : activeTab === 'queue' ? (
          <Dashboard
            cases={cases.items} facilityPatterns={facilityPatterns} facilities={facilities.items} scores={scores}
            onOpenCaseDetail={open}
            onDeleteCase={id => { cases.remove(id); if (selectedCaseId === id) setSelectedCaseId(null); notify(`Kasus ${id} dihapus`); }}
            onExportJSON={handleExportJSON}
          />
        ) : activeTab === 'faskes' ? (
          <FaskesPortal cases={cases.items} claims={claims.items} facilities={facilities.items}
            onRespond={(c, reason, note) => {
              const at = new Date().toISOString();
              cases.update({ ...c, verification_status: 'UNDER_REVIEW', facility_response: { reason, note, at },
                audit_log: [...c.audit_log, { timestamp: at, user_role: 'Faskes', action: 'FACILITY_RESPONDED', note: `${reason}${note ? ` — ${note}` : ''}` }] });
              notify('Konfirmasi terkirim ke petugas');
            }} />
        ) : activeTab === 'tools' ? (
          <DemoTools cases={cases.items} patterns={facilityPatterns} onExport={handleExportJSON}
            onSimulate={(t: CaseRecord) => {
              const at = new Date().toISOString();
              cases.add({ ...t, case_id: nextCaseId(cases.items), reporter_id: `RPT-SIM-${Math.random().toString(36).slice(2, 6).toUpperCase()}`, verification_status: 'NEW', facility_response: undefined, created_at: at,
                audit_log: [{ timestamp: at, user_role: 'Alat demo', action: 'SUBMITTED', note: 'Pelapor tambahan dibuat dari Alat Demo untuk memperagakan pola faskes.' }] });
              notify('Satu pelapor tambahan dibuat. Lihat tingkat perhatian faskes di Antrean.');
            }}
            onClear={() => { cases.clear(); notify('Antrean dikosongkan'); }}
            onReset={() => { cases.reset(); notify('Data contoh dikembalikan'); }} />
        ) : activeTab === 'master' ? (
          <DataMaster facilities={facilities} claims={claims} />
        ) : activeTab === 'eval' ? (
          <><EvaluationModal /><SimulasiSkala /></>
        ) : (
          <AboutModal />
        )}
        </div>
      </main>

      <footer className="md:pl-64 bg-white border-t border-slate-200 py-5 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span><b className="text-slate-800">MATA HATI</b> · Prototipe Healthkathon BPJS Kesehatan 2026 · data fiktif berbasis sebaran data sampel</span>
          <span>Hasil hanya prioritas pemeriksaan. Keputusan ada pada petugas.</span>
        </div>
      </footer>

      {selectedCase && (
        <CaseDetailModal
          caseRecord={selectedCase}
          score={scores[selectedCase.case_id]}
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

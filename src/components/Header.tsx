import React from 'react';
import { BarChart3, Building2, ClipboardCheck, Database, FilePlus2, Home, Info, ListChecks, Type, Wrench } from 'lucide-react';
import { ROLES, Role, TAB_LABEL, TabId } from '../data/roles';

export type { TabId } from '../data/roles';

interface HeaderProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  role: Role;
  isDemoMode: boolean;
  setIsDemoMode: (val: boolean) => void;
  highAttentionCount: number;
  openCount: number;
  backend: 'checking' | 'database' | 'browser';
  geminiConfigured: boolean | null;
  largeText: boolean;
  setLargeText: (v: boolean) => void;
}

type Icon = React.FC<{ className?: string }>;
const ICON: Record<TabId, Icon> = { home: Home, report: FilePlus2, mine: ListChecks, queue: ClipboardCheck, faskes: Building2, master: Database, eval: BarChart3, tools: Wrench, about: Info };

export const Logo: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => (
  <span className={`${className} grid place-items-center rounded-lg bg-tinta text-white font-extrabold text-xs`} aria-hidden="true">MH</span>
);

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, role, isDemoMode, setIsDemoMode, highAttentionCount, openCount, geminiConfigured, largeText, setLargeText }) => {
  const def = ROLES[role];
  const tabs = def.tabs;
  const aiLabel = isDemoMode ? 'Analisis: mesin aturan' : geminiConfigured === false ? 'Analisis: mesin aturan' : geminiConfigured ? 'Analisis: Gemini' : 'Analisis: memeriksa...';
  const aiDot = isDemoMode || geminiConfigured === false ? 'bg-matahari' : geminiConfigured ? 'bg-emerald-300' : 'bg-white/40';
  return (
    <>
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 z-40 flex-col side">
        <button type="button" onClick={() => setActiveTab('home')} className="px-6 pt-7 pb-5 text-left" aria-label="MATA HATI, ke beranda">
          <div className="text-2xl font-extrabold tracking-tight">MATA<span className="text-emerald-400"> HATI</span></div>
          <div className="text-[11px] text-white/55 mt-1 leading-snug">Konfirmasi layanan JKN oleh peserta</div>
        </button>
        <div className="mx-4 mb-4 rounded-xl bg-white/[.07] border border-white/10 px-3.5 py-3">
          <div className="text-[10px] uppercase tracking-widest text-white/45">Anda masuk sebagai</div>
          <div className="mt-1 flex items-center gap-2 font-bold text-sm"><span className={`w-2 h-2 rounded-full ${def.dot}`} />{def.label}</div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 space-y-1" aria-label="Menu utama">
          {tabs.map(id => { const Ic = ICON[id]; return (
            <button key={id} type="button" onClick={() => setActiveTab(id)} aria-current={activeTab === id ? 'page' : undefined}
              className={`w-full px-3 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2.5 transition-colors ${activeTab === id ? 'bg-white text-tinta shadow-sm' : 'text-white/75 hover:text-white hover:bg-white/10'}`}>
              <Ic className="w-4 h-4" />{TAB_LABEL[id].label}
              {id === 'queue' && openCount > 0 && <span className="ml-auto text-xs px-1.5 rounded font-bold bg-matahari text-tinta">{openCount}</span>}
            </button>); })}
        </nav>
        <div className="p-4 space-y-2 border-t border-white/10 text-xs text-white/70">
          {role === 'pengelola' || role === 'petugas' ? (
            <button type="button" onClick={() => setIsDemoMode(!isDemoMode)} className="flex items-center gap-2 hover:text-white" title="Klik untuk ganti antara Gemini dan mesin aturan">
              <span className={`w-1.5 h-1.5 rounded-full ${aiDot}`} />{aiLabel}
            </button>
          ) : null}
          {role === 'petugas' && highAttentionCount > 0 && <div className="flex items-center gap-2 text-matahari"><span className="w-1.5 h-1.5 rounded-full bg-matahari" />{highAttentionCount} faskes perlu perhatian</div>}
          <button type="button" onClick={() => setLargeText(!largeText)} aria-pressed={largeText} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border ${largeText ? 'bg-white text-tinta border-white' : 'border-white/25 hover:bg-white/10'}`}><Type className="w-4 h-4" />Teks besar</button>
        </div>
      </aside>
      <header className="md:hidden sticky top-0 z-40 side px-4 h-14 flex items-center justify-between">
        <button type="button" onClick={() => setActiveTab('home')} className="text-lg font-extrabold tracking-tight" aria-label="MATA HATI, ke beranda">MATA<span className="text-emerald-400"> HATI</span></button>
        <button type="button" onClick={() => setLargeText(!largeText)} aria-pressed={largeText} className="p-2 rounded-lg border border-white/25" title="Perbesar teks"><Type className="w-4 h-4" /></button>
      </header>

      {/* Navigasi bawah untuk layar kecil: hanya menu milik peran ini */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 pb-[env(safe-area-inset-bottom)]" aria-label="Menu utama">
        <ul className="grid" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
          {tabs.map(id => { const Ic = ICON[id]; return (
            <li key={id}>
              <button type="button" onClick={() => setActiveTab(id)} aria-current={activeTab === id ? 'page' : undefined}
                className={`relative w-full flex flex-col items-center gap-0.5 pt-2 pb-1.5 text-[11px] font-semibold ${activeTab === id ? 'text-emerald-800' : 'text-slate-500'}`}>
                <span className={`px-3.5 py-1 rounded-full ${activeTab === id ? 'bg-emerald-100' : ''}`}><Ic className="w-5 h-5" /></span>
                {TAB_LABEL[id].short}
                {id === 'queue' && openCount > 0 && <span className="absolute top-1 right-[22%] min-w-4 h-4 px-1 rounded-full bg-matahari text-tinta text-[10px] font-bold flex items-center justify-center">{openCount}</span>}
              </button>
            </li>); })}
        </ul>
      </nav>
    </>
  );
};

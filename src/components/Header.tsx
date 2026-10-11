import React from 'react';
import { Building2, BarChart3, ClipboardCheck, Database, FilePlus2, Home, Info, ListChecks, Type } from 'lucide-react';

export type TabId = 'home' | 'report' | 'mine' | 'queue' | 'faskes' | 'master' | 'eval' | 'about';

interface HeaderProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
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
const GROUPS: { label: string; tabs: { id: TabId; label: string; short: string; Icon: Icon }[] }[] = [
  { label: 'Peserta', tabs: [
    { id: 'report', label: 'Cek Layanan', short: 'Cek', Icon: FilePlus2 },
    { id: 'mine', label: 'Laporan Saya', short: 'Laporan', Icon: ListChecks }] },
  { label: 'Petugas', tabs: [
    { id: 'queue', label: 'Antrean', short: 'Antrean', Icon: ClipboardCheck }] },
  { label: 'Faskes', tabs: [
    { id: 'faskes', label: 'Konfirmasi', short: 'Faskes', Icon: Building2 }] },
  { label: 'Kelola', tabs: [
    { id: 'master', label: 'Data Master', short: 'Data', Icon: Database },
    { id: 'eval', label: 'Evaluasi', short: 'Evaluasi', Icon: BarChart3 },
    { id: 'about', label: 'Tentang', short: 'Tentang', Icon: Info }] }
];

export const Logo: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => (
  <span className={`${className} grid place-items-center rounded-lg bg-tinta text-white font-extrabold text-xs`} aria-hidden="true">MH</span>
);

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, isDemoMode, setIsDemoMode, highAttentionCount, openCount, backend, geminiConfigured, largeText, setLargeText }) => {
  const aiLabel = isDemoMode ? 'Analisis: mesin aturan' : geminiConfigured === false ? 'Analisis: mesin aturan' : geminiConfigured ? 'Analisis: Gemini' : 'Analisis: memeriksa...';
  const aiDot = isDemoMode || geminiConfigured === false ? 'bg-matahari' : geminiConfigured ? 'bg-emerald-300' : 'bg-white/40';
  return (
    <>
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 z-40 flex-col bg-tinta text-white">
        <button type="button" onClick={() => setActiveTab('home')} className="px-6 pt-7 pb-6 text-left" aria-label="MATA HATI, ke beranda">
          <div className="text-2xl font-extrabold tracking-tight">MATA<span className="text-emerald-400"> HATI</span></div>
          <div className="text-[11px] text-white/55 mt-1 leading-snug">Prototipe Healthkathon<br />BPJS Kesehatan 2026</div>
        </button>
        <nav className="flex-1 overflow-y-auto px-3 space-y-5" aria-label="Menu utama">
          <button type="button" onClick={() => setActiveTab('home')} className="w-full px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2.5 text-white/75 hover:text-white hover:bg-white/10"><Home className="w-4 h-4" />Beranda</button>
          {GROUPS.map(g => (
            <div key={g.label}>
              <div className="px-3 mb-1.5 text-[10px] uppercase tracking-widest text-white/40">{g.label}</div>
              {g.tabs.map(({ id, label, Icon }) => (
                <button key={id} type="button" onClick={() => setActiveTab(id)} aria-current={activeTab === id ? 'page' : undefined}
                  className={`w-full px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2.5 transition-colors ${activeTab === id ? 'bg-white text-tinta' : 'text-white/75 hover:text-white hover:bg-white/10'}`}>
                  <Icon className="w-4 h-4" />{label}
                  {id === 'queue' && openCount > 0 && <span className="ml-auto text-xs px-1.5 rounded font-bold bg-matahari text-tinta">{openCount}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="p-4 space-y-2 border-t border-white/10 text-xs text-white/70">
          <button type="button" onClick={() => setIsDemoMode(!isDemoMode)} className="flex items-center gap-2 hover:text-white" title="Klik untuk ganti antara Gemini dan mesin aturan">
            <span className={`w-1.5 h-1.5 rounded-full ${aiDot}`} />{aiLabel}
          </button>
          {highAttentionCount > 0 && <div className="flex items-center gap-2 text-matahari"><span className="w-1.5 h-1.5 rounded-full bg-matahari" />{highAttentionCount} faskes perlu perhatian</div>}
          <button type="button" onClick={() => setLargeText(!largeText)} aria-pressed={largeText} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border ${largeText ? 'bg-white text-tinta border-white' : 'border-white/25 hover:bg-white/10'}`}><Type className="w-4 h-4" />Teks besar</button>
        </div>
      </aside>
      <header className="md:hidden sticky top-0 z-40 bg-tinta text-white px-4 h-14 flex items-center justify-between">
        <button type="button" onClick={() => setActiveTab('home')} className="text-lg font-extrabold tracking-tight" aria-label="MATA HATI, ke beranda">MATA<span className="text-emerald-400"> HATI</span></button>
        <button type="button" onClick={() => setLargeText(!largeText)} aria-pressed={largeText} className="p-2 rounded-lg border border-white/25" title="Perbesar teks"><Type className="w-4 h-4" /></button>
      </header>

      {/* Navigasi bawah untuk layar kecil */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)]" aria-label="Menu utama">
        <ul className="grid grid-cols-7">
          {GROUPS.flatMap(g => g.tabs).map(({ id, short, Icon }) => (
            <li key={id}>
              <button type="button" onClick={() => setActiveTab(id)} aria-current={activeTab === id ? 'page' : undefined}
                className={`relative w-full flex flex-col items-center gap-0.5 pt-2 pb-1.5 text-[10px] font-semibold ${activeTab === id ? 'text-emerald-800' : 'text-slate-500'}`}>
                <span className={`px-3 py-1 rounded-full ${activeTab === id ? 'bg-emerald-100' : ''}`}><Icon className="w-5 h-5" /></span>
                {short}
                {id === 'queue' && openCount > 0 && <span className="absolute top-1 right-2 min-w-4 h-4 px-1 rounded-full bg-matahari text-tinta text-[10px] font-bold flex items-center justify-center">{openCount}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
};

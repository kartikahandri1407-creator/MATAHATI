import React from 'react';
import { Building2, BarChart3, ClipboardCheck, Database, FilePlus2, Info, ListChecks, Type } from 'lucide-react';

export type TabId = 'report' | 'mine' | 'queue' | 'faskes' | 'master' | 'eval' | 'about';

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
  <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
    <rect width="40" height="40" rx="10" fill="#17654a" />
    <path d="M5 20c4-6.5 9.5-9.5 15-9.5S31 13.500 35 20c-4 6.500-9.500 9.500-15 9.500S9 26.500 5 20Z" fill="none" stroke="#fff" strokeWidth="2.200" strokeLinejoin="round" />
    <path d="M20 25.200c-3.600-2.600-5.200-4.300-5.200-6.200 0-1.500 1.100-2.600 2.600-2.600 1 0 1.900.5 2.600 1.500.7-1 1.600-1.500 2.600-1.500 1.500 0 2.600 1.100 2.600 2.600 0 1.900-1.600 3.600-5.200 6.200Z" fill="#f0b429" />
  </svg>
);

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, isDemoMode, setIsDemoMode, highAttentionCount, openCount, backend, geminiConfigured, largeText, setLargeText }) => {
  const aiLabel = isDemoMode ? 'Analisis: mesin aturan' : geminiConfigured === false ? 'Analisis: mesin aturan' : geminiConfigured ? 'Analisis: Gemini' : 'Analisis: memeriksa...';
  const aiDot = isDemoMode || geminiConfigured === false ? 'bg-matahari' : geminiConfigured ? 'bg-emerald-300' : 'bg-white/40';
  return (
    <>
      <header className="bg-tinta text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            <button type="button" onClick={() => setActiveTab('report')} className="flex items-center gap-3 shrink-0 text-left" aria-label="MATA HATI, ke beranda">
              <Logo />
              <div className="leading-tight">
                <div className="font-extrabold tracking-tight text-lg">MATA HATI</div>
                <div className="text-xs text-white/60 hidden 2xl:block">Peserta tahu haknya, petugas tahu prioritasnya</div>
              </div>
            </button>
            <nav className="hidden md:flex items-center gap-3" aria-label="Menu utama">
              {GROUPS.map((g, gi) => (
                <div key={g.label} className={`flex items-center gap-1 ${gi > 0 ? 'pl-3 border-l border-white/15' : ''}`}>
                  <span className="hidden 2xl:block text-[10px] uppercase tracking-widest text-white/40 mr-1.5">{g.label}</span>
                  {g.tabs.map(({ id, label, Icon }) => (
                    <button key={id} type="button" onClick={() => setActiveTab(id)} aria-current={activeTab === id ? 'page' : undefined}
                      className={`px-2.5 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors ${activeTab === id ? 'bg-white text-tinta' : 'text-white/75 hover:text-white hover:bg-white/10'}`}>
                      <Icon className="w-4 h-4" />{label}
                      {id === 'queue' && openCount > 0 && <span className={`text-xs px-1.5 rounded font-bold ${activeTab === id ? 'bg-matahari text-tinta' : 'bg-matahari/90 text-tinta'}`}>{openCount}</span>}
                    </button>
                  ))}
                </div>
              ))}
            </nav>
            <button type="button" onClick={() => setLargeText(!largeText)} aria-pressed={largeText} title="Perbesar teks"
              className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${largeText ? 'bg-white text-tinta border-white' : 'text-white/80 border-white/25 hover:bg-white/10'}`}>
              <Type className="w-4 h-4" /><span className="hidden 2xl:inline">Teks besar</span>
            </button>
          </div>
        </div>
        <div className="bg-black/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-white/75">
            <span className="flex items-center gap-1.5"><span className={`w-1.5 h-1.5 rounded-full ${backend === 'database' ? 'bg-emerald-300' : 'bg-white/40'}`} />{backend === 'database' ? 'Terhubung ke basis data' : backend === 'browser' ? 'Mode lokal' : 'Memeriksa data...'}</span>
            <button type="button" onClick={() => setIsDemoMode(!isDemoMode)} className="flex items-center gap-1.5 hover:text-white" title="Klik untuk ganti antara Gemini dan mesin lokal">
              <span className={`w-1.5 h-1.5 rounded-full ${aiDot}`} />{aiLabel}
            </button>
            {highAttentionCount > 0 && <span className="hidden sm:flex items-center gap-1.5 text-matahari"><span className="w-1.5 h-1.5 rounded-full bg-matahari" />{highAttentionCount} faskes perlu perhatian</span>}
          </div>
        </div>
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

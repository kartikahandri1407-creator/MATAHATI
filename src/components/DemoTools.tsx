import React, { useState } from 'react';
import { CaseRecord, FacilityPattern } from '../types/matahati';
import { RISK_LABEL } from '../data/claimUtils';
import { PageHeader } from './PageHeader';
import { Download, Eraser, RotateCcw, UserPlus, TriangleAlert } from 'lucide-react';

interface Props {
  cases: CaseRecord[];
  patterns: FacilityPattern[];
  onExport: () => void;
  onSimulate: (template: CaseRecord) => void;
  onClear: () => void;
  onReset: () => void;
}

const LEVEL: Record<FacilityPattern['attention_level'], string> = {
  TINGGI: 'bg-rose-50 text-rose-800 border-rose-200', SEDANG: 'bg-amber-50 text-amber-900 border-amber-200', RENDAH: 'bg-slate-100 text-slate-700 border-slate-200'
};

/** Perlengkapan menyiapkan atau mengulang peragaan. Milik pengelola, bukan petugas, agar alur petugas tetap mengikuti laporan peserta yang sebenarnya. */
export const DemoTools: React.FC<Props> = ({ cases, patterns, onExport, onSimulate, onClear, onReset }) => {
  const [confirm, setConfirm] = useState<'clear' | 'reset' | null>(null);
  const sorted = [...patterns].sort((a, b) => b.signal_count - a.signal_count);
  const target = sorted.find(p => p.attention_level !== 'TINGGI') || sorted[0];
  const template = target ? cases.find(c => target.case_ids.includes(c.case_id)) : undefined;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <PageHeader eyebrow="Pengelola" title="Alat Demo" text="Perlengkapan untuk menyiapkan atau mengulang peragaan. Alur sebenarnya tetap dimulai dari laporan peserta; alat ini hanya mempercepat persiapan." />

      <div className="flex gap-3 items-start rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-950">
        <TriangleAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <p>Data prototipe dipakai bersama oleh semua pengguna. Perubahan di halaman ini terlihat oleh semua peran. Ekspor antrean lebih dulu bila Anda ingin menyimpan salinan.</p>
      </div>

      <section className="card p-5 space-y-4" aria-label="Peragaan pola faskes">
        <div>
          <h3 className="font-bold text-tinta">Peragakan pola per faskes</h3>
          <p className="text-sm text-slate-600 mt-0.5">Perhatian pada sebuah faskes naik bila tiga pelapor berbeda menyebut hal serupa. Untuk video, cara paling jujur adalah mengirim tiga laporan lewat sisi peserta. Bila waktu terbatas, tambahkan satu pelapor tambahan di sini.</p>
        </div>
        {sorted.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada pola. Kirim laporan dari sisi peserta lebih dulu.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {sorted.map((p, i) => (
              <li key={`${p.facility_id}_${p.risk_type}_${i}`} className="px-4 py-3 flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0"><div className="font-semibold text-slate-900 truncate">{p.facility_name}</div><div className="text-xs text-slate-500">{RISK_LABEL[p.risk_type]}</div></div>
                <div className="flex items-center gap-3 shrink-0"><span className="text-slate-700"><b>{p.signal_count}</b> dari 3 pelapor</span><span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${LEVEL[p.attention_level]}`}>{p.attention_level.toLowerCase()}</span></div>
              </li>))}
          </ul>
        )}
        <button type="button" disabled={!template} onClick={() => template && onSimulate(template)} className="btn-primary h-11 px-4 text-sm flex items-center gap-2"><UserPlus className="w-4 h-4" />Tambah 1 pelapor{target ? ` di ${target.facility_name}` : ''}</button>
      </section>

      <section className="card p-5 space-y-3" aria-label="Kelola antrean">
        <h3 className="font-bold text-tinta">Kelola antrean ({cases.length} laporan)</h3>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onExport} disabled={cases.length === 0} className="btn-ghost h-10 px-3.5 text-sm flex items-center gap-2 disabled:opacity-50"><Download className="w-4 h-4" />Ekspor antrean</button>
          <button type="button" onClick={() => setConfirm('reset')} className="btn-ghost h-10 px-3.5 text-sm flex items-center gap-2"><RotateCcw className="w-4 h-4" />Kembalikan data contoh</button>
          <button type="button" onClick={() => setConfirm('clear')} disabled={cases.length === 0} className="h-10 px-3.5 text-sm flex items-center gap-2 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 font-semibold disabled:opacity-50"><Eraser className="w-4 h-4" />Kosongkan antrean</button>
        </div>
      </section>

      {confirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 space-y-4">
            <div>
              <h4 className="font-bold text-slate-900">{confirm === 'clear' ? 'Kosongkan seluruh antrean?' : 'Kembalikan data contoh?'}</h4>
              <p className="text-sm text-slate-600 mt-1">{confirm === 'clear' ? `Semua ${cases.length} laporan dihapus untuk semua pengguna.` : 'Antrean diganti dengan laporan contoh awal. Laporan yang Anda kirim akan hilang.'}</p>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setConfirm(null)} className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">Batal</button>
              <button type="button" onClick={() => { const c = confirm; setConfirm(null); if (c === 'clear') onClear(); else onReset(); }} className="px-3.5 py-2 rounded-lg text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white">Ya, lanjutkan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

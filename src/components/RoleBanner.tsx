import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeftRight, Check, Home } from 'lucide-react';
import { ROLES, ROLE_ORDER, Role } from '../data/roles';

/** Penanda tetap "Anda masuk sebagai ..." dengan pengganti peran. Tampil di setiap halaman. */
export const RoleBanner: React.FC<{ role: Role; onChange: (r: Role) => void; onHome: () => void }> = ({ role, onChange, onHome }) => {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const def = ROLES[role];
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', h); document.addEventListener('keydown', k);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k); };
  }, [open]);

  return (
    <div className="relative z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur">
      <div className={`h-1 ${def.bar}`} aria-hidden="true" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3" ref={box}>
        <div className="min-w-0 flex items-center gap-2.5 sm:gap-3">
          <span className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${def.chip}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${def.dot}`} />Masuk sebagai <span className="sm:hidden">{def.short}</span><span className="hidden sm:inline">{def.label}</span>
          </span>
          <span className="hidden lg:block text-sm text-slate-600 truncate">{def.oneLiner}</span>
        </div>
        <div className="relative shrink-0">
          <button type="button" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-haspopup="menu"
            className="h-9 px-3 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5">
            <ArrowLeftRight className="w-4 h-4" />Ganti peran
          </button>
          {open && (
            <div role="menu" className="absolute right-0 mt-2 w-[min(92vw,22rem)] rounded-2xl bg-white border border-slate-200 shadow-[0_24px_48px_-16px_rgba(10,42,94,.35)] p-2">
              <div className="px-3 pt-2 pb-1.5 text-[11px] text-slate-500 leading-snug">Prototipe ini belum memakai login, jadi peran dipilih manual. Pada produksi, peran ditentukan oleh akun.</div>
              {ROLE_ORDER.map(r => {
                const d = ROLES[r];
                return (
                  <button key={r} type="button" role="menuitemradio" aria-checked={r === role} onClick={() => { setOpen(false); if (r !== role) onChange(r); }}
                    className={`w-full text-left rounded-xl px-3 py-2.5 flex items-start gap-3 hover:bg-slate-50 ${r === role ? 'bg-slate-50' : ''}`}>
                    <span className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${d.dot}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-slate-900">{d.label}</span>
                      <span className="block text-xs text-slate-600 leading-snug">{d.oneLiner}</span>
                      <span className="block text-[11px] text-slate-400 mt-0.5">Tidak bisa membuka: {d.notSees}</span>
                    </span>
                    {r === role && <Check className="w-4 h-4 text-emerald-700 mt-0.5" />}
                  </button>);
              })}
              <div className="border-t border-slate-100 mt-1 pt-1">
                <button type="button" role="menuitem" onClick={() => { setOpen(false); onHome(); }} className="w-full text-left rounded-xl px-3 py-2.5 flex items-center gap-3 hover:bg-slate-50 text-sm font-semibold text-slate-700"><Home className="w-4 h-4 text-slate-500" />Kembali ke beranda</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

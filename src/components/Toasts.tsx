import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export interface Toast { id: number; text: string }

export const Toasts: React.FC<{ items: Toast[] }> = ({ items }) => (
  <div className="fixed left-1/2 -translate-x-1/2 bottom-24 md:bottom-6 z-[60] flex flex-col gap-2 items-center pointer-events-none" role="status" aria-live="polite">
    {items.map(t => (
      <div key={t.id} className="toast pointer-events-auto bg-tinta text-white text-sm font-medium pl-3 pr-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />{t.text}
      </div>
    ))}
  </div>
);

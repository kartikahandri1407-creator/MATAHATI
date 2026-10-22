import React from 'react';

/** Kepala halaman seragam: nama peran, judul, dan satu kalimat "apa yang bisa Anda lakukan di sini". */
export const PageHeader: React.FC<{ eyebrow: string; title: string; text: string; actions?: React.ReactNode }> = ({ eyebrow, title, text, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
    <div className="min-w-0">
      <div className="eyebrow">{eyebrow}</div>
      <h2 className="page-title mt-1">{title}</h2>
      <p className="text-sm sm:text-[15px] text-slate-600 mt-1.5 max-w-2xl leading-relaxed">{text}</p>
    </div>
    {actions && <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>}
  </div>
);
